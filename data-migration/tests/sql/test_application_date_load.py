"""Live-PG load-correctness harness for the application_date loader.

Exercises sql/20_app/36_application_date.sql against a hand-built, FK-free
schema, asserting the derivations the milestone-date spec fixes:

  * a loaded demonstration gets one application_date row per milestone the
    tall stg.application_milestone crosswalk carries for it (date_type_id and
    date_value preserved; audit timestamps taken from the demonstration);
  * the loader preserves the Eastern-anchored instant the milestone view emits
    (migration.eastern_day_start/_end), so each date_value viewed in
    America/New_York round-trips to its source calendar day regardless of the
    session TimeZone;
  * a loaded demonstration with no milestone rows gets nothing;
  * a demonstration held back (absent from demos_app.demonstration) gets no
    application_date row even when the crosswalk carries milestones for it;
  * re-applying the loader is a no-op (idempotent);
  * the loader is a clean no-op before stg.application_milestone exists.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via the ``pg_db`` fixture);
self-skips without it.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import apply_migration_helper_fns

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
LOADER = ROOT / "sql" / "20_app" / "36_application_date.sql"

DEMO_U1 = uuid.UUID(int=0xA1)  # loaded, three milestones
DEMO_U2 = uuid.UUID(int=0xA2)  # loaded, no milestones
DEMO_U3 = uuid.UUID(int=0xA3)  # milestones in crosswalk, NOT loaded (held back)

DEMO1_CREATED = "2021-01-10 09:00:00+00"
DEMO1_UPDATED = "2021-02-01 09:00:00+00"


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    apply_migration_helper_fns(conn)  # eastern_day_start/_end used to build the fixture

    # stg.application_milestone: the tall (application_id, date_type_id,
    # date_value) crosswalk the loader consumes (a table stands in for the view).
    # date_value is Eastern-anchored exactly as the milestone view emits it:
    # start/approval milestones at start-of-day, "End Date" at end-of-day.
    conn.execute(
        "CREATE TABLE stg.application_milestone ("
        " application_id uuid NOT NULL,"
        " date_type_id text NOT NULL,"
        " date_value timestamptz NOT NULL)"
    )
    conn.execute(
        "INSERT INTO stg.application_milestone (application_id, date_type_id, date_value) VALUES "
        "(%s, 'Application Approval Date', migration.eastern_day_start(DATE '2024-12-16')),"
        "(%s, 'Federal Comment Period Start Date', migration.eastern_day_start(DATE '2024-10-01')),"
        "(%s, 'Federal Comment Period End Date', migration.eastern_day_end(DATE '2024-10-31')),"
        # Demo 3: held back
        "(%s, 'Application Approval Date', migration.eastern_day_start(DATE '2024-06-01'))",
        (DEMO_U1, DEMO_U1, DEMO_U1, DEMO_U3),
    )

    # demos_app.demonstration: only Demo 1 and 2 are loaded (Demo 3 held back).
    conn.execute(
        "CREATE TABLE demos_app.demonstration ("
        " id uuid PRIMARY KEY,"
        " created_at timestamptz NOT NULL,"
        " updated_at timestamptz NOT NULL)"
    )
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, created_at, updated_at) VALUES "
        "(%s, %s, %s), (%s, now(), now())",
        (DEMO_U1, DEMO1_CREATED, DEMO1_UPDATED, DEMO_U2),
    )

    conn.execute(
        "CREATE TABLE demos_app.application_date ("
        " application_id uuid NOT NULL,"
        " date_type_id text NOT NULL,"
        " date_value timestamptz NOT NULL,"
        " created_at timestamptz NOT NULL DEFAULT now(),"
        " updated_at timestamptz NOT NULL,"
        " PRIMARY KEY (application_id, date_type_id))"
    )

    _apply(conn, LOADER)


def test_loaded_demo_gets_all_its_milestone_rows(pg_db: psycopg.Connection) -> None:
    """Demo 1 gets one row per crosswalk milestone; values + audit ts preserved."""
    _provision(pg_db)
    n = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.application_date WHERE application_id = %s",
        (DEMO_U1,),
    )
    assert n == 3

    rows = pg_db.execute(
        "SELECT date_type_id, (date_value AT TIME ZONE 'America/New_York')::date, "
        "created_at, updated_at "
        "FROM demos_app.application_date WHERE application_id = %s "
        "ORDER BY date_type_id",
        (DEMO_U1,),
    ).fetchall()
    by_type = {r[0]: (str(r[1]), r[2], r[3]) for r in rows}
    # Each anchored instant round-trips to its source calendar day in Eastern.
    assert by_type["Application Approval Date"][0] == "2024-12-16"
    assert by_type["Federal Comment Period Start Date"][0] == "2024-10-01"
    assert by_type["Federal Comment Period End Date"][0] == "2024-10-31"
    # Audit timestamps come from the demonstration, not now(); compared as
    # instants so the check is independent of the connection's session TimeZone.
    assert by_type["Application Approval Date"][1] == datetime(2021, 1, 10, 9, tzinfo=UTC)
    assert by_type["Application Approval Date"][2] == datetime(2021, 2, 1, 9, tzinfo=UTC)


def test_demo_without_milestones_gets_no_rows(pg_db: psycopg.Connection) -> None:
    """Demo 2 is loaded but carries no crosswalk milestone -> no rows."""
    _provision(pg_db)
    n = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.application_date WHERE application_id = %s",
        (DEMO_U2,),
    )
    assert n == 0


def test_held_back_demo_gets_no_rows(pg_db: psycopg.Connection) -> None:
    """Demo 3 has crosswalk milestones but was not loaded -> no rows."""
    _provision(pg_db)
    n = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.application_date WHERE application_id = %s",
        (DEMO_U3,),
    )
    assert n == 0


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.application_date")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.application_date")
    assert before == after == 3


def test_loader_noop_when_stg_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op when stg.application_milestone does not exist."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute(
        "CREATE TABLE demos_app.application_date ("
        " application_id uuid NOT NULL,"
        " date_type_id text NOT NULL,"
        " date_value timestamptz NOT NULL,"
        " created_at timestamptz NOT NULL DEFAULT now(),"
        " updated_at timestamptz NOT NULL,"
        " PRIMARY KEY (application_id, date_type_id))"
    )
    _apply(conn, LOADER)  # should NOT raise
    n = _scalar(conn, "SELECT count(*) FROM demos_app.application_date")
    assert n == 0
