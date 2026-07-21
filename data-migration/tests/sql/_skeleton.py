"""Shared builder for an all-text/typed ``mysql_raw`` skeleton.

The live-PG SQL harnesses reconstruct the source side as a ``mysql_raw``
skeleton from ``tests/sql/fixtures/schema_snapshot/columns.csv`` (a committed
copy of the captured MySQL information_schema), which is enough to validate
the stg/migration SQL's column references (and, with fixtures, its behavior)
without needing real MySQL. Centralized here so every harness builds the same
skeleton.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, LiteralString, cast

ROOT = Path(__file__).resolve().parents[2]
COLUMNS_CSV = ROOT / "tests" / "sql" / "fixtures" / "schema_snapshot" / "columns.csv"

# Map MySQL information_schema DATA_TYPE -> a Postgres type close enough that
# the views/transforms (extract(), numeric/date comparisons, regex, SUM, ...)
# compile and run against the skeleton. The exact type is irrelevant to
# column-reference validation, but the type *class* (date vs numeric vs text)
# must be right or CREATE VIEW / aggregation won't type.
_TYPE_MAP = {
    "int": "bigint",
    "smallint": "bigint",
    "tinyint": "bigint",
    "bigint": "bigint",
    "decimal": "numeric",
    "float": "double precision",
    "double": "double precision",
    "date": "date",
    "datetime": "timestamptz",
    "timestamp": "timestamptz",
    "varchar": "text",
    "char": "text",
    "mediumtext": "text",
    "longtext": "text",
}


def read_skeleton_columns() -> dict[str, list[tuple[str, str]]]:
    """Return ``{table: [(column, pg_type), ...]}`` (lowercased, deduped)."""
    tables: dict[str, list[tuple[str, str]]] = {}
    with COLUMNS_CSV.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            table = row["TABLE_NAME"].strip().lower()
            column = row["COLUMN_NAME"].strip().lower()
            pg_type = _TYPE_MAP.get(row["DATA_TYPE"].strip().lower(), "text")
            cols = tables.setdefault(table, [])
            if all(c != column for c, _ in cols):
                cols.append((column, pg_type))
    return tables


def create_mysql_raw_skeleton(conn: Any) -> None:
    """(Re)create the ``mysql_raw`` schema and every snapshot table within it."""
    from psycopg import sql as pgsql

    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    for table, cols in read_skeleton_columns().items():
        coldefs = pgsql.SQL(", ").join(
            pgsql.SQL("{} {}").format(
                pgsql.Identifier(c), pgsql.SQL(cast(LiteralString, pg_type))
            )
            for c, pg_type in cols
        )
        conn.execute(
            pgsql.SQL("CREATE TABLE mysql_raw.{} ({})").format(
                pgsql.Identifier(table), coldefs
            )
        )
