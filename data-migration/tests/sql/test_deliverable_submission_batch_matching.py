"""Live-PG harness for how batches are matched to `Submitted` status events.

Applies the real ``sql/10_stg/39_deliverable_submission_batch.sql`` on top of a
hand-built ``mysql_raw`` so the corroboration rule under test is the one that
runs in the pipeline.

The rule has to cope with two different kinds of source timestamp. Status rows
written before 2019 carry a date with no time of day, stored at midnight
(2016-2018 are 100% midnight, 2019 is 32%, 2020+ is ~0%), while file uploads
always carry a real time. A symmetric-ish window around the batch can never
reach a midnight event from an afternoon upload, so those submissions went
uncorroborated and the loader minted a second, duplicate submission beside the
one the source already recorded. Live, that was 984 date-only events of which
15 matched (1.5%), against 91.8% for events with a real timestamp.

So: match a date-only event anywhere in its own calendar day, keep the strict
window for real timestamps, and never adopt midnight as a submission instant.

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
STG = ROOT / "sql" / "10_stg" / "39_deliverable_submission_batch.sql"

# One deliverable per scenario, so a failure names the rule it broke.
D_SAME_DAY = uuid.UUID(int=0x401)   # midnight event, one upload later that day
D_OTHER_DAY = uuid.UUID(int=0x402)  # midnight event, upload the NEXT day
D_REAL_TS = uuid.UUID(int=0x403)    # real event 15 min after the upload
D_REAL_FAR = uuid.UUID(int=0x404)   # real event 5 h BEFORE the upload
D_TWO_BATCH = uuid.UUID(int=0x405)  # midnight event, two uploads the same day

L_SAME_DAY = 401
L_OTHER_DAY = 402
L_REAL_TS = 403
L_REAL_FAR = 404
L_TWO_BATCH = 405

UPLOADER = uuid.UUID(int=0xB1)
LEGACY_UPLOADER = 10


def _row(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> tuple[Any, ...]:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return row


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> Any:
    return _row(conn, sql, params)[0]


def _provision(conn: Any) -> None:
    """Build the minimum mysql_raw + id maps the real stg view reads."""
    conn.execute("DROP SCHEMA IF EXISTS migration, mysql_raw, stg CASCADE")
    for schema in ("migration", "mysql_raw", "stg"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # timestamptz, matching production. The rule keys off whether a status row
    # has a time of day, so the column type and an explicit offset on every
    # literal are load-bearing here, not incidental.
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_fil_doc ("
        " mdcd_dlvrbl_fil_doc_id bigint PRIMARY KEY, mdcd_dlvrbl_id bigint NOT NULL,"
        " user_id bigint, cmt_orgn_cd text NOT NULL, upld_aftr_acptd_ind smallint,"
        " creatd_dt timestamptz, dltd_ind smallint NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_stus_hstry ("
        " mdcd_dlvrbl_stus_hstry_id bigint PRIMARY KEY, mdcd_dlvrbl_id bigint NOT NULL,"
        " mdcd_dlvrbl_stus_cd integer NOT NULL, creatd_dt timestamptz,"
        " creatd_user_id bigint, dltd_ind smallint NOT NULL)"
    )
    conn.execute("CREATE TABLE stg._valid_dlvrbl_ids (dlvrbl_id bigint PRIMARY KEY)")
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_dlvrbl ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid UNIQUE NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_users ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid UNIQUE NOT NULL)"
    )

    ids = [
        (L_SAME_DAY, D_SAME_DAY),
        (L_OTHER_DAY, D_OTHER_DAY),
        (L_REAL_TS, D_REAL_TS),
        (L_REAL_FAR, D_REAL_FAR),
        (L_TWO_BATCH, D_TWO_BATCH),
    ]
    for legacy, new in ids:
        conn.execute("INSERT INTO stg._valid_dlvrbl_ids VALUES (%s)", (legacy,))
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_dlvrbl VALUES (%s, %s)", (legacy, new)
        )
    conn.execute(
        "INSERT INTO migration._id_map_users VALUES (%s, %s)", (LEGACY_UPLOADER, UPLOADER)
    )

    # (file id, deliverable, uploaded_at). One file per batch unless noted.
    files = [
        (4010, L_SAME_DAY, "2018-08-22 15:44:00"),
        (4020, L_OTHER_DAY, "2018-08-23 15:44:00"),
        (4030, L_REAL_TS, "2020-06-10 09:00:00"),
        (4040, L_REAL_FAR, "2020-06-10 14:00:00"),
        # Two sessions the same day: 6h44m apart, well over the 60-minute gap.
        (4050, L_TWO_BATCH, "2018-08-22 09:00:00"),
        (4051, L_TWO_BATCH, "2018-08-22 15:44:00"),
    ]
    for fid, did, ts in files:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl_fil_doc VALUES"
            " (%s, %s, %s, 'S', 0, (%s || '+00')::timestamptz, 0)",
            (fid, did, LEGACY_UPLOADER, ts),
        )

    # (event id, deliverable, created_at). 3 = Submitted.
    events = [
        (9010, L_SAME_DAY, "2018-08-22 00:00:00"),   # date-only, same day
        (9020, L_OTHER_DAY, "2018-08-22 00:00:00"),  # date-only, day BEFORE
        (9030, L_REAL_TS, "2020-06-10 09:15:00"),    # real, 15 min after
        (9040, L_REAL_FAR, "2020-06-10 09:00:00"),   # real, 5 h before
        (9050, L_TWO_BATCH, "2018-08-22 00:00:00"),  # date-only, two candidates
    ]
    for eid, did, ts in events:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl_stus_hstry VALUES"
            " (%s, %s, 3, (%s || '+00')::timestamptz, %s, 0)",
            (eid, did, ts, LEGACY_UPLOADER),
        )


def _apply(conn: Any) -> None:
    conn.execute(STG.read_text(encoding="utf-8"))


def _match(conn: Any, legacy_id: int) -> tuple[Any, ...]:
    return _row(
        conn,
        "SELECT corroborating_status_event_id, submitted_at, batch_end_at"
        " FROM stg.deliverable_submission_batch"
        " WHERE legacy_dlvrbl_id = %s ORDER BY batch_seq LIMIT 1",
        (legacy_id,),
    )


def test_stg_applies_twice(pg_db: psycopg.Connection) -> None:
    """The view file applies, and re-applies, cleanly."""
    _provision(pg_db)
    _apply(pg_db)
    _apply(pg_db)


def test_date_only_event_matches_upload_the_same_day(pg_db: psycopg.Connection) -> None:
    """A midnight-stamped Submitted event corroborates that day's upload.

    Pre-2019 status rows carry no time of day. Refusing to match one leaves the
    batch uncorroborated and the loader mints a duplicate submission next to the
    event the source already recorded.
    """
    _provision(pg_db)
    _apply(pg_db)
    event_id, _, _ = _match(pg_db, L_SAME_DAY)
    assert event_id == 9010


def test_date_only_match_keeps_the_upload_time(pg_db: psycopg.Connection) -> None:
    """submitted_at stays at the upload, because midnight is not a real instant.

    The view normally prefers the event's timestamp over the last upload. For a
    date-only event that would move the submission to 00:00:00 and lose the only
    real time we have.
    """
    _provision(pg_db)
    _apply(pg_db)
    _, submitted_at, batch_end_at = _match(pg_db, L_SAME_DAY)
    assert submitted_at == batch_end_at
    assert submitted_at.hour == 15


def test_date_only_event_does_not_reach_another_day(pg_db: psycopg.Connection) -> None:
    """Same-day is the whole licence; it must not spill into the next day."""
    _provision(pg_db)
    _apply(pg_db)
    event_id, _, _ = _match(pg_db, L_OTHER_DAY)
    assert event_id is None


def test_real_timestamp_event_still_matches_in_window(pg_db: psycopg.Connection) -> None:
    """Regression: an event shortly after the upload still corroborates it."""
    _provision(pg_db)
    _apply(pg_db)
    event_id, submitted_at, batch_end_at = _match(pg_db, L_REAL_TS)
    assert event_id == 9030
    # A real timestamp IS adopted as the submission instant.
    assert submitted_at != batch_end_at
    assert submitted_at.hour == 9
    assert submitted_at.minute == 15


def test_real_timestamp_event_long_before_upload_does_not_match(
    pg_db: psycopg.Connection,
) -> None:
    """Regression: the fix must not widen the window for real timestamps.

    Five hours before the upload is outside the one-hour tolerance and stays
    outside it; otherwise the date-only allowance would have quietly become a
    same-day allowance for everything.
    """
    _provision(pg_db)
    _apply(pg_db)
    event_id, _, _ = _match(pg_db, L_REAL_FAR)
    assert event_id is None


def test_date_only_event_is_claimed_by_only_one_batch(pg_db: psycopg.Connection) -> None:
    """Two sessions in a day cannot both claim the one recorded submission."""
    _provision(pg_db)
    _apply(pg_db)
    claims = _scalar(
        pg_db,
        "SELECT count(*) FROM stg.deliverable_submission_batch"
        " WHERE legacy_dlvrbl_id = %s AND corroborating_status_event_id IS NOT NULL",
        (L_TWO_BATCH,),
    )
    assert claims == 1
    total = _scalar(
        pg_db,
        "SELECT count(*) FROM stg.deliverable_submission_batch WHERE legacy_dlvrbl_id = %s",
        (L_TWO_BATCH,),
    )
    assert total == 2


def test_date_only_detection_survives_a_non_utc_session(
    pg_db: psycopg.Connection,
) -> None:
    """The midnight test must not read the server's TimeZone setting.

    These columns hold a wall clock stored at +00. Deciding "is this midnight"
    with a bare ``::time`` asks the session instead: on live data that returns
    1,012 date-only events under UTC and 0 under America/New_York, so the whole
    rule would silently stop firing for anyone with a different setting.
    """
    _provision(pg_db)
    pg_db.execute("SET TimeZone = 'America/New_York'")
    try:
        _apply(pg_db)
        event_id, _, _ = _match(pg_db, L_SAME_DAY)
        assert event_id == 9010
    finally:
        pg_db.execute("SET TimeZone = 'UTC'")


def test_no_status_event_is_claimed_twice_overall(pg_db: psycopg.Connection) -> None:
    """The 1:1 guarantee holds across the whole fixture, not just one case."""
    _provision(pg_db)
    _apply(pg_db)
    dupes = _scalar(
        pg_db,
        "SELECT count(*) FROM (SELECT corroborating_status_event_id"
        " FROM stg.deliverable_submission_batch"
        " WHERE corroborating_status_event_id IS NOT NULL"
        " GROUP BY 1 HAVING count(*) > 1) q",
    )
    assert dupes == 0
