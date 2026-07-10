"""Pre-rebuild guard: diff the live target demos_app against a reference PG.

The greenfield cutover writes ``demos_app`` into the live DEMOS prod RDS by
``DROP SCHEMA demos_app CASCADE`` + re-applying the *pinned* Prisma artifact
(``init_pg.run_ddl``), then ``build_app`` writes the transformed post-stg
layer. If prod's deployed schema or Prisma seeds have drifted past our pin,
that DROP installs a stale schema the live app no longer expects -- an
irreversible mistake, and the single most dangerous moment in the run.

This guard compares the live *target* (what we are about to DROP/rebuild and
write, i.e. ``env.pg_dsn()``) against a live *reference* that already has the
pinned artifact applied (``env.reference_pg_url`` -- the rehearsal/staging
cluster), using DuckDB's ``postgres_scanner`` to attach BOTH Postgres
instances READ_ONLY and diff them. Three comparisons over schema
``demos_app`` plus an emptiness check:

  1. columns      -- (table, column, data_type, is_nullable, column_default)
  2. foreign keys -- (name, table, pg_get_constraintdef)
  3. seeded rows  -- full-row diff of the Prisma-seeded lookups
                     (``state/prisma_seeded_tables.json``)
  4. emptiness    -- every non-seeded demos_app base table in the TARGET must
                     hold 0 rows (nothing pre-populated what we will write)

Any drift -> ``die`` (HOLD the cutover). This is a cross-*instance* compare
(two different PG clusters), which is exactly where ``postgres_scanner``
dual-attach earns its keep; the same-instance parity gate stays pure-PG.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from migration.lib import (
    PRISMA_SEEDED_TABLES_FILE,
    RUNS_DIR,
    Env,
    die,
    file_stamp,
    log,
    rel,
    ts,
)

# demos_app object names are interpolated into passthrough SQL; guard them so a
# surprising name can never inject. Postgres identifiers we emit are all plain.
_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z0-9_]+$")

# How many sample differing rows to surface per category in the report.
_SAMPLE = 10

_COLUMNS_SQL = (
    "SELECT table_name, column_name, data_type, is_nullable, "
    "coalesce(column_default, '') AS column_default "
    "FROM information_schema.columns WHERE table_schema = 'demos_app'"
)

_FKS_SQL = (
    "SELECT c.conname AS name, rel.relname AS table_name, "
    "pg_get_constraintdef(c.oid) AS definition "
    "FROM pg_constraint c "
    "JOIN pg_class rel ON rel.oid = c.conrelid "
    "JOIN pg_namespace n ON n.oid = rel.relnamespace "
    "WHERE n.nspname = 'demos_app' AND c.contype = 'f'"
)

# Per-table row counts for every demos_app base table, computed in one query
# (same query_to_xml trick init_pg uses for the seeded-table capture).
_TABLE_COUNTS_SQL = (
    "SELECT t.table_name, "
    "(xpath('/row/cnt/text()', query_to_xml("
    "format('SELECT count(*) AS cnt FROM demos_app.%I', t.table_name), "
    "false, true, '')))[1]::text::bigint AS cnt "
    "FROM information_schema.tables t "
    "WHERE t.table_schema = 'demos_app' AND t.table_type = 'BASE TABLE'"
)


@dataclass
class GuardDiffs:
    """Raw drift findings produced by the DuckDB dual-attach collection."""

    columns_only_ref: list[tuple[Any, ...]] = field(default_factory=list)
    columns_only_tgt: list[tuple[Any, ...]] = field(default_factory=list)
    fks_only_ref: list[tuple[Any, ...]] = field(default_factory=list)
    fks_only_tgt: list[tuple[Any, ...]] = field(default_factory=list)
    # seeded table -> (rows only in ref, rows only in tgt)
    seed_diffs: dict[str, tuple[int, int]] = field(default_factory=dict)
    # non-seeded target base table -> row count (only those with rows)
    nonempty_tgt_tables: dict[str, int] = field(default_factory=dict)


def _read_seeded_tables(path: Path = PRISMA_SEEDED_TABLES_FILE) -> list[str]:
    """Return the Prisma-seeded reference tables captured at ddl time.

    Empty list when the capture file is absent; the guard then diffs schema +
    emptiness only and logs that seed-row parity was skipped.
    """
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return [str(t) for t in data]


def _should_run_guard(env: Env) -> bool:
    """Decide whether the guard runs, dying when it must but cannot.

    - Target is the prod RDS (``pg_url`` unset) and no reference is configured
      -> ``die``: refuse to guard a prod rebuild blind.
    - Local/rehearsal target (``pg_url`` set) without a reference -> skip
      (returns False) so Week-1 dev is not blocked.
    - Reference configured -> run (returns True).
    """
    if env.reference_pg_url:
        return True
    if not env.pg_url:
        die(
            "prod-schema guard: REFERENCE_PG_URL is required before rebuilding "
            "the prod demos_app; point it at the rehearsal/staging cluster that "
            "has the pinned Prisma artifact applied"
        )
    log(
        "prod-schema guard: skipped (REFERENCE_PG_URL unset and target is a "
        "local/rehearsal DB, not the prod RDS)"
    )
    return False


def summarize_guard(diffs: GuardDiffs) -> list[str]:
    """Render :class:`GuardDiffs` as human-readable drift messages.

    An empty list means PASS (no drift). Pure function over already-computed
    diffs so the pass/fail logic is unit-testable without a live database.
    """
    issues: list[str] = []
    if diffs.columns_only_ref or diffs.columns_only_tgt:
        issues.append(
            f"column drift: {len(diffs.columns_only_ref)} only in reference, "
            f"{len(diffs.columns_only_tgt)} only in target (samples ref="
            f"{diffs.columns_only_ref[:_SAMPLE]} tgt={diffs.columns_only_tgt[:_SAMPLE]})"
        )
    if diffs.fks_only_ref or diffs.fks_only_tgt:
        issues.append(
            f"foreign-key drift: {len(diffs.fks_only_ref)} only in reference, "
            f"{len(diffs.fks_only_tgt)} only in target (samples ref="
            f"{diffs.fks_only_ref[:_SAMPLE]} tgt={diffs.fks_only_tgt[:_SAMPLE]})"
        )
    seed_drift = {t: d for t, d in diffs.seed_diffs.items() if d[0] or d[1]}
    if seed_drift:
        issues.append(f"seeded-reference drift: {seed_drift}")
    if diffs.nonempty_tgt_tables:
        issues.append(
            "target demos_app is not empty (expected greenfield); non-empty "
            f"data tables: {diffs.nonempty_tgt_tables}"
        )
    return issues


def _quote(dsn: str) -> str:
    """Single-quote-escape a DSN for inlining into a DuckDB ATTACH statement."""
    return dsn.replace("'", "''")


def _passthrough(con: Any, alias: str, pg_sql: str) -> str:
    """Return a DuckDB subquery selecting a PG passthrough result set."""
    escaped = pg_sql.replace("'", "''")
    return f"SELECT * FROM postgres_query('{alias}', '{escaped}')"


def _except_rows(con: Any, left_sql: str, right_sql: str) -> list[tuple[Any, ...]]:
    """Rows in ``left_sql`` not in ``right_sql`` (set difference, via DuckDB)."""
    con.execute(f"SELECT * FROM (({left_sql}) EXCEPT ({right_sql}))")
    return [tuple(r) for r in con.fetchall()]


def _collect_diffs(
    target_dsn: str, reference_dsn: str, seeded: list[str], *, require_empty: bool
) -> GuardDiffs:
    """Attach both PG instances READ_ONLY via DuckDB and compute drift.

    Live-only (needs two reachable Postgres clusters); exercised in the
    integration tier, not the unit suite.
    """
    import duckdb

    con = duckdb.connect()
    diffs = GuardDiffs()
    try:
        con.execute("INSTALL postgres_scanner; LOAD postgres_scanner;")
        con.execute(f"ATTACH '{_quote(reference_dsn)}' AS ref (TYPE postgres, READ_ONLY)")
        con.execute(f"ATTACH '{_quote(target_dsn)}' AS tgt (TYPE postgres, READ_ONLY)")

        ref_cols = _passthrough(con, "ref", _COLUMNS_SQL)
        tgt_cols = _passthrough(con, "tgt", _COLUMNS_SQL)
        diffs.columns_only_ref = _except_rows(con, ref_cols, tgt_cols)
        diffs.columns_only_tgt = _except_rows(con, tgt_cols, ref_cols)

        ref_fks = _passthrough(con, "ref", _FKS_SQL)
        tgt_fks = _passthrough(con, "tgt", _FKS_SQL)
        diffs.fks_only_ref = _except_rows(con, ref_fks, tgt_fks)
        diffs.fks_only_tgt = _except_rows(con, tgt_fks, ref_fks)

        for table in seeded:
            if not _SAFE_IDENTIFIER.match(table):
                log(f"WARNING: skipping unsafe seeded table name: {table!r}")
                continue
            sql = f'SELECT * FROM demos_app."{table}"'
            ref_rows = _passthrough(con, "ref", sql)
            tgt_rows = _passthrough(con, "tgt", sql)
            only_ref = len(_except_rows(con, ref_rows, tgt_rows))
            only_tgt = len(_except_rows(con, tgt_rows, ref_rows))
            diffs.seed_diffs[table] = (only_ref, only_tgt)

        if require_empty:
            con.execute(_passthrough(con, "tgt", _TABLE_COUNTS_SQL))
            seeded_set = set(seeded)
            for name, cnt in con.fetchall():
                if str(name) not in seeded_set and int(cnt) > 0:
                    diffs.nonempty_tgt_tables[str(name)] = int(cnt)
    finally:
        con.close()
    return diffs


def run_prod_schema_guard(*, require_empty: bool = True, label: str = "guard") -> None:
    """Diff the live target demos_app against the reference; HOLD on any drift.

    Resolves the target from ``env.pg_dsn()`` (the DB the migration writes to;
    the prod RDS in a real cutover) and the reference from
    ``env.reference_pg_url``. Writes a timestamped report to ``reports/runs/`` and
    calls :func:`die` when any column/FK/seed/emptiness drift is found, so a
    stale pin can never silently DROP and rebuild a schema the live app has
    moved past.
    """
    env = Env.load()
    if not _should_run_guard(env):
        return

    seeded = _read_seeded_tables()
    if not seeded:
        log("prod-schema guard: state/prisma_seeded_tables.json absent; seed-row parity skipped")

    diffs = _collect_diffs(
        env.pg_dsn(), env.reference_pg_url, seeded, require_empty=require_empty
    )
    issues = summarize_guard(diffs)

    out: Path = RUNS_DIR / f"prod_schema_guard_{file_stamp()}.md"
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    status = "RED" if issues else "GREEN"
    body = [
        "# Prod-schema guard report",
        "",
        f"Generated: {ts()}",
        f"Invocation: {label}",
        f"Seeded tables compared: {len(seeded)}",
        "",
        f"**OVERALL STATUS: {status}**",
        "",
    ]
    body.extend(f"- {i}" for i in issues) if issues else body.append("- no drift detected")
    out.write_text("\n".join(body) + "\n", encoding="utf-8")
    log(f"wrote {rel(out)} -- {status}")

    if issues:
        die(
            f"prod-schema guard ({label}) found drift between the live target "
            f"demos_app and the reference; HOLD. See {rel(out)}: " + "; ".join(issues)
        )
    log(f"prod-schema guard ({label}): target demos_app matches reference; safe to proceed")
