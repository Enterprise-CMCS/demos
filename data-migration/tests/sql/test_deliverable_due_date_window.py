"""Live-PG harness for the due-date-at-submission-time windows.

Covers sql/10_stg/40_deliverable_due_date_window.sql and the lookup that
sql/23_app_derived/60_deliverable_action.sql performs against it.

Before this view, every synthesized action carried the deliverable's *current*
due date, so a submission that predates an extension recorded the extended date
rather than the one it was actually judged against. The view reconstructs the
value in effect at any instant from mysql_raw.mdcd_dlvrbl_hstry.

Two properties carry the risk and are tested hardest:

  * TIMEZONE. mdcd_dlvrbl_hstry.hstry_updtd_dt is true UTC, while the file and
    status tables the action timestamps come from are Eastern wall-clock stored
    at +00 (see the KNOWN SKEW note in 39_deliverable_submission_batch.sql).
    Comparing them raw would misplace every window by 4 or 5 hours, so the view
    converts, and the conversion has to be DST-aware rather than a fixed offset.
  * WINDOW ALGEBRA. Windows must tile the timeline without gaps or overlaps, or
    one action resolves to two due dates and the UPDATE becomes order-dependent.
    Repeated timestamps in the source make that a real hazard, not a
    theoretical one.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via ``pg_db``); self-skips
without it.
"""

from __future__ import annotations

import datetime as dt
import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
WINDOW = ROOT / "sql" / "10_stg" / "40_deliverable_due_date_window.sql"
SEED = ROOT / "sql" / "02_seeds_static" / "30_deliverable_action_chain.sql"
IDMAP = ROOT / "sql" / "05_id_maps" / "20_deliverable_action.sql"
LOADER = ROOT / "sql" / "23_app_derived" / "60_deliverable_action.sql"

OWNER = uuid.UUID(int=0xA1)
UPLOADER = uuid.UUID(int=0xB1)

D_TWO_WINDOWS = uuid.UUID(int=0x401)   # two due-date changes -> three windows
D_NO_HISTORY = uuid.UUID(int=0x402)    # no history at all -> keeps current due date
D_DUP_TS = uuid.UUID(int=0x403)        # two history rows at one instant
D_NULL_DUE = uuid.UUID(int=0x404)      # history rows with no due date at all
D_PRVS_ONLY = uuid.UUID(int=0x405)     # only mdcd_dlvrbl_prvs_due_dt is populated
D_DST = uuid.UUID(int=0x406)           # one EDT row and one EST row

LEGACY = {
    D_TWO_WINDOWS: 401,
    D_NO_HISTORY: 402,
    D_DUP_TS: 403,
    D_NULL_DUE: 404,
    D_PRVS_ONLY: 405,
    D_DST: 406,
}

# The deliverable's *current* due date. Every window test asserts against a
# value that differs from this, so a passing test cannot be the fallback.
CURRENT_DUE = dt.date(2024, 12, 31)

DUE_A = dt.date(2024, 3, 31)
DUE_B = dt.date(2024, 6, 30)
DUE_C = dt.date(2024, 9, 30)

# The view's open-ended bounds. Finite on purpose: psycopg raises DataError on
# an infinite timestamp, so +/-infinity would make the view unreadable here.
EPOCH_START = dt.datetime(1900, 1, 1, tzinfo=dt.UTC)
EPOCH_END = dt.datetime(2999, 12, 31, tzinfo=dt.UTC)

