"""Live-PG harness for the amendment-status crosswalk check (65_amendment_status_check.sql).

The crosswalk (64_amendment_status.sql) ships EMPTY by design, so the check is a
fail-closed forcing function: it must skip when the source table is absent,
no-op when no amendments exist (an empty source is legitimate), hard-fail when
amendments exist but a status code is unmapped (the shipped state), and pass
once every present code has a mapping. Runs the real SQL against a throwaway
Postgres (``PG_TEST_DSN``); self-skips without it.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
CROSSWALK_DIR = ROOT / "sql" / "04_crosswalks"
AMENDMENT_STATUS = CROSSWALK_DIR / "64_amendment_status.sql"
AMENDMENT_STATUS_CHECK = CROSSWALK_DIR / "65_amendment_status_check.sql"


def _create_crosswalk(conn: Any) -> None:
    """Apply the (empty) crosswalk DDL; applying twice must be a clean no-op."""
    conn.execute(AMENDMENT_STATUS.read_text(encoding="utf-8"))
    conn.execute(AMENDMENT_STATUS.read_text(encoding="utf-8"))


def _seed_source(conn: Any, status_cds: tuple[int, ...]) -> None:
    """mysql_raw.mdcd_demo_amndmt with the given status codes (one row each)."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo_amndmt "
        "(mdcd_demo_amndmt_id int, mdcd_demo_amndmt_stus_cd int)"
    )
    for i, cd in enumerate(status_cds, start=1):
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_amndmt VALUES (%s, %s)", (i, cd)
        )
    _create_crosswalk(conn)


def _run_check(conn: Any) -> None:
    conn.execute(AMENDMENT_STATUS_CHECK.read_text(encoding="utf-8"))


def test_absent_source_skips(pg_db: psycopg.Connection) -> None:
    """No mdcd_demo_amndmt table -> the check no-ops (pre-load)."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    _create_crosswalk(pg_db)
    _run_check(pg_db)


def test_empty_source_noops(pg_db: psycopg.Connection) -> None:
    """Source present but no amendments -> nothing to map, no failure."""
    _seed_source(pg_db, status_cds=())
    _run_check(pg_db)


def test_unmapped_status_raises(pg_db: psycopg.Connection) -> None:
    """Amendments present with the EMPTY shipped crosswalk -> fail closed."""
    import psycopg

    _seed_source(pg_db, status_cds=(2,))
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)


def test_complete_mapping_passes(pg_db: psycopg.Connection) -> None:
    """Every present status code mapped -> the check passes."""
    _seed_source(pg_db, status_cds=(2, 3))
    pg_db.execute(
        "INSERT INTO mysql_raw.crosswalk_amendment_status "
        "(legacy_int_cd, legacy_name, demos_text_id) VALUES "
        "(2, 'Approved', 'Approved'), (3, 'Withdrawn', 'Withdrawn')"
    )
    _run_check(pg_db)


def test_partial_mapping_raises(pg_db: psycopg.Connection) -> None:
    """A present code with no crosswalk row hard-fails even if others map."""
    import psycopg

    _seed_source(pg_db, status_cds=(2, 4))
    pg_db.execute(
        "INSERT INTO mysql_raw.crosswalk_amendment_status "
        "(legacy_int_cd, legacy_name, demos_text_id) VALUES (2, 'Approved', 'Approved')"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)
