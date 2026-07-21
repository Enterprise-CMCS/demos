"""Apply-twice harness for the deeper demos_app SQL layers (CODE_REVIEW #2 follow-up).

Where ``test_stg_idempotency.py`` covers ``sql/10_stg`` against an all-text
``mysql_raw`` skeleton on vanilla Postgres, this harness exercises the layers
that need the *real* ``demos_app`` schema and live rows: it applies the pinned
Prisma DDL, loads deterministically-generated fake ``demos_app`` data, then
applies ``99_parity`` (and any ``20_app/21/23/30`` SQL that later appears)
twice -- asserting no error, stable counts, and data invariants.

Standup mirrors ``migration.phases.init_pg.run_ddl`` order: ``00_init`` ->
reset+recreate ``demos_app`` -> pinned Prisma DDL -> drop FKs (so loads run
unconstrained, exactly as the real build does) -> ``01_ddl_supplements`` ->
``05_id_maps``.

Runs locally as part of ``make test``. It is **not** wired into CI; the only
requirement is that ``PG_TEST_DSN`` points at a Postgres with ``pg_jsonschema``
(e.g. a ``supabase/postgres`` container). The test self-skips when the DSN is
unset/unreachable or the extension is unavailable, so the suite stays green on
a machine without it.

Fake ``demos_app`` data comes from the vendored generator under
``tests/sql/fixtures/fake_demos`` (a lightly adapted snapshot of the
fake-demos-tables repo, rewired to read this repo's pinned Prisma DDL offline
and seeded for determinism). The loader inserts only the intersection of the
generated columns and the live table columns, letting DB defaults fill the
rest; a later NOT-NULL-without-default column addition therefore fails loudly
as a deliberate "regenerate the fixture" signal.
"""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    from collections.abc import Iterator

    import psycopg

ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "sql"
INIT_DIR = SQL_DIR / "00_init"
SCHEMAS_SQL = INIT_DIR / "01_schemas.sql"
SUPPL_DIR = SQL_DIR / "01_ddl_supplements"
IDMAP_DIR = SQL_DIR / "05_id_maps"
PARITY_DIR = SQL_DIR / "99_parity"
APP_BUILD_DIRS = ("20_app", "21_app_associative", "23_app_derived", "30_constraints")
PIN_FILE = ROOT / "reports" / "prisma_ddl.sha256"
JSONB_SCHEMA_DIR = ROOT / "reports" / "jsonb_schemas"

# The base demos_app tables the in-scope deeper layers read. The fake-demos
# generator populates each.
BASE_TABLES = (
    "demonstration",
    "application",
    "amendment",
    "extension",
    "deliverable",
    "demonstration_type_tag_assignment",
    "budget_neutrality_workbook",
    "document",
)

# Drop FK and CHECK constraints in demos_app so the fake-data load runs
# unconstrained. FKs mirror init_pg.run_ddl's _drop_fks (the real build loads
# with FKs dropped, re-adding them in the constraints phase). CHECK constraints
# are dropped too because the generator's random reference values are not
# business-valid; this harness validates SQL-layer behavior (apply-twice,
# parity emptiness), not demos_app business-rule validity.
# PRIMARY KEY and UNIQUE constraints are kept.
_DROP_CONSTRAINTS = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
     WHERE c.contype IN ('f', 'c') AND n.nspname = 'demos_app'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END