# True-UTC instants, as stored in mdcd_dlvrbl_hstry.
CHANGE_1 = dt.datetime(2024, 4, 10, 18, 0, tzinfo=dt.UTC)
CHANGE_2 = dt.datetime(2024, 7, 20, 18, 0, tzinfo=dt.UTC)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _row(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> tuple[Any, ...]:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return row


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> Any:
    return _row(conn, sql, params)[0]


def _eastern_wall_clock(instant: dt.datetime) -> dt.datetime:
    """Render a true-UTC instant the way the rest of the pipeline stores time.

    Mirrors the view's ``AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC'``
    round trip so the expectations are computed independently of the SQL.
    """
    import zoneinfo

    eastern = instant.astimezone(zoneinfo.ZoneInfo("America/New_York"))
    return eastern.replace(tzinfo=dt.UTC)


def _provision(conn: Any, *, with_loader: bool = False) -> None:
    conn.execute("DROP SCHEMA IF EXISTS migration, mysql_raw, demos_app, stg CASCADE")
    for schema in ("migration", "mysql_raw", "demos_app", "stg"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE FUNCTION migration.eastern_day_start(p_date date) RETURNS timestamptz "
        "LANGUAGE sql IMMUTABLE AS $$ SELECT timezone('America/New_York', p_date::timestamp) $$"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_dlvrbl ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid UNIQUE NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_hstry ("
        " mdcd_dlvrbl_hstry_id bigint PRIMARY KEY, mdcd_dlvrbl_id bigint NOT NULL,"
        " hstry_updtd_dt timestamptz, dlvrbl_due_dt date, mdcd_dlvrbl_prvs_due_dt date)"
    )
    for did, legacy in LEGACY.items():
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_dlvrbl (legacy_int_id, new_uuid) VALUES (%s, %s)",
            (legacy, did),
        )

    rows = [
        # Two changes -> three windows: DUE_A before CHANGE_1, DUE_B between,
        # DUE_C after CHANGE_2.
        (1, LEGACY[D_TWO_WINDOWS], CHANGE_1, DUE_B, DUE_A),
        (2, LEGACY[D_TWO_WINDOWS], CHANGE_2, DUE_C, DUE_B),
        # Same instant twice; the higher hstry id is the later write and wins.
        (3, LEGACY[D_DUP_TS], CHANGE_1, DUE_A, None),
        (4, LEGACY[D_DUP_TS], CHANGE_1, DUE_B, None),
        # No due date on either column -> contributes no window.
        (5, LEGACY[D_NULL_DUE], CHANGE_1, None, None),
        # Only the previous-due column is populated.
        (6, LEGACY[D_PRVS_ONLY], CHANGE_1, None, DUE_A),
        # EDT (-04:00) then EST (-05:00), to prove the shift is not a constant.
        (7, LEGACY[D_DST], dt.datetime(2024, 7, 15, 18, 0, tzinfo=dt.UTC), DUE_B, DUE_A),
        (8, LEGACY[D_DST], dt.datetime(2024, 1, 15, 18, 0, tzinfo=dt.UTC), DUE_A, None),
    ]
    for row in rows:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl_hstry (mdcd_dlvrbl_hstry_id, mdcd_dlvrbl_id,"
            " hstry_updtd_dt, dlvrbl_due_dt, mdcd_dlvrbl_prvs_due_dt) VALUES (%s, %s, %s, %s, %s)",
            row,
        )

    if with_loader:
        _provision_loader(conn)
    _apply(conn, WINDOW)
    if with_loader:
        _apply(conn, SEED)
        _apply(conn, IDMAP)
        _apply(conn, LOADER)


def _provision_loader(conn: Any) -> None:
    """The slice of the app schema 60_deliverable_action.sql writes into."""
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY, name text)")
    conn.execute("CREATE TABLE demos_app.deliverable_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_status (id) VALUES "
        "('Accepted'), ('Approved'), ('Deleted'), ('Past Due'), ('Received and Filed'),"
        " ('Submitted'), ('Under CMS Review'), ('Upcoming')"
    )
    conn.execute(
        "CREATE TABLE demos_app.deliverable ("
        " id uuid PRIMARY KEY, name text, demonstration_id uuid, status_id text,"
        " cms_owner_user_id uuid NOT NULL, due_date timestamptz NOT NULL,"
        " created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL)"
    )
    conn.execute("CREATE TABLE demos_app.users (id uuid PRIMARY KEY, username text)")
    conn.execute(
        "INSERT INTO demos_app.users (id, username) VALUES (%s, 'state.uploader'), (%s, 'cms.owner')",
        (UPLOADER, OWNER),
    )
    conn.execute(
        "CREATE TABLE demos_app.deliverable_action_type ("
        " id text PRIMARY KEY, due_date_change_allowed boolean NOT NULL,"
        " should_have_note boolean NOT NULL, should_have_user_id boolean NOT NULL,"
        " extension_id_optional boolean NOT NULL)"
    )
    conn.execute(
        "INSERT INTO demos_app.deliverable_action_type VALUES "
        "('Accepted Deliverable', false, false, true, true),"
        "('Approved Deliverable', false, false, true, true),"
        "('Created Deliverable Slot', false, false, true, true),"
        "('Marked as Past Due', false, false, false, true),"
        "('Received and Filed Deliverable', false, false, true, true),"
        "('Started Review', false, false, true, true),"
        "('Submitted Deliverable', false, false, true, true),"
        "('Requested Extension', false, true, true, false)"
    )
    conn.execute(
        "CREATE TABLE demos_app.deliverable_action ("
        " id uuid PRIMARY KEY, action_timestamp timestamptz NOT NULL,"
        " deliverable_id uuid NOT NULL, action_type_id text NOT NULL,"
        " old_status_id text NOT NULL, new_status_id text NOT NULL, note text,"
        " active_extension_id uuid, due_date_change_allowed boolean NOT NULL,"
        " should_have_note boolean NOT NULL, should_have_user_id boolean NOT NULL,"
        " extension_id_optional boolean NOT NULL, old_due_date timestamptz NOT NULL,"
        " new_due_date timestamptz NOT NULL, user_id uuid,"
        " CONSTRAINT block_unpermitted_due_date_changes"
        "   CHECK (NOT (due_date_change_allowed = false AND old_due_date != new_due_date)))"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl ("
        " mdcd_dlvrbl_id bigint PRIMARY KEY, dlvrbl_stus_updt_dt date)"
    )
    conn.execute(
        "CREATE TABLE stg.deliverable_submission_batch ("
        " deliverable_id uuid NOT NULL, legacy_dlvrbl_id bigint NOT NULL,"
        " origin_cd text NOT NULL, batch_seq integer NOT NULL,"
        " anchor_fil_doc_id bigint NOT NULL, uploader_user_id uuid,"
        " submitted_at timestamptz NOT NULL)"
    )
    conn.execute("INSERT INTO demos_app.demonstration (id, name) VALUES (%s, 'Demo')", (OWNER,))

    created = dt.datetime(2024, 1, 1, tzinfo=dt.UTC)
    updated = dt.datetime(2024, 11, 1, tzinfo=dt.UTC)
    for did, legacy in LEGACY.items():
        conn.execute(
            "INSERT INTO demos_app.deliverable (id, name, demonstration_id, status_id,"
            " cms_owner_user_id, due_date, created_at, updated_at)"
            " VALUES (%s, %s, %s, 'Submitted', %s, %s, %s, %s)",
            (did, f"D{legacy}", OWNER, OWNER, CURRENT_DUE, created, updated),
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_id, dlvrbl_stus_updt_dt)"
            " VALUES (%s, %s)",
            (legacy, dt.date(2024, 10, 15)),
        )

    # A submission inside the FIRST window of D_TWO_WINDOWS: Eastern wall clock,
    # matching how 39_deliverable_submission_batch.sql emits submitted_at.
    conn.execute(
        "INSERT INTO stg.deliverable_submission_batch (deliverable_id, legacy_dlvrbl_id,"
        " origin_cd, batch_seq, anchor_fil_doc_id, uploader_user_id, submitted_at)"
        " VALUES (%s, %s, 'S', 1, 4010, %s, %s)",
        (D_TWO_WINDOWS, LEGACY[D_TWO_WINDOWS], UPLOADER,
         dt.datetime(2024, 2, 1, 10, 0, tzinfo=dt.UTC)),
    )
    # A submission for a deliverable with no history at all.
    conn.execute(
        "INSERT INTO stg.deliverable_submission_batch (deliverable_id, legacy_dlvrbl_id,"
        " origin_cd, batch_seq, anchor_fil_doc_id, uploader_user_id, submitted_at)"
        " VALUES (%s, %s, 'S', 1, 4020, %s, %s)",
        (D_NO_HISTORY, LEGACY[D_NO_HISTORY], UPLOADER,
         dt.datetime(2024, 2, 1, 10, 0, tzinfo=dt.UTC)),
    )


