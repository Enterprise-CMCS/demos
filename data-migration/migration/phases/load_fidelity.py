"""Role C: load-fidelity check -- live MySQL vs mysql_raw, via DuckDB.

pgloader's MySQL -> Postgres load into ``mysql_raw`` can silently drop or
mangle rows (type-cast failures, encoding issues, a table the drop list should
not have hidden). This check proves the landing is faithful by comparing
per-table row counts between the *live source* and ``mysql_raw`` using DuckDB's
``mysql_scanner`` + ``postgres_scanner`` to attach BOTH engines READ_ONLY in
one process -- the one genuinely cross-engine job DuckDB is suited for.

Semantics and the freeze pin: the comparison is only apples-to-apples once
MySQL writes are paused (``migrate freeze``). Before then, the live source
keeps changing and counts will differ from the snapshot pgloader already took;
that is live drift, not a load defect. The pin therefore is not an
``_loaded_at`` filter (``_loaded_at`` records the *landing* time, always after
freeze) but the existence of ``state/freeze_instant.txt``: when present the run
is post-freeze and trustworthy; when absent the report is annotated as
possibly-drifting. This check is *informational and non-gating* -- it marks no
gate and exits 0 by default. Pass ``--strict`` to exit non-zero on any
mismatch (useful in CI against a frozen fixture).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.parse import urlparse

if TYPE_CHECKING:
    import duckdb

from migration.lib import (
    REPORTS_DIR,
    RUNS_DIR,
    STATE_DIR,
    Env,
    die,
    file_stamp,
    log,
    read_drop_list,
    rel,
    ts,
)
from migration.phases.schema_snapshot import _mysql_attach_dsn, _passthrough

# Source base-table inventory (scoped to the attached database via DATABASE()).
_SOURCE_TABLES_SQL = (
    "SELECT table_name FROM information_schema.tables "
    "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' "
    "ORDER BY table_name"
)

_SAFE_IDENTIFIER_CHARS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_" # pragma: allowlist secret
)


def _is_safe_identifier(name: str) -> bool:
    """True when ``name`` is a bare identifier safe to inline into SQL."""
    return bool(name) and all(c in _SAFE_IDENTIFIER_CHARS for c in name)


def _scalar_int(con: duckdb.DuckDBPyConnection, sql: str) -> int:
    """Run ``sql`` (which already yields a single aggregate row) and return its
    first column as an int; 0 when the result set is empty.

    Reads the value the query computed. It must NOT wrap ``sql`` in another
    ``count(*)`` -- that counts the single aggregate row (always 1) instead of
    returning the aggregate, which was the original load-fidelity bug.
    """
    con.execute(sql)
    rows = con.fetchall()
    if not rows or rows[0][0] is None:
        return 0
    return int(rows[0][0])


@dataclass(frozen=True)
class CountRow:
    """Per-table row-count comparison between the source and ``mysql_raw``."""

    table: str
    source_count: int
    raw_count: int

    @property
    def matches(self) -> bool:
        return self.source_count == self.raw_count


def summarize_load_fidelity(rows: list[CountRow]) -> list[str]:
    """Render mismatching :class:`CountRow`s as human messages (empty == clean).

    Pure function over already-collected counts so the pass/fail logic is
    unit-testable without a live MySQL or Postgres.
    """
    issues: list[str] = []
    for r in rows:
        if not r.matches:
            issues.append(
                f"{r.table}: source={r.source_count} mysql_raw={r.raw_count} "
                f"(delta {r.raw_count - r.source_count:+d})"
            )
    return issues


def _freeze_instant() -> str | None:
    """Return the recorded freeze instant, or None when writes were not paused."""
    p = STATE_DIR / "freeze_instant.txt"
    if not p.exists():
        return None
    return p.read_text(encoding="utf-8").strip() or None


def _collect_counts(env: Env, tables: list[str]) -> list[CountRow]:
    """Attach MySQL + Postgres READ_ONLY via DuckDB and count each table.

    Live-only (needs a reachable MySQL source and Postgres ``mysql_raw``);
    exercised in the integration tier, not the unit suite.
    """
    import duckdb

    con = duckdb.connect()
    out: list[CountRow] = []
    try:
        con.execute("INSTALL mysql_scanner; LOAD mysql_scanner;")
        con.execute("INSTALL postgres_scanner; LOAD postgres_scanner;")
        mysql_dsn = _mysql_attach_dsn(env.mysql_url, env.mysql_db).replace("'", "''")
        pg_dsn = env.pg_dsn().replace("'", "''")
        con.execute(f"ATTACH '{mysql_dsn}' AS src (TYPE mysql, READ_ONLY)")
        con.execute(f"ATTACH '{pg_dsn}' AS pg (TYPE postgres, READ_ONLY)")

        for table in tables:
            if not _is_safe_identifier(table):
                log(f"WARNING: skipping unsafe table name: {table!r}")
                continue
            _, src = _passthrough(con, f"SELECT count(*) FROM {table}")
            source_count = int(src[0][0]) if src else 0
            try:
                raw_count = _scalar_int(
                    con,
                    "SELECT * FROM "
                    f"postgres_query('pg', 'SELECT count(*) FROM mysql_raw.\"{table}\"')",
                )
            except Exception as e:
                log(f"WARNING: mysql_raw.{table} unreadable ({e}); recording as -1")
                raw_count = -1
            out.append(CountRow(table=table, source_count=source_count, raw_count=raw_count))
    finally:
        con.close()
    return out


def run_load_fidelity(strict: bool = False) -> None:
    """Compare live MySQL vs ``mysql_raw`` row counts; write a report.

    Lists the source base tables, drops the pgloader drop list, counts each
    side via DuckDB dual-attach, and writes ``reports/runs/load_fidelity_<stamp>.md``
    plus a ``_manifest.json`` (with ``duckdb_version`` and the freeze instant).
    Informational by default; with ``strict=True`` a mismatch exits non-zero.
    """
    import duckdb

    env = Env.load()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    drop = set(read_drop_list())
    con = duckdb.connect()
    try:
        con.execute("INSTALL mysql_scanner; LOAD mysql_scanner;")
        mysql_dsn = _mysql_attach_dsn(env.mysql_url, env.mysql_db).replace("'", "''")
        con.execute(f"ATTACH '{mysql_dsn}' AS src (TYPE mysql, READ_ONLY)")
        _, table_rows = _passthrough(con, _SOURCE_TABLES_SQL)
    finally:
        con.close()
    tables = [str(r[0]) for r in table_rows if str(r[0]) not in drop]

    rows = _collect_counts(env, tables)
    issues = summarize_load_fidelity(rows)

    frozen = _freeze_instant()
    status = "CLEAN" if not issues else "MISMATCH"
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    out: Path = RUNS_DIR / f"load_fidelity_{file_stamp()}.md"
    body = [
        "# Load-fidelity report (live MySQL vs mysql_raw)",
        "",
        f"Generated: {ts()}",
        f"Freeze instant: {frozen or '(none recorded -- results may include live drift)'}",
        f"Tables compared: {len(rows)} (drop list excluded: {len(drop)})",
        "",
        f"**OVERALL: {status}**",
        "",
    ]
    if issues:
        body.extend(f"- {i}" for i in issues)
    else:
        body.append("- every compared table matches")
    out.write_text("\n".join(body) + "\n", encoding="utf-8")

    manifest = {
        "generated_at": ts(),
        "stamp": file_stamp(),
        "duckdb_version": duckdb.__version__,
        "freeze_instant": frozen,
        "mysql_db": env.mysql_db or urlparse(env.mysql_url).path.lstrip("/"),
        "tables_compared": len(rows),
        "mismatches": len(issues),
    }
    (REPORTS_DIR / "generated" / "load_fidelity_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    log(f"wrote {rel(out)} -- {status}")

    if not frozen:
        log("WARNING: no freeze instant recorded; run after `migrate freeze` for a trustworthy comparison")
    if issues:
        msg = f"load-fidelity found {len(issues)} table mismatch(es); see {rel(out)}"
        if strict:
            die(msg)
        log(f"WARNING: {msg} (informational; use --strict to fail)")
