"""Snapshot the live MySQL source's information_schema to reports/schema_snapshot/.

pgloader's MySQL -> Postgres load into ``mysql_raw`` is lossy by design:
the landing catalog flattens ``ENUM``/``SET`` to text, drops declared
foreign keys, and carries no column comments, view bodies, triggers, or
``AUTO_INCREMENT`` values. That metadata only exists in MySQL's own
``information_schema`` -- and it is exactly what the transform stages need
(enum value domains feed ``04_crosswalks``; declared FKs cross-check
``fk-candidates``; view definitions are the business-rule spec for
``23_app_derived`` and ``demo_status``).

This phase reads that metadata directly, using the DuckDB sidecar that the
toolkit already depends on (and that ``preflight`` validates): it attaches
the source MySQL database ``READ_ONLY`` and runs each ``information_schema``
query through DuckDB's ``mysql_query`` passthrough. Nothing is written back
to MySQL, and -- unlike the rendered pgloader ``.load`` file -- no
credentials are persisted to disk.

The full source is captured (the pgloader drop list is *not* applied) so
tables slated for exclusion remain visible for review. Each artifact is a
deterministic, diff-friendly CSV; a missing or empty result (e.g. a source
with no declared FKs) yields a header-only file plus a log note rather than
an error.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from migration.lib import (
    SCHEMA_SNAPSHOT_DIR,
    Env,
    die,
    file_stamp,
    log,
    rel,
    ts,
)

# Each capture is (output filename, MySQL SQL run via mysql_query passthrough).
# Queries scope to the attached database with DATABASE() so no schema name is
# interpolated. Ordering is explicit for review-friendly diffs.
_CAPTURES: tuple[tuple[str, str], ...] = (
    (
        "columns.csv",
        "SELECT table_name, ordinal_position, column_name, column_type, "
        "data_type, is_nullable, column_default, column_key, extra, "
        "character_maximum_length, numeric_precision, numeric_scale, "
        "character_set_name, collation_name, column_comment "
        "FROM information_schema.columns WHERE table_schema = DATABASE() "
        "ORDER BY table_name, ordinal_position",
    ),
    (
        "foreign_keys.csv",
        "SELECT k.constraint_name, k.table_name, k.column_name, "
        "k.ordinal_position, k.referenced_table_name, k.referenced_column_name, "
        "rc.update_rule, rc.delete_rule "
        "FROM information_schema.key_column_usage k "
        "JOIN information_schema.referential_constraints rc "
        "  ON rc.constraint_schema = k.constraint_schema "
        "  AND rc.constraint_name = k.constraint_name "
        "WHERE k.table_schema = DATABASE() "
        "  AND k.referenced_table_name IS NOT NULL "
        "ORDER BY k.table_name, k.constraint_name, k.ordinal_position",
    ),
    (
        "table_stats.csv",
        "SELECT table_name, table_rows, auto_increment, engine, "
        "table_collation, create_time, update_time, table_comment "
        "FROM information_schema.tables WHERE table_schema = DATABASE() "
        "AND table_type = 'BASE TABLE' ORDER BY table_name",
    ),
    (
        "views.csv",
        "SELECT table_name, is_updatable, view_definition "
        "FROM information_schema.views WHERE table_schema = DATABASE() "
        "ORDER BY table_name",
    ),
    (
        "indexes.csv",
        "SELECT table_name, index_name, seq_in_index, column_name, "
        "non_unique, cardinality, nullable, index_type "
        "FROM information_schema.statistics WHERE table_schema = DATABASE() "
        "ORDER BY table_name, index_name, seq_in_index",
    ),
    (
        "triggers.csv",
        "SELECT trigger_name, action_timing, event_manipulation, "
        "event_object_table, action_orientation, action_statement "
        "FROM information_schema.triggers WHERE trigger_schema = DATABASE() "
        "ORDER BY event_object_table, trigger_name",
    ),
    (
        "check_constraints.csv",
        "SELECT tc.table_name, cc.constraint_name, cc.check_clause "
        "FROM information_schema.check_constraints cc "
        "JOIN information_schema.table_constraints tc "
        "  ON tc.constraint_schema = cc.constraint_schema "
        "  AND tc.constraint_name = cc.constraint_name "
        "WHERE cc.constraint_schema = DATABASE() "
        "ORDER BY tc.table_name, cc.constraint_name",
    ),
)

# Exploded one row per (table, column, enum value). The single most useful
# artifact for authoring 04_crosswalks: the complete value domain, including
# values with zero rows that data profiling would miss.
_ENUM_SQL = (
    "SELECT table_name, column_name, data_type, column_type, column_comment "
    "FROM information_schema.columns WHERE table_schema = DATABASE() "
    "AND data_type IN ('enum', 'set') ORDER BY table_name, column_name"
)
_ENUM_HEADER = ("table_name", "column_name", "data_type", "enum_ordinal", "enum_value", "column_comment")


def _mysql_attach_dsn(mysql_url: str, mysql_db: str) -> str:
    """Build a DuckDB MySQL ATTACH DSN from the connection URL + database name.

    Accepts a standard MySQL connection URL; ``mysql_db`` takes
    precedence over the URL path for the database name. Percent-encoded
    credentials are decoded. Empty components are omitted so DuckDB applies
    its own defaults. The host defaults to ``localhost`` and the port to
    ``3306`` when absent.
    """
    u = urlparse(mysql_url)
    db = mysql_db or u.path.lstrip("/")
    parts = {
        "host": u.hostname or "localhost",
        "port": str(u.port or 3306),
        "user": unquote(u.username) if u.username else "",
        "password": unquote(u.password) if u.password else "",
        "database": db,
    }
    return " ".join(f"{k}={v}" for k, v in parts.items() if v != "")


def _parse_enum_values(column_type: str) -> list[str]:
    """Return the ordered value list from a MySQL ``enum(...)``/``set(...)`` type.

    ``column_type`` is the full ``COLUMN_TYPE`` string (e.g.
    ``enum('Active','Inactive')``). Values are single-quoted and separated by
    commas; an embedded quote is doubled (``''``) and commas may appear inside
    a value. Returns ``[]`` for any non-enum/set type.
    """
    m = re.match(r"^\s*(?:enum|set)\s*\((.*)\)\s*$", column_type or "", re.IGNORECASE | re.DOTALL)
    if not m:
        return []
    body = m.group(1)
    out: list[str] = []
    cur: list[str] = []
    in_quote = False
    i = 0
    while i < len(body):
        c = body[i]
        if not in_quote:
            if c == "'":
                in_quote = True
                cur = []
            i += 1
            continue
        if c == "'":
            if i + 1 < len(body) and body[i + 1] == "'":
                cur.append("'")
                i += 2
                continue
            out.append("".join(cur))
            in_quote = False
            i += 1
            continue
        cur.append(c)
        i += 1
    return out


def _write_csv(path: Path, header: list[str], rows: list[tuple[Any, ...]]) -> int:
    """Write ``rows`` to ``path`` with ``header``; return the row count."""
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    return len(rows)


def _passthrough(con: Any, mysql_sql: str) -> tuple[list[str], list[tuple[Any, ...]]]:
    """Run one MySQL query via DuckDB's mysql_query passthrough.

    The authored query is embedded into the ``mysql_query('src', '...')``
    call with single quotes doubled; the queries are static constants in this
    module (never built from external input), so this is safe.
    """
    escaped = mysql_sql.replace("'", "''")
    cur = con.execute(f"SELECT * FROM mysql_query('src', '{escaped}')")
    header = [d[0] for d in cur.description]
    return header, cur.fetchall()


def run_schema_snapshot() -> None:
    """Capture the source MySQL information_schema into reports/schema_snapshot/.

    Attaches the source database READ_ONLY through the DuckDB MySQL scanner
    and writes one CSV per metadata slice (columns, enums, foreign keys,
    table stats, views, indexes, triggers, check constraints) plus a
    ``_manifest.json`` audit record. A failure to attach (MySQL unreachable)
    is fatal; an individual capture that errors or returns nothing is logged
    and skipped so the rest of the snapshot still completes.
    """
    import duckdb

    env = Env.load()
    SCHEMA_SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    dsn = _mysql_attach_dsn(env.mysql_url, env.mysql_db)

    con = duckdb.connect()
    try:
        con.execute("INSTALL mysql_scanner; LOAD mysql_scanner;")
        dsn_literal = dsn.replace("'", "''")
        try:
            con.execute(f"ATTACH '{dsn_literal}' AS src (TYPE mysql, READ_ONLY)")
        except Exception as e:
            die(f"could not attach MySQL source via DuckDB: {e}")

        counts: dict[str, int] = {}

        for filename, mysql_sql in _CAPTURES:
            out = SCHEMA_SNAPSHOT_DIR / filename
            try:
                header, rows = _passthrough(con, mysql_sql)
            except Exception as e:
                log(f"WARNING: capture {filename} failed, skipping: {e}")
                continue
            counts[filename] = _write_csv(out, header, rows)
            log(f"wrote {rel(out)} ({counts[filename]} rows)")

        # Derived enum domains (exploded one row per value).
        try:
            _, enum_cols = _passthrough(con, _ENUM_SQL)
        except Exception as e:
            log(f"WARNING: enum capture failed, skipping: {e}")
            enum_cols = []
        enum_rows: list[tuple[Any, ...]] = []
        for table_name, column_name, data_type, column_type, comment in enum_cols:
            for ordinal, value in enumerate(_parse_enum_values(str(column_type)), start=1):
                enum_rows.append((table_name, column_name, data_type, ordinal, value, comment))
        enum_out = SCHEMA_SNAPSHOT_DIR / "enums.csv"
        counts["enums.csv"] = _write_csv(enum_out, list(_ENUM_HEADER), enum_rows)
        log(f"wrote {rel(enum_out)} ({counts['enums.csv']} rows)")
    finally:
        con.close()

    manifest = {
        "captured_at": ts(),
        "stamp": file_stamp(),
        "mysql_db": env.mysql_db or urlparse(env.mysql_url).path.lstrip("/"),
        "duckdb_version": duckdb.__version__,
        "row_counts": counts,
    }
    manifest_path = SCHEMA_SNAPSHOT_DIR / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    log(f"wrote {rel(manifest_path)}")

    # Columnar companions for offline DuckDB analysis (role B); additive.
    from migration.duck import csv_dir_to_parquet

    csv_dir_to_parquet(SCHEMA_SNAPSHOT_DIR)
