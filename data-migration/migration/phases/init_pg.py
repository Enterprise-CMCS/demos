"""Bootstrap PG cluster: roles, schemas, extensions, helper fns. Apply DDL + seeds.

`run_ddl` in particular is the integration point for the Prisma-owned
schema. It fetches and applies the Prisma-generated SQL, captures the
FKs Prisma emits inline so the bulk build can run unconstrained, then
applies migration-private supplements (the JSONB schema registry; the
``*_history`` tables are Prisma-owned, not authored here).
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg
import yaml
from psycopg import sql as psql

from migration.lib import (
    INIT_SCHEMAS_SQL,
    PRISMA_FKS_FILE,
    PRISMA_SEEDED_TABLES_FILE,
    REPORTS_DIR,
    SQL_DIR,
    STATE_DIR,
    Env,
    apply_dir,
    copy_csv_into_table,
    log,
    progress_for,
    psql_command,
    psql_exec_composed,
    psql_file,
    psql_query,
    rel,
    skip_jsonschema,
)
from migration.phases.fetch_prisma import ensure_prisma_ddl
from migration.phases.prod_schema_guard import run_prod_schema_guard

# The pg_jsonschema extension is isolated in this init file so a SKIP_JSONSCHEMA
# build can omit it. Kept in sync with the file created in sql/00_init/.
JSONSCHEMA_EXTENSION_FILE = "02b_extensions_jsonschema.sql"

# Permissive replacement for pg_jsonschema's jsonb_matches_schema(json, jsonb)
# installed only under SKIP_JSONSCHEMA. It makes every downstream validation
# call succeed so the registry/oracle/parity SQL applies and runs against a
# stock Postgres. Signature matches the extension's so callers resolve it.
JSONSCHEMA_STUB_SQL = """
CREATE OR REPLACE FUNCTION public.jsonb_matches_schema(schema json, instance jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT true
$$;
"""


def run_init() -> None:
    """Apply ``sql/00_init/*`` (roles, schemas, extensions, helper functions).

    Normally applies the whole directory. Under ``SKIP_JSONSCHEMA`` the
    ``pg_jsonschema`` extension file is skipped and a permissive
    ``jsonb_matches_schema`` stub is installed in its place, so the build runs
    against a stock Postgres that lacks the extension (it is migration-internal
    only; no live ``demos_app.*`` column uses it).
    """
    env = Env.load()
    init_dir = SQL_DIR / "00_init"
    if not skip_jsonschema():
        apply_dir(env, init_dir, expect_files=True)
        return

    files = sorted(init_dir.glob("*.sql"))
    if not files:
        from migration.lib import die

        die(f"required directory has no *.sql files: {rel(init_dir)}")
    for f in files:
        if f.name == JSONSCHEMA_EXTENSION_FILE:
            log(
                "SKIP_JSONSCHEMA: skipping pg_jsonschema extension; "
                "installing permissive jsonb_matches_schema stub"
            )
            psql_command(env, JSONSCHEMA_STUB_SQL)
            continue
        psql_file(env, f)


def _capture_fks(env: Env) -> list[dict[str, str]]:
    """Return Prisma-emitted FKs on ``demos_app.*`` as a list of dicts.

    Each entry has ``schema``, ``table``, ``name``, and ``definition``
    (the full ``FOREIGN KEY ... REFERENCES ...`` clause emitted by
    ``pg_get_constraintdef``). Order is stable for deterministic
    re-apply at constraint time.
    """
    rows = psql_query(
        env,
        """
        SELECT n.nspname AS schema_name,
               c.relname AS table_name,
               con.conname AS constraint_name,
               pg_get_constraintdef(con.oid) AS definition
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'f'
          AND n.nspname = 'demos_app'
        ORDER BY n.nspname, c.relname, con.conname
        """,
    )
    return [
        {
            "schema": str(r[0]),
            "table": str(r[1]),
            "name": str(r[2]),
            "definition": str(r[3]),
        }
        for r in rows
    ]


def _drop_fks(env: Env, fks: list[dict[str, str]]) -> None:
    """Drop every FK in ``fks`` so the bulk build runs without enforcement.

    Uses ``psycopg.sql.Identifier`` per the policy documented on
    :func:`migration.lib.psql_query`; that keeps the round-trip
    symmetric with :func:`migration.phases.constraints._readd_captured_fks`
    without re-defining a hand-rolled quoter in both modules.
    """
    if not fks:
        log("no FKs found in demos_app.*; nothing to drop")
        return
    for fk in fks:
        stmt = psql.SQL(
            "ALTER TABLE {tbl} DROP CONSTRAINT IF EXISTS {con}"
        ).format(
            tbl=psql.Identifier(fk["schema"], fk["table"]),
            con=psql.Identifier(fk["name"]),
        )
        psql_exec_composed(env, stmt)
    log(f"dropped {len(fks)} FK(s) in demos_app.*")


def _write_fks(fks: list[dict[str, str]]) -> None:
    """Persist captured FK definitions for later re-apply in P5."""
    STATE_DIR.mkdir(exist_ok=True)
    PRISMA_FKS_FILE.write_text(
        json.dumps(fks, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    log(f"wrote {rel(PRISMA_FKS_FILE)} ({len(fks)} FKs)")


def _capture_seeded_tables(env: Env) -> list[str]:
    """Return the ``demos_app.*`` base tables that hold rows right after Prisma apply.

    These are exactly the Prisma-seeded reference/lookup/config tables
    (static constraints, type limiters, ``state``, ``role``, ``phase``,
    the tag dictionary, RBAC config, ...). Because this runs at ddl time
    -- before any stg/demos_app build or data load -- every non-empty
    ``demos_app`` table is a Prisma seed, so the result is the set
    ``build_app`` must not truncate. Empty data tables the migration
    populates later are correctly excluded.
    """
    rows = psql_query(
        env,
        """
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'demos_app'
          AND t.table_type = 'BASE TABLE'
          AND (xpath(
                '/row/cnt/text()',
                query_to_xml(
                  format('SELECT count(*) AS cnt FROM demos_app.%I', t.table_name),
                  false, true, ''
                )
              ))[1]::text::bigint > 0
        ORDER BY t.table_name
        """,
    )
    return [str(r[0]) for r in rows]


def _write_seeded_tables(names: list[str]) -> None:
    """Persist the Prisma-seeded reference tables for build_app's truncation guard."""
    STATE_DIR.mkdir(exist_ok=True)
    PRISMA_SEEDED_TABLES_FILE.write_text(
        json.dumps(names, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    log(f"wrote {rel(PRISMA_SEEDED_TABLES_FILE)} ({len(names)} seeded tables)")


def run_ddl() -> None:
    """Apply the Prisma-generated DDL and migration-private supplements.

    Steps:

    1. Fetch (or use cached) Prisma SQL via :func:`ensure_prisma_ddl`,
       which verifies SHA256 against ``reports/prisma_ddl.sha256``.
    2. ``DROP SCHEMA demos_app CASCADE`` so the (typically
       non-idempotent) Prisma SQL applies cleanly.
    3. Re-apply ``sql/00_init/01_schemas.sql`` to (re)create the empty
       ``demos_app`` schema owned by ``migration_owner`` *before* Prisma
       runs -- the Prisma artifact only ``SET search_path TO demos_app``
       and never ``CREATE SCHEMA``s, so the schema must already exist.
       App-facing grants on ``demos_app`` are owned by DEMOS
       ``server/src/sql/permissions.sql`` and applied later by the
       operator via ``refreshDbObjects.ts`` -- not here.
    4. Apply the cached Prisma SQL.
    5. Capture every FK in ``demos_app.*`` to ``state/prisma_fks.json``
       and drop them so the bulk build runs unconstrained.
    6. Apply ``sql/01_ddl_supplements/*`` (migration-private JSONB
       registry; the ``*_history`` tables are Prisma-owned, not authored
       here).
    """
    env = Env.load()

    prisma_sql = ensure_prisma_ddl(env)

    # Guard the irreversible DROP: confirm the live target demos_app matches a
    # reference that already has the pinned artifact applied, so a stale pin
    # cannot rebuild a schema the live app has moved past. Emptiness is not
    # checked here (we are about to DROP); it is enforced at preflight before
    # build_app writes.
    run_prod_schema_guard(require_empty=False, label="ddl-pre-rebuild")

    log("resetting demos_app schema for Prisma DDL apply")
    psql_command(env, "DROP SCHEMA IF EXISTS demos_app CASCADE;")

    # (Re)create the empty demos_app schema (owned by migration_owner)
    # before the Prisma artifact runs: Prisma only SETs search_path to
    # demos_app and never CREATE SCHEMAs it, so it must already exist.
    # App-facing grants are owned by DEMOS permissions.sql.
    log("(re)creating demos_app schema before Prisma apply")
    psql_file(env, INIT_SCHEMAS_SQL)

    log(f"applying prisma ddl: {rel(prisma_sql)}")
    psql_file(env, prisma_sql)

    log("capturing FKs from Prisma DDL for late-binding apply")
    fks = _capture_fks(env)
    _write_fks(fks)
    _drop_fks(env, fks)

    apply_dir(env, SQL_DIR / "01_ddl_supplements", expect_files=True)

    # Record the Prisma-seeded reference tables (non-empty demos_app.*
    # tables at ddl time) so build_app can skip them when truncating; otherwise the
    # bulk build would wipe lookups the migration never re-seeds. Runs
    # after supplements, whose history shadows are created empty and so do
    # not appear in the captured set.
    log("capturing Prisma-seeded reference tables for build_app truncation guard")
    _write_seeded_tables(_capture_seeded_tables(env))


JSONB_SCHEMA_DIR: Path = REPORTS_DIR / "jsonb_schemas"


def discover_jsonb_schemas(directory: Path = JSONB_SCHEMA_DIR) -> list[tuple[str, str]]:
    """Return ``(name, json_text)`` for every promoted ``*.schema.json``.

    The registry name is the filename with the ``.schema.json`` suffix
    stripped. Drafts (``*.draft.json``) are ignored: only schemas an SME
    has signed off and renamed to ``.schema.json`` are loaded. Results
    are sorted by name for deterministic registration order.
    """
    schemas: list[tuple[str, str]] = []
    for path in sorted(directory.glob("*.schema.json")):
        name = path.name.removesuffix(".schema.json")
        schemas.append((name, path.read_text(encoding="utf-8")))
    return schemas


def load_jsonb_schemas(env: Env) -> int:
    """Load promoted JSON schemas into ``migration.jsonb_schemas``.

    The canonical source is ``reports/jsonb_schemas/*.schema.json`` (the
    SME-reviewed artifacts); this is the loader the registry reference
    describes. Each schema is upserted by name so re-running is
    idempotent and a revised schema simply overwrites the prior row.
    Returns the number of schemas registered.
    """
    schemas = discover_jsonb_schemas()
    if not schemas:
        log("no promoted jsonb schemas (reports/jsonb_schemas/*.schema.json); skipping")
        return 0
    for name, body in schemas:
        psql_query(
            env,
            """
            INSERT INTO migration.jsonb_schemas (name, schema, registered_at)
            VALUES (%s, %s::jsonb, now())
            ON CONFLICT (name) DO UPDATE
              SET schema = EXCLUDED.schema, registered_at = EXCLUDED.registered_at
            """,
            (name, body),
        )
        log(f"registered jsonb schema '{name}'")
    return len(schemas)


def run_seeds() -> None:
    """Apply static seed and limiter SQL directories, then load JSONB schemas.

    Note: the 29 static-constraint and 14 type-limiter lookup tables are
    seeded by the Prisma artifact applied in :func:`run_ddl`; this repo
    only seeds migration-private reference data (e.g.
    ``migration.state_region``) and registers the JSONB schemas.
    """
    env = Env.load()
    apply_dir(env, SQL_DIR / "02_seeds_static")
    apply_dir(env, SQL_DIR / "03_seeds_limiters")
    load_jsonb_schemas(env)


CROSSWALK_REGISTRY_FILE: Path = REPORTS_DIR / "crosswalks" / "registry.yaml"


def _load_crosswalk_registry() -> list[tuple[str, str, list[str] | None]]:
    """Read ``reports/crosswalks/registry.yaml`` -> ``(table, csv_path, columns)``.

    The registry is the explicit list of crosswalk tables the phase loads from
    CSV. A missing or malformed entry dies fail-closed rather than silently
    skipping a crosswalk (which would leave the table empty and the downstream
    ``*_check.sql`` RED).

    ``columns`` is the exact ordered CSV header; it is passed to
    ``copy_csv_into_table`` as ``header_expect`` so a renamed/reordered/missing
    column fails closed instead of mis-loading.
    """
    from migration.lib import die

    if not CROSSWALK_REGISTRY_FILE.exists():
        die(f"crosswalk registry missing: {rel(CROSSWALK_REGISTRY_FILE)}")
    data = yaml.safe_load(CROSSWALK_REGISTRY_FILE.read_text(encoding="utf-8")) or {}
    entries = data.get("crosswalks") or []
    if not entries:
        die(f"crosswalk registry has no entries: {rel(CROSSWALK_REGISTRY_FILE)}")
    out: list[tuple[str, str, list[str] | None]] = []
    for e in entries:
        cols = e.get("columns")
        columns = [str(c) for c in cols] if cols is not None else None
        out.append((str(e["table"]), str(e["csv"]), columns))
    return out


def _drop_crosswalk_dependent_views(env: Env) -> list[str]:
    """Drop every view that depends on a ``mysql_raw.crosswalk_*`` table so the
    crosswalk DDL's ``DROP TABLE`` can re-run (re-entrancy).

    Each ``sql/04_crosswalks/*.sql`` recreates its table with
    ``DROP TABLE IF EXISTS mysql_raw.crosswalk_* `` (no ``CASCADE``). On a fresh
    rebuild this is fine -- crosswalks run before any dependent object exists --
    but on a targeted rebuild or any second run, ``stg.*`` views (e.g.
    ``stg.users_resolved`` -> ``crosswalk_role_person_type``) and
    ``migration._parity_*`` views built by later phases depend on those tables,
    so the ``DROP TABLE`` fails. Those views are all regenerated downstream
    (``build_stg`` and ``parity`` recreate them via ``CREATE OR REPLACE``), so
    dropping them here is safe and makes the phase re-entrant.

    ``pg_depend`` finds the directly-dependent views; ``DROP VIEW ... CASCADE``
    then also removes any transitive view-on-view. Returns the fully-qualified
    names dropped (for logging/tests).
    """
    find_dependent_views = """
        SELECT DISTINCT n.nspname AS view_schema, v.relname AS view_name
        FROM pg_depend d
        JOIN pg_rewrite rw ON rw.oid = d.objid
        JOIN pg_class v ON v.oid = rw.ev_class AND v.relkind = 'v'
        JOIN pg_namespace n ON n.oid = v.relnamespace
        JOIN pg_class src ON src.oid = d.refobjid AND src.relkind = 'r'
        JOIN pg_namespace sn ON sn.oid = src.relnamespace
        WHERE sn.nspname = 'mysql_raw'
          AND src.relname LIKE 'crosswalk\\_%' ESCAPE '\\'
    """
    dropped: list[str] = []
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        rows = conn.execute(find_dependent_views).fetchall()
        for view_schema, view_name in rows:
            conn.execute(
                psql.SQL("DROP VIEW IF EXISTS {} CASCADE").format(
                    psql.Identifier(view_schema, view_name)
                )
            )
            dropped.append(f"{view_schema}.{view_name}")
    return dropped


def run_crosswalks() -> None:
    """Load crosswalk CSVs into ``mysql_raw.crosswalk_*`` in three ordered steps.

    0. Drop any views that depend on a ``crosswalk_*`` table so the DDL's
       ``DROP TABLE`` can re-run (re-entrancy; the views regenerate downstream).
    1. Apply every non-check ``sql/04_crosswalks/*.sql`` (DDL: DROP/CREATE TABLE).
    2. COPY each registry CSV into its table via ``copy_csv_into_table``.
    3. Apply every ``*_check.sql`` (fail-closed completeness checks).

    The split guarantees the tables exist before the CSVs load and the CSVs are
    loaded before the checks compare them against the live source domain.
    """
    env = Env.load()
    dropped_views = _drop_crosswalk_dependent_views(env)
    if dropped_views:
        log(
            f"dropped {len(dropped_views)} crosswalk-dependent view(s) for re-entrancy "
            f"(regenerated by build_stg/parity): {', '.join(dropped_views)}"
        )
    cw_dir = SQL_DIR / "04_crosswalks"
    files = sorted(cw_dir.glob("*.sql"))
    creators = [f for f in files if not f.name.endswith("_check.sql")]
    checks = [f for f in files if f.name.endswith("_check.sql")]

    with progress_for(len(creators), "apply crosswalk DDL") as p:
        for f in creators:
            p.step(rel(f))
            psql_file(env, f)

    registry = _load_crosswalk_registry()
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        for table, csv_name, columns in registry:
            n = copy_csv_into_table(
                conn,
                "mysql_raw",
                table,
                REPORTS_DIR / csv_name,
                header_expect=columns,
            )
            log(f"loaded {table}: {n} row(s) from {csv_name}")

    with progress_for(len(checks), "apply crosswalk checks") as p:
        for f in checks:
            p.step(rel(f))
            psql_file(env, f)


def run_id_maps() -> None:
    """Apply ``sql/05_id_maps/*`` to create and populate ``migration._id_map_*``."""
    env = Env.load()
    apply_dir(env, SQL_DIR / "05_id_maps")
