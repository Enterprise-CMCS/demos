"""Live-PG load-correctness harness for the application_date loader.

Exercises sql/20_app/36_application_date.sql against a hand-built, FK-free
schema, asserting the derivations the spec fixes:

  * a demonstration with an approval_date gets an application_date row with
    date_type_id 'Application Approval Date';
  * a demonstration without an approval_date (NULL) gets no row;
  * a demonstration that was held back (not in demos_app.demonstration) gets
    no application_date row even if its resolved row has an approval_date;
  * re-applying the loader is a no-op (idempotent).

Runs against a throwaway Postgres (``PG_TEST_DSN`` via the ``pg_db`` fixture);
self-skips without it.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
LOADER = ROOT / "sql" / "20_app" / "36_application_date.sql"

DEMO_U1 = uuid.UUID(int=0xA1)  # has approval_date, loaded
DEMO_U2 = uuid.UUID(int=0xA2)  # no approval_date, loaded
DEMO_U3 = uuid.UUID(int=0xA3)  # has approval_date, NOT loaded (held back)


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

    # stg.demonstration_resolved with the approval_date column.
    conn.execute(
        "CREATE TABLE stg.demonstration_resolved ("
        " new_uuid uuid PRIMARY KEY,"
        " approval_date timestamptz,"
        " created_at timestamptz NOT NULL DEFAULT now(),"
        " updated_at timestamptz NOT NULL DEFAULT now())"
    )
    conn.execute(
        "INSERT INTO stg.demonstration_resolved (new_uuid, approval_date) VALUES "
        "(%s, '2024-12-16 00:00:00+00'),"   # Demo 1: has approval_date
        "(%s, NULL),"                         # Demo 2: no approval_date
        "(%s, '2024-06-01 00:00:00+00')",   # Demo 3: has approval_date but held back
        (DEMO_U1, DEMO_U2, DEMO_U3),
    )

    # demos_app.demonstration: only Demo 1 and 2 are loaded (Demo 3 held back).
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.demonstration (id) VALUES (%s), (%s)",
        (DEMO_U1, DEMO_U2),
    )

    # demos_app.application_date: the target table.
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


def test_only_demos_with_approval_date_get_rows(pg_db: psycopg.Connection) -> None:
    """Demo 1 (approval_date) gets a row; Demo 2 (NULL) does not."""
    _provision(pg_db)
    n = _scalar(pg_db, "SELECT count(*) FROM demos_app.application_date")
    assert n == 1

    row = pg_db.execute(
        "SELECT application_id, date_type_id, date_value::date "
        "FROM demos_app.application_date"
    ).fetchone()
    assert row is not None
    assert row[0] == DEMO_U1
    assert row[1] == "Application Approval Date"
    assert str(row[2]) == "2024-12-16"


def test_held_back_demo_gets_no_row(pg_db: psycopg.Connection) -> None:
    """Demo 3 has an approval_date but was not loaded -> no application_date row."""
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
    assert before == after == 1


def test_loader_noop_when_stg_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op when stg.demonstration_resolved does not exist."""
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
