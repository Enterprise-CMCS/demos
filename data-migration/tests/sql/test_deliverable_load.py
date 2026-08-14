"""Live-PG load-correctness harness for the deliverable loader + its parity views.

Once the deliverable_type crosswalk exists, sql/20_app/40_deliverable.sql
activates. This exercises, against a hand-built FK-free schema:

  * a fully valid deliverable loads (single-input deliverable_type crosswalk);
  * a deliverable held back for another reason (empty name; N/A status code 0)
    is NOT loaded, and appears in migration._parity_deliverable_held with the
    right reason and WITHOUT the retired "deliverable_type unresolved" text;
  * the completeness view (check 15) stays empty -- loaded U held = all resolved;
  * the loader is idempotent.

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
LOADER = ROOT / "sql" / "20_app" / "40_deliverable.sql"
HELD = ROOT / "sql" / "99_parity" / "40_deliverable_held.sql"
COMPLETENESS = ROOT / "sql" / "99_parity" / "41_deliverable_completeness.sql"

DEMO = uuid.UUID(int=0xD0)          # loaded Approved demonstration
OWNER = uuid.UUID(int=0xD1)         # cms owner user
D_OK = uuid.UUID(int=0xE1)          # fully valid -> loads
D_NONAME = uuid.UUID(int=0xE2)      # empty name -> held
D_NASTATUS = uuid.UUID(int=0xE3)    # status code 0 (null_ok) -> held


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
        " new_uuid uuid PRIMARY KEY, legacy_id int, demonstration_id uuid, name text,"
        " status_cd int, deliverable_type_cd int, budget_neutrality_ind int,"
        " cms_owner_user_id uuid, cms_owner_person_type_id text,"
        " due_date timestamptz, created_at timestamptz, updated_at timestamptz)"
    )
    conn.execute(
        "INSERT INTO stg.deliverable_resolved VALUES "
        "(%(ok)s, 1, %(demo)s, 'Valid Deliverable', 1, 57, 1, %(own)s, 'demos-cms-user', "
        "  now(), now(), now()),"
        "(%(nn)s, 2, %(demo)s, '', 1, 57, 1, %(own)s, 'demos-cms-user', now(), now(), now()),"
        "(%(na)s, 3, %(demo)s, 'N/A Status Deliverable', 0, 53, 0, %(own)s, 'demos-cms-user', "
        "  now(), now(), now())",
        {"ok": D_OK, "nn": D_NONAME, "na": D_NASTATUS, "demo": DEMO, "own": OWNER},
    )

    conn.execute(
        "CREATE TABLE demos_app.demonstration (id uuid, status_id text, "
        "PRIMARY KEY (id, status_id))"
    )
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, status_id) VALUES (%s, 'Approved')",
        (DEMO,),
    )

    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_deliverable_status ("
        " legacy_int_cd int PRIMARY KEY, status_id text, due_date_type_id text,"
        " expected_to_be_submitted boolean, null_ok boolean)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_deliverable_status VALUES "
        "(1, 'Upcoming', 'Normal', true, false),"
        "(0, NULL, 'Normal', NULL, true)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_deliverable_type "
        "(legacy_int_cd int PRIMARY KEY, demos_text_id text NOT NULL)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_deliverable_type VALUES "
        "(57, 'Quarterly Budget Neutrality Report'), (53, 'Monitoring Report')"
    )

    conn.execute(
        "CREATE TABLE demos_app.deliverable ("
        " id uuid PRIMARY KEY, deliverable_type_id text, name text, demonstration_id uuid,"
        " demonstration_status_id text, status_id text, cms_owner_user_id uuid,"
        " cms_owner_person_type_id text, due_date timestamptz, due_date_type_id text,"
        " expected_to_be_submitted boolean, created_at timestamptz, updated_at timestamptz)"
    )

    _apply(conn, LOADER)
    _apply(conn, HELD)
    _apply(conn, COMPLETENESS)


def test_valid_deliverable_loads_with_single_input_type(pg_db: psycopg.Connection) -> None:
    """The valid deliverable loads and its type resolves via the single-input crosswalk."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT deliverable_type_id, demonstration_status_id, status_id "
        "FROM demos_app.deliverable WHERE id = %s",
        (D_OK,),
    ).fetchone()
    assert row == ("Quarterly Budget Neutrality Report", "Approved", "Upcoming")
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.deliverable") == 1


def test_held_rows_absent_and_logged_without_stale_reason(pg_db: psycopg.Connection) -> None:
    """Held rows are not loaded and carry a real reason, not the retired type text."""
    _provision(pg_db)
    held = dict(
        pg_db.execute(
            "SELECT legacy_id, reason FROM migration._parity_deliverable_held "
            "ORDER BY legacy_id"
        ).fetchall()
    )
    assert set(held) == {2, 3}
    assert "empty deliverable name" in held[2]
    assert "N/A deliverable status (code 0)" in held[3]
    for reason in held.values():
        assert "deliverable_type unresolved" not in reason
        assert "BN routing sign-off pending" not in reason


def test_completeness_invariant_holds(pg_db: psycopg.Connection) -> None:
    """Check 15: loaded U held = all resolved, so the completeness view is empty."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._parity_deliverable_completeness") == 0


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    _apply(pg_db, LOADER)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.deliverable") == 1
