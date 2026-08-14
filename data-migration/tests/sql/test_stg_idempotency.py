"""Apply-twice idempotency harness for the ``sql/10_stg`` filter layer.

Runs the *real* stg SQL against a throwaway Postgres (``PG_TEST_DSN``), so it
catches the class of bug the unit suite cannot: a ``CREATE OR REPLACE VIEW``
that references a column or table that does not exist on the real source
schema. The source side is reconstructed as an all-``text`` ``mysql_raw``
skeleton from ``reports/schema_snapshot/columns.csv`` (the captured MySQL
information_schema), which is enough to validate every view's column
references without needing real data.

Scope (CODE_REVIEW targeted v1): vanilla Postgres only, so ``00_init`` (which
needs the third-party ``pg_jsonschema`` extension) is not applied; the
prerequisites the stg layer actually needs are provisioned directly. Files
that depend on ``demos_app`` (Prisma) DDL are skipped and deferred. The three
files the review flagged as referencing fictional columns/tables (12/16/99,
CODE_REVIEW C2-C4) have since been rebuilt against the real source schema and
are now part of the apply-twice GOOD set.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

from migration import lib
from tests.sql._skeleton import COLUMNS_CSV, create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "sql"
STG_DIR = SQL_DIR / "10_stg"
ID_MAPS_DIR = SQL_DIR / "05_id_maps"
SCANNER_SQL = ROOT / "scripts" / "generate_fk_candidates.sql"

# stg files expected to apply cleanly (and re-apply cleanly) against the
# all-text mysql_raw skeleton, in dependency order.
GOOD_FILES = [
    "00_keep_drop_ids",
    "10_filter_demo",
    "11_filter_pendg_demo",
    "12_filter_aplctn",
    "13_filter_amndmt",
    "14_filter_rnwl",
    "15_filter_dlvrbl",
    "16_filter_cntct",
    "17_filter_user",
    "18_populate_id_map_mdcd_demo",
    "19_populate_id_map_mdcd_pendg_demo",
    "22_demonstration_resolved",
    "29_populate_id_map_mdcd_demo_amndmt",
    "30_amendment_resolved",
    "99_filter_report",
]

# Deferred: needs demos_app (Prisma) DDL + data, out of scope for vanilla-PG v1.
SKIP_FILES = {"60_budget_neutrality": "needs demos_app (Prisma) DDL; deferred follow-up"}


def _provision(conn: Any) -> None:
    """Reset schemas, install extensions, build the mysql_raw skeleton, apply id-maps."""
    from psycopg import sql as pgsql

    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration CASCADE")
    for schema in ("stg", "migration"):
        conn.execute(pgsql.SQL("CREATE SCHEMA {}").format(pgsql.Identifier(schema)))
    # pgcrypto supplies gen_random_uuid() used by 05_id_maps; uuid-ossp mirrors
    # 00_init. pg_jsonschema is deliberately NOT required by the stg layer.
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    create_mysql_raw_skeleton(conn)

    for f in sorted(ID_MAPS_DIR.glob("*.sql")):
        conn.execute(f.read_text(encoding="utf-8"))


def _apply(conn: Any, names: list[str]) -> None:
    """Apply the named ``10_stg/<name>.sql`` files in order."""
    for name in names:
        conn.execute((STG_DIR / f"{name}.sql").read_text(encoding="utf-8"))


def test_columns_csv_present() -> None:
    """Guard: the source schema snapshot the skeleton is built from must exist."""
    assert COLUMNS_CSV.exists(), f"missing source schema snapshot: {COLUMNS_CSV}"


def test_stg_good_files_apply_twice(pg_db: psycopg.Connection) -> None:
    """Every dependency-satisfiable stg filter applies, and re-applies, cleanly."""
    _provision(pg_db)
    _apply(pg_db, GOOD_FILES)
    _apply(pg_db, GOOD_FILES)  # idempotent re-apply must not raise

    rows = pg_db.execute(
        "SELECT 1 FROM information_schema.views "
        "WHERE table_schema = 'stg' AND table_name = '_valid_demo_ids'"
    ).fetchall()
    assert rows, "expected stg._valid_demo_ids view to exist after apply"


def test_fk_candidate_scanner_runs(
    pg_db: psycopg.Connection, monkeypatch: pytest.MonkeyPatch
) -> None:
    """CODE_REVIEW C1: psql_query must run the literal-% scanner SQL without crashing.

    Pre-fix, ``psql_query``'s ``params`` defaulted to ``()`` and psycopg parsed
    the literal ``%`` in ``LIKE '%\\_id'`` at client-side query conversion,
    raising before the query ran. With ``params=None`` it must succeed.
    """
    _provision(pg_db)
    dsn = os.environ["PG_TEST_DSN"]
    # Point a real Env at the plain throwaway DSN (no SSL forcing) so we
    # exercise the actual psql_query code path with its params default.
    monkeypatch.setenv("PG_URL", dsn)
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/d")
    monkeypatch.setattr(lib.Env, "pg_dsn", lambda self: dsn)
    lib.reset_env_cache()

    rows = lib.psql_query(lib.Env.load(), SCANNER_SQL.read_text(encoding="utf-8"))
    assert isinstance(rows, list)