def _windows(conn: Any, deliverable: uuid.UUID) -> list[tuple[Any, ...]]:
    return conn.execute(
        "SELECT due_date, valid_from, valid_to FROM stg.deliverable_due_date_window"
        " WHERE deliverable_id = %s ORDER BY valid_from",
        (deliverable,),
    ).fetchall()


def test_view_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Apply the view file twice; the second pass must not error."""
    _provision(pg_db)
    _apply(pg_db, WINDOW)
    assert _scalar(pg_db, "SELECT count(*) FROM stg.deliverable_due_date_window") > 0


def test_two_changes_produce_three_contiguous_windows(pg_db: psycopg.Connection) -> None:
    """Each history row opens a window; the value carried is the one then in effect."""
    _provision(pg_db)
    rows = _windows(pg_db, D_TWO_WINDOWS)
    assert len(rows) == 3

    expected_due = [DUE_A, DUE_B, DUE_C]
    for (due_date, _, _), want in zip(rows, expected_due, strict=True):
        assert due_date.date() == want

    # First reaches back before recorded history, last runs open-ended, and each
    # window starts exactly where the previous one ended.
    assert rows[0][1] == EPOCH_START
    assert rows[-1][2] == EPOCH_END
    assert rows[0][2] == rows[1][1]
    assert rows[1][2] == rows[2][1]


def test_windows_never_overlap(pg_db: psycopg.Connection) -> None:
    """Overlap would make the loader's UPDATE pick a due date by row order."""
    _provision(pg_db)
    overlaps = _scalar(
        pg_db,
        "SELECT count(*) FROM stg.deliverable_due_date_window a"
        " JOIN stg.deliverable_due_date_window b"
        "   ON b.deliverable_id = a.deliverable_id"
        "  AND (a.valid_from, a.valid_to) IS DISTINCT FROM (b.valid_from, b.valid_to)"
        "  AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to",
    )
    assert overlaps == 0


