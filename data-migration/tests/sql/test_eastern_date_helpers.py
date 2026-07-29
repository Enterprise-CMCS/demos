"""Live-PG unit tests for the Eastern date-anchoring helpers.

``sql/00_init/03_helper_fns.sql`` defines ``migration.eastern_day_start`` and
``migration.eastern_day_end``, which anchor a legacy calendar date to the DEMOS
timestamptz convention -- midnight (start-of-day) or 23:59:59.999 (end-of-day)
in America/New_York, expressed as a UTC instant. These tests pin the exact UTC
instants across the EST/EDT boundary, NULL handling, session-timezone
independence, and idempotent re-apply. Equality is asserted in SQL (instant
comparison) so the result does not depend on the connection's session timezone.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via the ``pg_db`` fixture);
self-skips without it.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
HELPERS = ROOT / "sql" / "00_init" / "03_helper_fns.sql"


def _apply_helpers(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA migration")
    _reapply_helper_file(conn)


def _reapply_helper_file(conn: Any) -> None:
    """Apply 03_helper_fns.sql over the existing schema (CREATE OR REPLACE)."""
    conn.execute(HELPERS.read_text(encoding="utf-8"))


def _true(conn: Any, sql: str) -> bool:
    row = conn.execute(sql).fetchone()
    assert row is not None
    return bool(row[0])


def _scalar(conn: Any, sql: str) -> Any:
    row = conn.execute(sql).fetchone()
    assert row is not None
    return row[0]


def test_start_of_day_winter_is_midnight_est(pg_db: psycopg.Connection) -> None:
    """A winter date anchors to midnight EST (-05:00) = 05:00 UTC."""
    _apply_helpers(pg_db)
    assert _true(
        pg_db,
        "SELECT migration.eastern_day_start(DATE '2024-12-16') "
        "= TIMESTAMPTZ '2024-12-16 05:00:00+00'",
    )


def test_start_of_day_summer_is_midnight_edt(pg_db: psycopg.Connection) -> None:
    """A summer date anchors to midnight EDT (-04:00) = 04:00 UTC (DST-aware)."""
    _apply_helpers(pg_db)
    assert _true(
        pg_db,
        "SELECT migration.eastern_day_start(DATE '2024-07-01') "
        "= TIMESTAMPTZ '2024-07-01 04:00:00+00'",
    )


def test_end_of_day_winter_is_last_ms_est(pg_db: psycopg.Connection) -> None:
    """End-of-day EST = 23:59:59.999 Eastern = 04:59:59.999 UTC the next day."""
    _apply_helpers(pg_db)
    assert _true(
        pg_db,
        "SELECT migration.eastern_day_end(DATE '2024-12-16') "
        "= TIMESTAMPTZ '2024-12-17 04:59:59.999+00'",
    )


def test_end_of_day_summer_is_last_ms_edt(pg_db: psycopg.Connection) -> None:
    """End-of-day EDT = 23:59:59.999 Eastern = 03:59:59.999 UTC the next day."""
    _apply_helpers(pg_db)
    assert _true(
        pg_db,
        "SELECT migration.eastern_day_end(DATE '2024-07-01') "
        "= TIMESTAMPTZ '2024-07-02 03:59:59.999+00'",
    )


def test_null_in_null_out(pg_db: psycopg.Connection) -> None:
    """STRICT: a NULL date yields NULL, never a spurious epoch instant."""
    _apply_helpers(pg_db)
    assert _scalar(pg_db, "SELECT migration.eastern_day_start(NULL::date)") is None
    assert _scalar(pg_db, "SELECT migration.eastern_day_end(NULL::date)") is None


def test_result_is_session_timezone_independent(pg_db: psycopg.Connection) -> None:
    """The anchored instant is identical regardless of the session TimeZone."""
    _apply_helpers(pg_db)
    pg_db.execute("SET TIME ZONE 'UTC'")
    utc = _scalar(pg_db, "SELECT migration.eastern_day_start(DATE '2024-12-16')")
    pg_db.execute("SET TIME ZONE 'America/Chicago'")
    chi = _scalar(pg_db, "SELECT migration.eastern_day_start(DATE '2024-12-16')")
    pg_db.execute("SET TIME ZONE 'Asia/Tokyo'")
    tok = _scalar(pg_db, "SELECT migration.eastern_day_start(DATE '2024-12-16')")
    pg_db.execute("SET TIME ZONE 'UTC'")
    assert utc == chi == tok


def test_round_trips_to_source_calendar_day(pg_db: psycopg.Connection) -> None:
    """The whole point: `AT TIME ZONE 'America/New_York'` recovers the source day.

    A bare midnight-UTC cast, by contrast, renders the day *before* in Eastern.
    """
    _apply_helpers(pg_db)
    assert (
        _scalar(
            pg_db,
            "SELECT to_char(migration.eastern_day_start(DATE '2024-12-16') "
            "AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')",
        )
        == "12/16/2024"
    )
    # End-of-day still lands on the same calendar day in Eastern.
    assert (
        _scalar(
            pg_db,
            "SELECT to_char(migration.eastern_day_end(DATE '2024-12-16') "
            "AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')",
        )
        == "12/16/2024"
    )
    # Contrast: the old bare cast (midnight UTC) shifts back to 12/15 in Eastern.
    assert (
        _scalar(
            pg_db,
            "SELECT to_char(TIMESTAMPTZ '2024-12-16 00:00:00+00' "
            "AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')",
        )
        == "12/15/2024"
    )


def test_helpers_are_idempotent(pg_db: psycopg.Connection) -> None:
    """CREATE OR REPLACE: applying the helper file twice does not raise."""
    _apply_helpers(pg_db)
    _reapply_helper_file(pg_db)
    assert _true(
        pg_db,
        "SELECT migration.eastern_day_start(DATE '2024-12-16') "
        "= TIMESTAMPTZ '2024-12-16 05:00:00+00'",
    )