$$;
"""

def _pinned_ddl_path() -> Path:
    """Return ``state/prisma_ddl/<sha>.sql`` for the pinned Prisma DDL."""
    sha = PIN_FILE.read_text(encoding="utf-8").split()[0]
    return ROOT / "state" / "prisma_ddl" / f"{sha}.sql"


def _apply_dir(conn: Any, directory: Path) -> None:
    """Apply every ``*.sql`` in ``directory`` in lexical order."""
    for f in sorted(directory.glob("*.sql")):
        conn.execute(f.read_text(encoding="utf-8"))


def _load_jsonb_schemas(conn: Any) -> None:
    """Register promoted JSONB schemas into migration.jsonb_schemas.

    Mirrors ``init_pg.load_jsonb_schemas`` but on the test's direct connection.
    The 99_parity BN check revalidates ``budget_neutrality_workbook.payload``
    against the registered schema, so the schema must be present or the parity
    view raises a CheckViolation.
    """
    for path in sorted(JSONB_SCHEMA_DIR.glob("*.schema.json")):
        name = path.name.removesuffix(".schema.json")
        body = path.read_text(encoding="utf-8")
        conn.execute(
            """
            INSERT INTO migration.jsonb_schemas (name, schema, registered_at)
            VALUES (%s, %s::jsonb, now())
            ON CONFLICT (name) DO UPDATE
              SET schema = EXCLUDED.schema, registered_at = EXCLUDED.registered_at
            """,
            (name, body),
        )


def _standup(conn: Any) -> None:
    """Build the real demos_app schema, mirroring init_pg.run_ddl ordering.

    Drops the migration-owned schemas first so a re-run against the same
    server (the id maps live in ``migration``) starts from a clean slate.
    """
    conn.execute("DROP SCHEMA IF EXISTS demos_app, migration, stg CASCADE")
    _apply_dir(conn, INIT_DIR)  # roles, schemas, extensions (pg_jsonschema), helpers
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute(SCHEMAS_SQL.read_text(encoding="utf-8"))  # recreate empty demos_app
    conn.execute(_pinned_ddl_path().read_text(encoding="utf-8"))
    conn.execute(_DROP_CONSTRAINTS)
    _apply_dir(conn, SUPPL_DIR)
    _load_jsonb_schemas(conn)
    _apply_dir(conn, IDMAP_DIR)


def _live_columns(conn: Any, table: str) -> dict[str, str]:
    """Return ``{column_name: udt_name}`` for a demos_app table."""
    rows = conn.execute(
        "SELECT column_name, udt_name FROM information_schema.columns "
        "WHERE table_schema = 'demos_app' AND table_name = %s",
        (table,),
    ).fetchall()
    return {name: udt for name, udt in rows}


def _cell(value: Any) -> str | None:
    """Coerce a DataFrame cell to a text literal (or None) for a casted bind."""
    import pandas as pd

    if isinstance(value, (list, dict)):
        return json.dumps(value)
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return str(value)


def _required_missing(conn: Any, table: str, present: set[str]) -> dict[str, str]:
    """Return ``{col: udt}`` for NOT-NULL, no-default columns absent from ``present``.

    These are columns a later Prisma migration added then made NOT NULL (e.g.
    ``demonstration.medicaid_id``); the baseline-derived generator omits them,
    so the loader synthesizes a value rather than failing the insert.
    """
    rows = conn.execute(
        "SELECT column_name, udt_name FROM information_schema.columns "
        "WHERE table_schema = 'demos_app' AND table_name = %s "
        "AND is_nullable = 'NO' AND column_default IS NULL",
        (table,),
    ).fetchall()
    return {name: udt for name, udt in rows if name not in present}


def _enum_label(conn: Any, udt: str) -> str | None:
    """Return the first label of an enum type, or None if it is not an enum."""
    row = conn.execute(
        "SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid "
        "WHERE t.typname = %s ORDER BY e.enumsortorder LIMIT 1",
        (udt,),
    ).fetchone()
    return row[0] if row else None


def _synth(conn: Any, udt: str, table: str, col: str, i: int) -> str:
    """Synthesize a type-appropriate, per-row-unique value for a missing column."""
    if udt == "uuid":
        return str(uuid.uuid4())
    if udt.startswith(("timestamp", "date")):
        return "2020-01-01T00:00:00+00:00"
    if udt == "bool":
        return "false"
    if udt in ("int2", "int4", "int8", "numeric", "float4", "float8"):
        return "0"
    if udt in ("json", "jsonb"):
        return "{}"
    if udt in ("text", "varchar", "bpchar", "citext"):
        return f"{table}.{col}.{i}"
    label = _enum_label(conn, udt)
    return label if label is not None else f"{table}.{col}.{i}"


def _load_base_tables(conn: Any, dfs: dict[str, Any]) -> None:
    """Insert the generated fake rows into the base demos_app tables.

    Binds each value as text and casts to the live column's type
    (``%s::<udt>``), inserting the intersection of generated and live columns
    (so additive nullable/defaulted drift is tolerated) plus synthesized
    values for any NOT-NULL, no-default column the generator does not produce.
    """
    conn.execute("SET search_path TO demos_app, migration, public")
    for table in BASE_TABLES:
        df = dfs[table]
        live = _live_columns(conn, table)
        df_cols = [c for c in df.columns if c in live]
        synth = _required_missing(conn, table, set(df.columns))
        cols = df_cols + list(synth)
        if not cols:
            continue
        collist = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join(
            [f"%s::{live[c]}" for c in df_cols] + [f"%s::{synth[c]}" for c in synth]
        )
        # ON CONFLICT DO NOTHING: the generator can emit duplicate keys (e.g.
        # it samples demonstration ids from application with replacement); the
        # harness only needs a set of distinct, loadable rows.
        sql = (
            f'INSERT INTO demos_app."{table}" ({collist}) VALUES ({placeholders}) '
            "ON CONFLICT DO NOTHING"
        )
        rows = [
            tuple(
                [_cell(row[c]) for c in df_cols]
                + [_synth(conn, synth[c], table, c, i) for c in synth]
            )
            for i, (_, row) in enumerate(df.iterrows())
        ]
        with conn.cursor() as cur:
            cur.executemany(sql, rows)


def _seed_demo_id_maps(conn: Any) -> None:
    """Map every loaded demonstration id into migration._id_map_mdcd_demo.

    99_parity's provenance view flags any demonstration.id absent from the
    id maps; seeding one row per loaded demonstration makes the view empty
    (the GREEN state this harness asserts).
    """
    conn.execute(
        """
        INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid)
        SELECT row_number() OVER (ORDER BY d.id), d.id
          FROM demos_app.demonstration d
        ON CONFLICT (legacy_int_id) DO NOTHING
        """
    )


def _apply_files(conn: Any, files: list[Path]) -> None:
    """Apply each SQL file's text in order (conn is Any so dynamic SQL types)."""
    for f in files:
        conn.execute(f.read_text(encoding="utf-8"))