def test_repeated_timestamps_collapse_to_one_window(pg_db: psycopg.Connection) -> None:
    """Two rows at one instant must not produce a zero-width window."""
    _provision(pg_db)
    rows = _windows(pg_db, D_DUP_TS)
    assert len(rows) == 1
    # The higher hstry id is the later write, so DUE_B wins over DUE_A.
    assert rows[0][0].date() == DUE_B
    assert rows[0][1] == EPOCH_START
    assert rows[0][2] == EPOCH_END


def test_history_without_any_due_date_is_skipped(pg_db: psycopg.Connection) -> None:
    """A row carrying neither due-date column tells us nothing and must not tile."""
    _provision(pg_db)
    assert _windows(pg_db, D_NULL_DUE) == []


def test_previous_due_date_is_used_when_current_is_null(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    rows = _windows(pg_db, D_PRVS_ONLY)
    assert len(rows) == 1
    assert rows[0][0].date() == DUE_A


def test_utc_history_is_converted_dst_aware(pg_db: psycopg.Connection) -> None:
    """The shift is 4h in July and 5h in January, not a constant."""
    _provision(pg_db)
    rows = _windows(pg_db, D_DST)
    assert len(rows) == 2

    january = dt.datetime(2024, 1, 15, 18, 0, tzinfo=dt.UTC)
    july = dt.datetime(2024, 7, 15, 18, 0, tzinfo=dt.UTC)
    # January row sorts first and opens at -infinity, so the boundary under test
    # is the start of the July window.
    assert rows[1][1] == _eastern_wall_clock(july)
    assert rows[0][2] == _eastern_wall_clock(july)
    assert _eastern_wall_clock(july).hour == 14   # EDT, -04:00
    assert _eastern_wall_clock(january).hour == 13  # EST, -05:00


def test_action_records_the_due_date_in_effect_at_its_timestamp(
    pg_db: psycopg.Connection,
) -> None:
    """The regression this whole change exists for."""
    _provision(pg_db, with_loader=True)
    old_due, new_due = _row(
        pg_db,
        "SELECT old_due_date, new_due_date FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_TWO_WINDOWS,),
    )
    # Submitted 2024-02-01, before CHANGE_1, so the due date then was DUE_A --
    # not CURRENT_DUE, and not the DUE_C the deliverable carries today.
    assert old_due.date() == DUE_A
    assert new_due.date() == DUE_A


def test_action_keeps_the_current_due_date_without_history(
    pg_db: psycopg.Connection,
) -> None:
    """No window is not an error; the deliverable's own due date still applies."""
    _provision(pg_db, with_loader=True)
    old_due = _scalar(
        pg_db,
        "SELECT old_due_date FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_NO_HISTORY,),
    )
    assert old_due.date() == CURRENT_DUE


def test_old_and_new_due_date_stay_equal(pg_db: psycopg.Connection) -> None:
    """block_unpermitted_due_date_changes must keep holding after the rewrite."""
    _provision(pg_db, with_loader=True)
    assert _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.deliverable_action WHERE old_due_date <> new_due_date",
    ) == 0


def test_loader_is_idempotent_with_windows(pg_db: psycopg.Connection) -> None:
    _provision(pg_db, with_loader=True)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.deliverable_action")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.deliverable_action")
    assert before == after
    assert _scalar(
        pg_db,
        "SELECT old_due_date FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_TWO_WINDOWS,),
    ).date() == DUE_A


def test_loader_falls_back_when_the_window_view_is_absent(
    pg_db: psycopg.Connection,
) -> None:
    """Dropping the view must degrade to the current due date, not fail the load."""
    _provision(pg_db, with_loader=True)
    pg_db.execute("DROP VIEW stg.deliverable_due_date_window")
    pg_db.execute("DELETE FROM demos_app.deliverable_action")
    _apply(pg_db, LOADER)
    old_due = _scalar(
        pg_db,
        "SELECT old_due_date FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_TWO_WINDOWS,),
    )
    assert old_due.date() == CURRENT_DUE
