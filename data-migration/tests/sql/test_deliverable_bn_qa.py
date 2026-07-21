"""Live-PG harness for the non-gating deliverable BN routing QA view.

Exercises sql/99_parity/43_deliverable_bn_qa.sql against a hand-built, FK-free
schema. deliverable_type is routed purely by the report-occurrence code
(57 = Quarterly BN, 70 = Annual BN); the legacy bdgt_ntrlty_ind flag and the
free-text name are retired as routing inputs but kept as a QA signal. The view
must flag every migratable deliverable whose type-based BN classification
disagrees with the flag or the name, and must NOT flag agreements.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via ``pg_db``); self-skips
without it.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
QA_VIEW = ROOT / "sql" / "99_parity" / "43_deliverable_bn_qa.sql"

# legacy_id -> (deliverable_type_cd, bdgt_ntrlty_ind, name)
U_BN_AGREE = uuid.UUID(int=0xB1)      # 57 + ind=1  -> agree, not flagged
U_MON_AGREE = uuid.UUID(int=0xB2)     # 53 + ind=0  -> agree, not flagged
U_BN_FLAG_OFF = uuid.UUID(int=0xB3)   # 57 + ind=0  -> flagged
U_NONBN_FLAG_ON = uuid.UUID(int=0xB4) # 53 + ind=1  -> flagged
U_NAME_BN = uuid.UUID(int=0xB5)       # 53 + ind=0 + BN name -> flagged


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw, demos_app CASCADE")
    for schema in ("stg", "migration", "mysql_raw", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    conn.execute(
        "CREATE TABLE stg.deliverable_resolved ("
        " new_uuid uuid PRIMARY KEY,"
        " legacy_id int,"
        " deliverable_type_cd int,"
        " budget_neutrality_ind int,"
        " name text)"
    )
    conn.execute(
        "INSERT INTO stg.deliverable_resolved "
        "(new_uuid, legacy_id, deliverable_type_cd, budget_neutrality_ind, name) VALUES "
        "(%s, 1, 57, 1, 'Q1 BN Report'),"                # agree
        "(%s, 2, 53, 0, 'Quarterly Monitoring Report'),"  # agree
        "(%s, 3, 57, 0, 'Q2 BN Report'),"                # BN type flag off
        "(%s, 4, 53, 1, 'Some Monitoring Report'),"       # non-BN type flag on
        "(%s, 5, 53, 0, 'Annual Budget Neutrality summary')",  # name-BN mismatch
        (U_BN_AGREE, U_MON_AGREE, U_BN_FLAG_OFF, U_NONBN_FLAG_ON, U_NAME_BN),
    )

    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_deliverable_type "
        "(legacy_int_cd int PRIMARY KEY, demos_text_id text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_deliverable_type (legacy_int_cd, demos_text_id) "
        "VALUES (57, 'Quarterly Budget Neutrality Report'), (53, 'Monitoring Report')"
    )

    _apply(conn, QA_VIEW)


def test_only_disagreements_are_flagged(pg_db: psycopg.Connection) -> None:
    """Exactly the three disagreement rows appear in the QA view; agreements do not."""
    _provision(pg_db)
    rows = pg_db.execute(
        "SELECT legacy_id FROM migration._parity_deliverable_bn_qa ORDER BY legacy_id"
    ).fetchall()
    assert [r[0] for r in rows] == [3, 4, 5]


def test_reasons_are_specific(pg_db: psycopg.Connection) -> None:
    """Each flagged row carries the specific disagreement reason."""
    _provision(pg_db)
    reasons = dict(
        pg_db.execute(
            "SELECT legacy_id, reason FROM migration._parity_deliverable_bn_qa"
        ).fetchall()
    )
    assert reasons[3] == "BN type (57/70) but bdgt_ntrlty_ind=0"
    assert reasons[4] == "non-BN type but bdgt_ntrlty_ind=1"
    assert reasons[5] == "name mentions budget neutrality but type is not BN"


def test_view_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the parity SQL is a no-op (CREATE OR REPLACE)."""
    _provision(pg_db)
    _apply(pg_db, QA_VIEW)
    n = _scalar(pg_db, "SELECT count(*) FROM migration._parity_deliverable_bn_qa")
    assert n == 3


def test_noop_when_stg_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op (view not created) when stg.deliverable_resolved is absent."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw, demos_app CASCADE")
    conn.execute("CREATE SCHEMA migration")
    _apply(conn, QA_VIEW)  # must NOT raise
    exists = conn.execute(
        "SELECT to_regclass('migration._parity_deliverable_bn_qa') IS NOT NULL"
    ).fetchone()
    assert exists is not None
    assert exists[0] is False