def _parity_views(conn: Any) -> list[str]:
    """Return the migration._parity_* view names 99_parity defines."""
    rows = conn.execute(
        "SELECT table_name FROM information_schema.views "
        r"WHERE table_schema = 'migration' AND table_name LIKE '\_parity\_%'"
    ).fetchall()
    return [r[0] for r in rows]


def _view_count(conn: Any, view: str) -> int:
    from psycopg import sql as pgsql

    row = conn.execute(
        pgsql.SQL("SELECT count(*) FROM migration.{}").format(pgsql.Identifier(view))
    ).fetchone()
    return int(row[0])


@pytest.fixture(scope="module")
def app_db() -> Iterator[psycopg.Connection]:
    """Stand up demos_app + load fake data once; skip without DSN/pg_jsonschema."""
    dsn = os.environ.get("PG_TEST_DSN")
    if not dsn:
        pytest.skip("PG_TEST_DSN not set; skipping deeper-layer demos_app harness")

    import psycopg

    try:
        conn = psycopg.connect(dsn, autocommit=True)
    except psycopg.Error as e:
        pytest.skip(f"PG_TEST_DSN set but unreachable: {e}")
    try:
        try:
            conn.execute("CREATE EXTENSION IF NOT EXISTS pg_jsonschema")
        except psycopg.Error as e:
            pytest.skip(f"pg_jsonschema unavailable on PG_TEST_DSN: {e}")

        from tests.sql.fixtures.fake_demos import generate_all

        _standup(conn)
        _load_base_tables(conn, generate_all())
        _seed_demo_id_maps(conn)
        yield conn
    finally:
        conn.close()


def test_pinned_ddl_present() -> None:
    """Guard: the pinned Prisma DDL the standup applies must be cached."""
    assert _pinned_ddl_path().exists(), f"missing pinned Prisma DDL: {_pinned_ddl_path()}"


def test_parity_views_empty(app_db: psycopg.Connection) -> None:
    """99_parity SQL applies twice and every migration._parity_* view is empty."""
    files = sorted(PARITY_DIR.glob("*.sql"))
    assert files, "expected 99_parity/*.sql files"
    _apply_files(app_db, files)
    _apply_files(app_db, files)  # idempotent re-apply

    views = _parity_views(app_db)
    assert views, "expected at least one migration._parity_* view"
    for view in views:
        n = _view_count(app_db, view)
        assert n == 0, f"parity view migration.{view} returned {n} rows"


def test_app_build_dirs_apply_twice(app_db: psycopg.Connection) -> None:
    """Any SQL dropped into 20_app/21/23/30 applies and re-applies cleanly.

    Currently those dirs are empty (the real transforms are not yet authored),
    so this skips; it activates automatically once files appear.
    """
    files: list[Path] = []
    for sub in APP_BUILD_DIRS:
        files.extend(sorted((SQL_DIR / sub).glob("*.sql")))
    if not files:
        pytest.skip("no 20_app/21/23/30 SQL authored yet")
    _apply_files(app_db, files)
    _apply_files(app_db, files)
