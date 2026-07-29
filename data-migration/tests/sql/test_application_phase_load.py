"""Live-PG load-correctness harness for the application_phase loader.

Exercises sql/23_app_derived/50_application_phase.sql against a hand-built,
FK-free schema, asserting:

  * every loaded application (demonstration + amendment) gets exactly one row
    per real phase (the 8 phases with phase_number > 0);
  * status is derived from the current phase ordinal: earlier = Completed,
    current = Started, later = Not Started; Concept is never 'Not Started';
  * the Federal Comment past-window failsafe forces 'Completed' when the loaded
    Federal Comment Period End Date is before cutover (2026-08-20), and leaves a
    window still open at cutover at its derived status;
  * the cutover threshold is Eastern midnight (not UTC): a window that closed
    end-of-day 2026-08-19 Eastern is pre-cutover (forced Completed) while a
    window ending end-of-day 2026-08-20 Eastern is not -- a UTC-anchored
    threshold would misjudge the 08-19 boundary by the tz offset;
  * amendments get phase rows even though they carry no milestone dates;
  * re-applying the loader is a no-op (idempotent);
  * the loader is a clean no-op before demos_app.application_phase exists.

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
LOADER = ROOT / "sql" / "23_app_derived" / "50_application_phase.sql"

DEMO_A = uuid.UUID(int=0xA1)  # current 'Review'
DEMO_B = uuid.UUID(int=0xB2)  # current 'Federal Comment', window closed pre-cutover
DEMO_C = uuid.UUID(int=0xC3)  # current 'Federal Comment', window open past cutover
AMDT_M = uuid.UUID(int=0xD4)  # amendment, current 'Approval Summary'
DEMO_D = uuid.UUID(int=0xD5)  # 'Federal Comment', end EOD 2026-08-19 ET -> pre-cutover
DEMO_E = uuid.UUID(int=0xE6)  # 'Federal Comment', end EOD 2026-08-20 ET -> at cutover

# End-of-day America/New_York instants at the cutover boundary (migration.
# eastern_day_end): 2026-08 is EDT (-04:00), so the last millisecond of the day
# is 03:59:59.999 UTC the next calendar day. A UTC-anchored cutover would place
# EOD-08-19 (2026-08-20 03:59:59.999+00) AFTER 2026-08-20 00:00:00+00 and fail
# to force it; the Eastern cutover (2026-08-20 00:00:00-04:00 = ...04:00+00) is
# strictly greater, so EOD-08-19 is correctly pre-cutover.
FED_END_EOD_08_19_ET = "2026-08-20 03:59:59.999+00"
FED_END_EOD_08_20_ET = "2026-08-21 03:59:59.999+00"

PHASES = [
    ("Concept", 1),
    ("Application Intake", 2),
    ("Completeness", 3),
    ("Federal Comment", 4),
    ("SDG Preparation", 5),
    ("Review", 6),
    ("Approval Package", 7),
    ("Approval Summary", 8),
]


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _status(conn: Any, app_id: uuid.UUID, phase: str) -> str:
    row = conn.execute(
        "SELECT phase_status_id FROM demos_app.application_phase "
        "WHERE application_id = %s AND phase_id = %s",
        (app_id, phase),
    ).fetchone()
    assert row is not None, f"missing phase row {phase} for {app_id}"
    return str(row[0])


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")

    conn.execute("CREATE TABLE demos_app.phase (id text PRIMARY KEY, phase_number int NOT NULL)")
    values = ", ".join("(%s, %s)" for _ in PHASES)
    conn.execute(
        f"INSERT INTO demos_app.phase (id, phase_number) VALUES {values}",
        tuple(x for row in PHASES for x in row),
    )

    for tbl in ("demonstration", "amendment"):
        conn.execute(
            f"CREATE TABLE demos_app.{tbl} ("
            " id uuid PRIMARY KEY,"
            " current_phase_id text NOT NULL,"
            " created_at timestamptz NOT NULL,"
            " updated_at timestamptz NOT NULL)"
        )
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, current_phase_id, created_at, updated_at) VALUES "
        "(%s, 'Review', now(), now()),"
        "(%s, 'Federal Comment', now(), now()),"
        "(%s, 'Federal Comment', now(), now()),"
        "(%s, 'Federal Comment', now(), now()),"
        "(%s, 'Federal Comment', now(), now())",
        (DEMO_A, DEMO_B, DEMO_C, DEMO_D, DEMO_E),
    )
    conn.execute(
        "INSERT INTO demos_app.amendment (id, current_phase_id, created_at, updated_at) VALUES "
        "(%s, 'Approval Summary', now(), now())",
        (AMDT_M,),
    )

    conn.execute(
        "CREATE TABLE demos_app.application_date ("
        " application_id uuid NOT NULL,"
        " date_type_id text NOT NULL,"
        " date_value timestamptz NOT NULL,"
        " PRIMARY KEY (application_id, date_type_id))"
    )
    conn.execute(
        "INSERT INTO demos_app.application_date (application_id, date_type_id, date_value) VALUES "
        "(%s, 'Federal Comment Period End Date', '2024-10-31 00:00:00+00'),"  # B: closed
        "(%s, 'Federal Comment Period End Date', '2026-12-01 00:00:00+00'),"  # C: open
        "(%s, 'Federal Comment Period End Date', %s),"   # D: EOD 2026-08-19 ET -> pre-cutover
        "(%s, 'Federal Comment Period End Date', %s)",   # E: EOD 2026-08-20 ET -> at cutover
        (DEMO_B, DEMO_C, DEMO_D, FED_END_EOD_08_19_ET, DEMO_E, FED_END_EOD_08_20_ET),
    )

    conn.execute(
        "CREATE TABLE demos_app.application_phase ("
        " application_id uuid NOT NULL,"
        " phase_id text NOT NULL,"
        " phase_status_id text NOT NULL,"
        " created_at timestamptz NOT NULL DEFAULT now(),"
        " updated_at timestamptz NOT NULL DEFAULT now(),"
        " PRIMARY KEY (application_id, phase_id))"
    )

    _apply(conn, LOADER)


def test_every_application_gets_eight_phase_rows(pg_db: psycopg.Connection) -> None:
    """Each loaded demonstration + amendment gets exactly 8 phase rows."""
    _provision(pg_db)
    for app_id in (DEMO_A, DEMO_B, DEMO_C, DEMO_D, DEMO_E, AMDT_M):
        n = _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.application_phase WHERE application_id = %s",
            (app_id,),
        )
        assert n == 8, f"{app_id} has {n} phase rows"


def test_status_derived_from_current_phase_ordinal(pg_db: psycopg.Connection) -> None:
    """Demo A (current 'Review'): 1-5 Completed, 6 Started, 7-8 Not Started."""
    _provision(pg_db)
    assert _status(pg_db, DEMO_A, "Concept") == "Completed"
    assert _status(pg_db, DEMO_A, "SDG Preparation") == "Completed"
    assert _status(pg_db, DEMO_A, "Review") == "Started"
    assert _status(pg_db, DEMO_A, "Approval Package") == "Not Started"
    assert _status(pg_db, DEMO_A, "Approval Summary") == "Not Started"


def test_concept_never_not_started(pg_db: psycopg.Connection) -> None:
    """phase_phase_status forbids Concept = 'Not Started'; derivation respects it."""
    _provision(pg_db)
    n = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.application_phase "
        "WHERE phase_id = 'Concept' AND phase_status_id = 'Not Started'",
    )
    assert n == 0


def test_fed_comment_failsafe_forces_completed(pg_db: psycopg.Connection) -> None:
    """Demo B window closed pre-cutover -> Federal Comment forced Completed."""
    _provision(pg_db)
    assert _status(pg_db, DEMO_B, "Federal Comment") == "Completed"


def test_fed_comment_open_window_keeps_derived_status(pg_db: psycopg.Connection) -> None:
    """Demo C window open past cutover -> Federal Comment keeps derived 'Started'."""
    _provision(pg_db)
    assert _status(pg_db, DEMO_C, "Federal Comment") == "Started"


def test_fed_comment_cutover_boundary_is_eastern(pg_db: psycopg.Connection) -> None:
    """The cutover threshold is Eastern midnight, not UTC.

    DEMO_D closed end-of-day 2026-08-19 Eastern (2026-08-20 03:59:59.999+00),
    which is before the Eastern cutover (2026-08-20 00:00:00-04:00) -> forced
    Completed. DEMO_E closed end-of-day 2026-08-20 Eastern -> at/after cutover,
    so it keeps its derived 'Started'. A UTC-anchored threshold (2026-08-20
    00:00:00+00) would wrongly leave DEMO_D open, so this pins the anchor.
    """
    _provision(pg_db)
    assert _status(pg_db, DEMO_D, "Federal Comment") == "Completed"
    assert _status(pg_db, DEMO_E, "Federal Comment") == "Started"


def test_amendment_gets_phases(pg_db: psycopg.Connection) -> None:
    """Amendment M (current 'Approval Summary'): 1-7 Completed, 8 Started."""
    _provision(pg_db)
    assert _status(pg_db, AMDT_M, "Approval Package") == "Completed"
    assert _status(pg_db, AMDT_M, "Approval Summary") == "Started"


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying inserts nothing new and does not flip the failsafe result."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.application_phase")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.application_phase")
    assert before == after == 48  # 6 applications x 8 phases
    assert _status(pg_db, DEMO_B, "Federal Comment") == "Completed"


def test_loader_noop_when_target_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op when demos_app.application_phase does not exist."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    _apply(conn, LOADER)  # should NOT raise


def test_loader_noop_when_target_absent_smoke(pg_db: psycopg.Connection) -> None:
    """The guarded no-op leaves nothing behind (no application_phase table)."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    _apply(conn, LOADER)
    n = _scalar(
        conn,
        "SELECT count(*) FROM information_schema.tables "
        "WHERE table_schema = 'demos_app' AND table_name = 'application_phase'",
    )
    assert n == 0
