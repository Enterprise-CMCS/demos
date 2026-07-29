"""Live-PG harness for the synthesized deliverable_action chains.

Covers the derived loader (sql/23_app_derived/60_deliverable_action.sql), the
chain seed (sql/02_seeds_static/30_deliverable_action_chain.sql) and its
fail-closed validator (sql/04_crosswalks/74_deliverable_action_chain_check.sql)
against a hand-built, FK-free schema that carries the REAL CHECK constraints
from the pinned Prisma DDL. The constraints are the point: these rows are
synthesized, so the only thing standing between the synthesis and a failed
constraints phase is that the loader reads the seeded action-type flags instead
of assuming them.

  * each terminal status gets its full seeded chain, landing on that status;
  * 'Marked as Past Due' carries a NULL user_id (should_have_user_id = FALSE)
    while every other hop carries the deliverable's CMS owner;
  * every hop is note-free and due-date-frozen;
  * timestamps strictly increase, hop 1 recovers the real created_at, and the
    LEAST() clamp keeps ordering when created_at falls inside the chain window;
  * the terminal hop prefers the source status date over updated_at;
  * a deliverable whose status has no seeded chain is held with a specific
    reason instead of silently getting no timeline;
  * the validator fails closed on an unconfigured hop and on a chain that does
    not reach its terminal status.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via ``pg_db``); self-skips
without it.
"""

from __future__ import annotations

import datetime as dt
import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "sql" / "02_seeds_static" / "30_deliverable_action_chain.sql"
CHECK = ROOT / "sql" / "04_crosswalks" / "74_deliverable_action_chain_check.sql"
IDMAP = ROOT / "sql" / "05_id_maps" / "20_deliverable_action.sql"
LOADER = ROOT / "sql" / "23_app_derived" / "60_deliverable_action.sql"
COMPLETENESS = ROOT / "sql" / "99_parity" / "62_deliverable_action_completeness.sql"
HELD = ROOT / "sql" / "99_parity" / "63_deliverable_action_held.sql"

OWNER = uuid.UUID(int=0xA1)

# One deliverable per terminal status, plus two timing edge cases and one
# deliverable whose status has no seeded chain.
D_UPCOMING = uuid.UUID(int=0x301)
D_PAST_DUE = uuid.UUID(int=0x302)
D_SUBMITTED = uuid.UUID(int=0x303)
D_REVIEW = uuid.UUID(int=0x304)
D_ACCEPTED = uuid.UUID(int=0x305)
D_APPROVED = uuid.UUID(int=0x306)
D_FILED = uuid.UUID(int=0x307)
D_TIGHT = uuid.UUID(int=0x308)      # created_at inside the chain window -> clamp
D_NO_SRC_DATE = uuid.UUID(int=0x309)  # no dlvrbl_stus_updt_dt -> falls back
D_UNSEEDED = uuid.UUID(int=0x30A)   # status with no seeded chain -> held

# Batch-mode only. These exercise the submission evidence cascade and are added
# to the fixture solely when stg.deliverable_submission_batch is provisioned, so
# the degraded-mode tests above keep their exact original population.
D_MULTI = uuid.UUID(int=0x310)       # three state upload sessions -> three submissions
D_CMS_ONLY = uuid.UUID(int=0x311)    # only a CMS attachment -> no submission
D_BARE = uuid.UUID(int=0x312)        # no upload, no submitted event -> no submission
D_HSTRY = uuid.UUID(int=0x313)       # no upload but a real Submitted event -> one hop
D_GHOST = uuid.UUID(int=0x314)       # uploader absent from users -> falls back to owner

UPLOADER = uuid.UUID(int=0xB1)
GHOST_UPLOADER = uuid.UUID(int=0xB2)  # deliberately never inserted into users

BATCH_TS = [
    dt.datetime(2024, 2, 1, 15, 30, tzinfo=dt.UTC),
    dt.datetime(2024, 3, 1, 9, 5, tzinfo=dt.UTC),
    dt.datetime(2024, 4, 1, 18, 45, tzinfo=dt.UTC),
]

STATUSES = {
    D_UPCOMING: ("Upcoming", 1),
    D_PAST_DUE: ("Past Due", 2),
    D_SUBMITTED: ("Submitted", 2),
    D_REVIEW: ("Under CMS Review", 3),
    D_ACCEPTED: ("Accepted", 4),
    D_APPROVED: ("Approved", 4),
    D_FILED: ("Received and Filed", 4),
}

DUE = dt.datetime(2024, 6, 1, tzinfo=dt.UTC)
CREATED = dt.datetime(2024, 1, 1, tzinfo=dt.UTC)
UPDATED = dt.datetime(2024, 9, 1, tzinfo=dt.UTC)
STATUS_DATE = dt.date(2024, 8, 15)
# eastern_day_start('2024-08-15') is 2024-08-15 00:00 America/New_York = 04:00Z.
STATUS_TS = dt.datetime(2024, 8, 15, 4, 0, tzinfo=dt.UTC)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> Any:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return row[0]


def _provision(conn: Any, *, with_batches: bool = False) -> None:
    conn.execute("DROP SCHEMA IF EXISTS migration, mysql_raw, demos_app, stg CASCADE")
    for schema in ("migration", "mysql_raw", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # migration.eastern_day_start is provided by sql/00_init/03_helper_fns.sql in
    # the real pipeline; the legacy status column is a DATE, so the conversion is
    # part of the contract under test and is reproduced exactly.
    conn.execute(
        "CREATE FUNCTION migration.eastern_day_start(p_date date) RETURNS timestamptz "
        "LANGUAGE sql IMMUTABLE AS $$ SELECT timezone('America/New_York', p_date::timestamp) $$"
    )

    conn.execute(
        "CREATE TABLE demos_app.deliverable ("
        " id uuid PRIMARY KEY, name text, demonstration_id uuid, status_id text,"
        " cms_owner_user_id uuid NOT NULL, due_date timestamptz NOT NULL,"
        " created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL)"
    )
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY, name text)")
    conn.execute("CREATE TABLE demos_app.deliverable_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_status (id) VALUES "
        "('Accepted'), ('Approved'), ('Deleted'), ('Past Due'), ('Received and Filed'),"
        " ('Submitted'), ('Under CMS Review'), ('Upcoming')"
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
        "CREATE TABLE demos_app.deliverable_action_configuration ("
        " action_type_id text, old_status_id text, new_status_id text,"
        " PRIMARY KEY (action_type_id, old_status_id, new_status_id))"
    )
    conn.execute(
        "INSERT INTO demos_app.deliverable_action_configuration VALUES "
        "('Created Deliverable Slot', 'Upcoming', 'Upcoming'),"
        "('Marked as Past Due', 'Upcoming', 'Past Due'),"
        "('Submitted Deliverable', 'Upcoming', 'Submitted'),"
        "('Started Review', 'Submitted', 'Under CMS Review'),"
        "('Accepted Deliverable', 'Under CMS Review', 'Accepted'),"
        "('Approved Deliverable', 'Under CMS Review', 'Approved'),"
        "('Received and Filed Deliverable', 'Under CMS Review', 'Received and Filed')"
    )
    # The real table plus the five CHECK constraints from the pinned Prisma DDL.
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
        "   CHECK (NOT (due_date_change_allowed = false AND old_due_date != new_due_date)),"
        " CONSTRAINT check_non_empty_note CHECK (note IS NULL OR trim(note) != ''),"
        " CONSTRAINT require_extension_id_for_extension_actions"
        "   CHECK (extension_id_optional = true"
        "          OR (extension_id_optional = false AND active_extension_id IS NOT NULL)),"
        " CONSTRAINT require_notes_for_user_actions"
        "   CHECK ((should_have_note = false AND note IS NULL)"
        "          OR (should_have_note = true AND note IS NOT NULL)),"
        " CONSTRAINT require_user_id_for_user_actions"
        "   CHECK ((should_have_user_id = false AND user_id IS NULL)"
        "          OR (should_have_user_id = true AND user_id IS NOT NULL)))"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_dlvrbl ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid UNIQUE NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl ("
        " mdcd_dlvrbl_id bigint PRIMARY KEY, dlvrbl_stus_updt_dt date)"
    )

    rows = []
    for i, (did, (status, _)) in enumerate(STATUSES.items(), start=1):
        rows.append((did, status, CREATED, UPDATED, i))
    # created_at only two seconds before the terminal timestamp: a 4-hop chain
    # would otherwise start before it.
    rows.append((D_TIGHT, "Accepted", STATUS_TS - dt.timedelta(seconds=2), UPDATED, 90))
    rows.append((D_NO_SRC_DATE, "Submitted", CREATED, UPDATED, 91))
    rows.append((D_UNSEEDED, "Deleted", CREATED, UPDATED, 92))
    if with_batches:
        rows.append((D_MULTI, "Accepted", CREATED, UPDATED, 93))
        rows.append((D_CMS_ONLY, "Accepted", CREATED, UPDATED, 94))
        rows.append((D_BARE, "Accepted", CREATED, UPDATED, 95))
        rows.append((D_HSTRY, "Accepted", CREATED, UPDATED, 96))
        rows.append((D_GHOST, "Accepted", CREATED, UPDATED, 97))

    conn.execute("INSERT INTO demos_app.demonstration (id, name) VALUES (%s, 'Demo')", (OWNER,))
    for did, status, created, updated, legacy in rows:
        conn.execute(
            "INSERT INTO demos_app.deliverable (id, name, demonstration_id, status_id,"
            " cms_owner_user_id, due_date, created_at, updated_at)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (did, f"D{legacy}", OWNER, status, OWNER, DUE, created, updated),
        )
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_dlvrbl (legacy_int_id, new_uuid) VALUES (%s, %s)",
            (legacy, did),
        )
        # D_NO_SRC_DATE deliberately has a NULL status date to exercise the fallback.
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_id, dlvrbl_stus_updt_dt)"
            " VALUES (%s, %s)",
            (legacy, None if did == D_NO_SRC_DATE else STATUS_DATE),
        )

    if with_batches:
        _provision_submission_evidence(conn)

    _apply(conn, SEED)
    _apply(conn, CHECK)
    _apply(conn, IDMAP)
    _apply(conn, LOADER)
    _apply(conn, HELD)
    _apply(conn, COMPLETENESS)


def _provision_submission_evidence(conn: Any) -> None:
    """Build the two optional inputs the loader reads submissions from.

    Only the columns 60_* actually consumes are modelled; the real view in
    sql/10_stg/39_deliverable_submission_batch.sql carries more.
    """
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE TABLE demos_app.users (id uuid PRIMARY KEY, username text)")
    conn.execute(
        "INSERT INTO demos_app.users (id, username) VALUES (%s, 'state.uploader'), (%s, 'cms.owner')",
        (UPLOADER, OWNER),
    )
    conn.execute(
        "CREATE TABLE stg.deliverable_submission_batch ("
        " deliverable_id uuid NOT NULL, legacy_dlvrbl_id bigint NOT NULL,"
        " origin_cd text NOT NULL, batch_seq integer NOT NULL,"
        " anchor_fil_doc_id bigint NOT NULL, uploader_user_id uuid,"
        " submitted_at timestamptz NOT NULL)"
    )
    batches = [
        (D_MULTI, 93, "S", i + 1, 9300 + i, UPLOADER, ts) for i, ts in enumerate(BATCH_TS)
    ]
    # A CMS attachment is not a state submission; it must not mint a hop.
    batches.append((D_CMS_ONLY, 94, "C", 1, 9400, UPLOADER, BATCH_TS[0]))
    batches.append((D_GHOST, 97, "S", 1, 9700, GHOST_UPLOADER, BATCH_TS[0]))
    for row in batches:
        conn.execute(
            "INSERT INTO stg.deliverable_submission_batch (deliverable_id, legacy_dlvrbl_id,"
            " origin_cd, batch_seq, anchor_fil_doc_id, uploader_user_id, submitted_at)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s)",
            row,
        )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_stus_hstry ("
        " mdcd_dlvrbl_id bigint NOT NULL, mdcd_dlvrbl_stus_cd integer NOT NULL)"
    )
    # 3 = Submitted. Only D_HSTRY has one, and it has no uploads.
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl_stus_hstry (mdcd_dlvrbl_id, mdcd_dlvrbl_stus_cd)"
        " VALUES (96, 3)"
    )


@pytest.mark.parametrize(("deliverable", "status", "hops"), [
    (d, s, n) for d, (s, n) in STATUSES.items()
])
def test_each_status_gets_its_full_chain(
    pg_db: psycopg.Connection, deliverable: uuid.UUID, status: str, hops: int
) -> None:
    """A deliverable's timeline has one hop per seeded step and ends on its status.

    A chain that stops short, or lands somewhere else, would show the DEMOS UI a
    history that contradicts the status displayed beside it.
    """
    _provision(pg_db)
    got = pg_db.execute(
        "SELECT count(*) FROM demos_app.deliverable_action WHERE deliverable_id = %s",
        (deliverable,),
    ).fetchone()
    assert got is not None
    assert got[0] == hops
    landed = _scalar(
        pg_db,
        "SELECT new_status_id FROM demos_app.deliverable_action WHERE deliverable_id = %s"
        " ORDER BY action_timestamp DESC LIMIT 1",
        (deliverable,),
    )
    assert landed == status


def test_past_due_hop_has_no_user_and_others_do(pg_db: psycopg.Connection) -> None:
    """user_id follows the seeded should_have_user_id, not the action type name.

    'Marked as Past Due' is the one seeded type with should_have_user_id = FALSE
    (DEMOS marks past due on a timer), so require_user_id_for_user_actions rejects
    a user_id there and requires one everywhere else. Reading the flag is what
    makes both cases work without a special case in the loader.
    """
    _provision(pg_db)
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action"
            " WHERE action_type_id = 'Marked as Past Due' AND user_id IS NOT NULL",
        )
        == 0
    )
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action"
            " WHERE action_type_id <> 'Marked as Past Due' AND user_id IS DISTINCT FROM %s",
            (OWNER,),
        )
        == 0
    )


def test_every_hop_is_note_free_and_due_date_frozen(pg_db: psycopg.Connection) -> None:
    """No synthesized hop invents a note or moves a due date.

    PMDA records neither, so writing either would be fabrication; the target's
    require_notes_for_user_actions and block_unpermitted_due_date_changes turn
    that fabrication into a constraints-phase failure.
    """
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.deliverable_action WHERE note IS NOT NULL") == 0
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action WHERE old_due_date <> new_due_date",
        )
        == 0
    )
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action WHERE old_due_date <> %s",
            (DUE,),
        )
        == 0
    )


def test_timestamps_strictly_increase_and_hop_one_is_real(pg_db: psycopg.Connection) -> None:
    """Hop 1 keeps the deliverable's real created_at; the chain never ties or inverts.

    'Created Deliverable Slot' is the one hop whose real timestamp the source
    does record, so it is used rather than a synthetic offset. Equal timestamps
    would make the timeline order undefined.
    """
    _provision(pg_db)
    ts = [
        r[0]
        for r in pg_db.execute(
            "SELECT action_timestamp FROM demos_app.deliverable_action"
            " WHERE deliverable_id = %s ORDER BY action_timestamp",
            (D_ACCEPTED,),
        ).fetchall()
    ]
    assert ts == sorted(ts)
    assert len(set(ts)) == len(ts)
    assert ts[0] == CREATED
    assert ts[-1] == STATUS_TS


def test_hop_one_is_clamped_when_created_at_falls_inside_the_chain(
    pg_db: psycopg.Connection,
) -> None:
    """A deliverable created seconds before its terminal status still orders correctly.

    Regression for the LEAST() on hop 1: taking created_at unconditionally would
    place 'Created Deliverable Slot' after the second hop for a deliverable
    created and finalized within the chain's own window.
    """
    _provision(pg_db)
    ts = [
        r[0]
        for r in pg_db.execute(
            "SELECT action_timestamp FROM demos_app.deliverable_action"
            " WHERE deliverable_id = %s ORDER BY action_timestamp",
            (D_TIGHT,),
        ).fetchall()
    ]
    assert len(ts) == 4
    assert ts == sorted(ts)
    assert len(set(ts)) == 4
    assert ts[0] == STATUS_TS - dt.timedelta(seconds=3)


def test_terminal_timestamp_prefers_the_source_status_date(pg_db: psycopg.Connection) -> None:
    """The terminal hop uses dlvrbl_stus_updt_dt, falling back to updated_at.

    updated_at is the last edit of any column, so preferring it would date the
    status change to an unrelated edit. The source column is a DATE, so it is
    read at Eastern midnight like every other legacy date here.
    """
    _provision(pg_db)
    assert (
        _scalar(
            pg_db,
            "SELECT max(action_timestamp) FROM demos_app.deliverable_action WHERE deliverable_id = %s",
            (D_SUBMITTED,),
        )
        == STATUS_TS
    )
    assert (
        _scalar(
            pg_db,
            "SELECT max(action_timestamp) FROM demos_app.deliverable_action WHERE deliverable_id = %s",
            (D_NO_SRC_DATE,),
        )
        == UPDATED
    )


def test_unseeded_status_is_held_with_a_reason(pg_db: psycopg.Connection) -> None:
    """A status with no seeded chain is recorded, not silently left without a timeline.

    'Deleted' is deliberately unseeded because soft-deleted deliverables are out
    of scope. If one ever reaches the load, the empty timeline must be traceable
    to a named seed gap.
    """
    _provision(pg_db)
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action WHERE deliverable_id = %s",
            (D_UNSEEDED,),
        )
        == 0
    )
    reason = _scalar(
        pg_db,
        "SELECT reason FROM migration._parity_deliverable_action_held WHERE deliverable_id = %s",
        (D_UNSEEDED,),
    )
    assert "no action chain seeded" in reason
    assert "Deleted" in reason
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM migration._parity_deliverable_action_held_report"
            " WHERE deliverable_id = %s",
            (D_UNSEEDED,),
        )
        == 1
    )


def test_completeness_view_is_empty_and_exempts_held(pg_db: psycopg.Connection) -> None:
    """The gating view is empty: every non-held deliverable has a correct chain."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._parity_deliverable_action_completeness") == 0


def test_completeness_view_catches_a_lost_hop(pg_db: psycopg.Connection) -> None:
    """Negative control: deleting one hop turns the gating view non-empty.

    Without this, an empty completeness view proves only that the view runs.
    """
    _provision(pg_db)
    pg_db.execute(
        "DELETE FROM demos_app.deliverable_action WHERE deliverable_id = %s"
        " AND action_type_id = 'Started Review'",
        (D_ACCEPTED,),
    )
    rows = pg_db.execute(
        "SELECT deliverable_id, expected_hops, actual_hops, reason"
        " FROM migration._parity_deliverable_action_completeness"
    ).fetchall()
    assert [(r[0], r[1], r[2]) for r in rows] == [(D_ACCEPTED, 4, 3)]
    assert "hop count" in rows[0][3]


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new and reuses the minted ids."""
    _provision(pg_db)
    before = pg_db.execute(
        "SELECT id, action_timestamp FROM demos_app.deliverable_action ORDER BY id"
    ).fetchall()
    _apply(pg_db, LOADER)
    after = pg_db.execute(
        "SELECT id, action_timestamp FROM demos_app.deliverable_action ORDER BY id"
    ).fetchall()
    assert before == after


def test_validator_rejects_an_unconfigured_hop(pg_db: psycopg.Connection) -> None:
    """Negative control: a hop DEMOS does not configure stops the run.

    The composite FK to deliverable_action_configuration would otherwise fail
    once per row at the constraints phase, long after ~21k rows were derived.
    """
    _provision(pg_db)
    pg_db.execute(
        "UPDATE migration.deliverable_action_chain SET new_status_id = 'Approved'"
        " WHERE terminal_status_id = 'Accepted' AND hop_seq = 4"
    )
    with pytest.raises(Exception, match="not configured transitions"):
        _apply(pg_db, CHECK)


def test_validator_rejects_a_note_requiring_action_type(pg_db: psycopg.Connection) -> None:
    """Negative control: a seeded type that requires a note stops the run.

    The synthesis has no note to write, so such a hop could only load by
    inventing text; require_notes_for_user_actions makes that the alternative.
    """
    _provision(pg_db)
    pg_db.execute(
        "INSERT INTO demos_app.deliverable_action_configuration VALUES"
        " ('Requested Extension', 'Upcoming', 'Upcoming')"
    )
    pg_db.execute(
        "UPDATE migration.deliverable_action_chain SET action_type_id = 'Requested Extension'"
        " WHERE terminal_status_id = 'Upcoming' AND hop_seq = 1"
    )
    with pytest.raises(Exception, match="not MINIMAL-safe"):
        _apply(pg_db, CHECK)


def test_validator_rejects_a_chain_that_misses_its_terminal_status(
    pg_db: psycopg.Connection,
) -> None:
    """Negative control: a chain not reaching its terminal status stops the run."""
    _provision(pg_db)
    pg_db.execute(
        "INSERT INTO demos_app.deliverable_action_configuration VALUES"
        " ('Started Review', 'Submitted', 'Submitted')"
    )
    pg_db.execute(
        "UPDATE migration.deliverable_action_chain SET new_status_id = 'Submitted'"
        " WHERE terminal_status_id = 'Under CMS Review' AND hop_seq = 3"
    )
    with pytest.raises(Exception, match="end on the terminal status"):
        _apply(pg_db, CHECK)


# ---------------------------------------------------------------------------
# Batch mode: the loader reads real submissions from stg.deliverable_submission_batch.
# Every test below provisions the optional inputs; the tests above deliberately
# do not, and so cover the degraded fallback.
# ---------------------------------------------------------------------------


def test_each_upload_session_becomes_its_own_submission(pg_db: psycopg.Connection) -> None:
    """k state upload sessions produce k submissions, each at its real clock reading.

    The seeded chain has exactly one 'Submitted Deliverable' hop. Keeping that
    literally would collapse a deliverable that was submitted, rejected and
    resubmitted into a single event and leave later documents with no action to
    attach to.
    """
    _provision(pg_db, with_batches=True)
    got = pg_db.execute(
        "SELECT action_timestamp FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'"
        " ORDER BY action_timestamp",
        (D_MULTI,),
    ).fetchall()
    assert [r[0] for r in got] == BATCH_TS


def test_repeat_submissions_use_the_submitted_self_transition(
    pg_db: psycopg.Connection,
) -> None:
    """The first submission leaves 'Upcoming'; later ones are Submitted -> Submitted.

    'Submitted Deliverable' is only configured from 'Upcoming', so a second hop
    copying that old_status_id would claim the deliverable went back to Upcoming.
    The self-transition is the legal way to say "submitted again".
    """
    _provision(pg_db, with_batches=True)
    got = pg_db.execute(
        "SELECT old_status_id, new_status_id FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'"
        " ORDER BY action_timestamp",
        (D_MULTI,),
    ).fetchall()
    assert got == [("Upcoming", "Submitted"), ("Submitted", "Submitted"), ("Submitted", "Submitted")]


def test_submission_actor_is_the_uploader_not_the_cms_owner(
    pg_db: psycopg.Connection,
) -> None:
    """A submission is attributed to whoever uploaded the file.

    Every other hop is synthesized and falls back to the deliverable's CMS
    owner, but the uploader is recorded fact and is the whole reason for
    preferring mdcd_dlvrbl_fil_doc over the status log.
    """
    _provision(pg_db, with_batches=True)
    actors = {
        r[0]
        for r in pg_db.execute(
            "SELECT DISTINCT user_id FROM demos_app.deliverable_action"
            " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
            (D_MULTI,),
        ).fetchall()
    }
    assert actors == {UPLOADER}
    others = {
        r[0]
        for r in pg_db.execute(
            "SELECT DISTINCT user_id FROM demos_app.deliverable_action"
            " WHERE deliverable_id = %s AND action_type_id <> 'Submitted Deliverable'",
            (D_MULTI,),
        ).fetchall()
    }
    assert others == {OWNER}


def test_unresolvable_uploader_falls_back_to_the_cms_owner(
    pg_db: psycopg.Connection,
) -> None:
    """An uploader with no migrated user still yields a loadable submission.

    require_user_id_for_user_actions rejects a NULL user_id on this type, so the
    row would otherwise fail the constraints phase rather than degrade.
    """
    _provision(pg_db, with_batches=True)
    got = pg_db.execute(
        "SELECT user_id FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_GHOST,),
    ).fetchall()
    assert [r[0] for r in got] == [OWNER]


def test_a_cms_attachment_does_not_mint_a_submission(pg_db: psycopg.Connection) -> None:
    """origin_cd = 'C' is a CMS-side file, not a state submission.

    DEMOS enforces no_submitted_deliverable_cms_files, so treating a CMS
    attachment as evidence of a submission would assert something the source
    contradicts.
    """
    _provision(pg_db, with_batches=True)
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM demos_app.deliverable_action"
            " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
            (D_CMS_ONLY,),
        )
        == 0
    )


def test_no_evidence_suppresses_the_submission_hop(pg_db: psycopg.Connection) -> None:
    """A deliverable with neither an upload nor a Submitted event gets no submission.

    Its terminal status sits past 'Submitted' in the chain, which is exactly the
    reasoning that used to fabricate one. The remaining hops still land on the
    deliverable's own status.
    """
    _provision(pg_db, with_batches=True)
    got = pg_db.execute(
        "SELECT action_type_id FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s ORDER BY action_timestamp",
        (D_BARE,),
    ).fetchall()
    assert [r[0] for r in got] == [
        "Created Deliverable Slot",
        "Started Review",
        "Accepted Deliverable",
    ]


def test_a_real_submitted_event_still_yields_one_synthetic_hop(
    pg_db: psycopg.Connection,
) -> None:
    """No surviving upload but a real Submitted status event keeps one hop.

    The event proves the submission happened; it just carries no usable clock
    reading or actor, so the hop stays synthetic rather than being dropped.
    """
    _provision(pg_db, with_batches=True)
    got = pg_db.execute(
        "SELECT action_timestamp, user_id FROM demos_app.deliverable_action"
        " WHERE deliverable_id = %s AND action_type_id = 'Submitted Deliverable'",
        (D_HSTRY,),
    ).fetchall()
    assert len(got) == 1
    assert got[0][0] not in BATCH_TS
    assert CREATED < got[0][0] < STATUS_TS
    assert got[0][1] == OWNER
    assert (
        _scalar(
            pg_db,
            "SELECT source FROM migration._deliverable_submission_event WHERE deliverable_id = %s",
            (D_HSTRY,),
        )
        == "status_event"
    )


def test_timestamps_strictly_increase_across_expanded_submissions(
    pg_db: psycopg.Connection,
) -> None:
    """Real submission timestamps are spliced in without breaking chain ordering.

    The synthetic hops are placed relative to the terminal timestamp, so real
    readings dropped between them are the one thing that can invert the order.
    """
    _provision(pg_db, with_batches=True)
    for did in (D_MULTI, D_GHOST, D_BARE, D_CMS_ONLY, D_HSTRY):
        ts = [
            r[0]
            for r in pg_db.execute(
                "SELECT action_timestamp FROM demos_app.deliverable_action"
                " WHERE deliverable_id = %s ORDER BY action_timestamp",
                (did,),
            ).fetchall()
        ]
        assert ts == sorted(ts), did
        assert len(set(ts)) == len(ts), did


def test_completeness_view_is_empty_in_batch_mode(pg_db: psycopg.Connection) -> None:
    """The gating view accounts for expanded and suppressed submissions.

    Its expectation is no longer "one action per seeded hop": it is the seeded
    non-submission hops plus however many submissions the evidence resolved to.
    """
    _provision(pg_db, with_batches=True)
    rows = pg_db.execute(
        "SELECT deliverable_id, expected_hops, actual_hops, reason"
        " FROM migration._parity_deliverable_action_completeness"
    ).fetchall()
    assert rows == []


def test_completeness_view_catches_a_lost_submission_in_batch_mode(
    pg_db: psycopg.Connection,
) -> None:
    """Negative control: dropping one of three submissions turns the view non-empty."""
    _provision(pg_db, with_batches=True)
    pg_db.execute(
        "DELETE FROM demos_app.deliverable_action WHERE deliverable_id = %s"
        " AND action_type_id = 'Submitted Deliverable' AND action_timestamp = %s",
        (D_MULTI, BATCH_TS[2]),
    )
    rows = pg_db.execute(
        "SELECT deliverable_id, expected_hops, actual_hops FROM"
        " migration._parity_deliverable_action_completeness"
    ).fetchall()
    assert rows == [(D_MULTI, 6, 5)]


def test_loader_is_idempotent_in_batch_mode(pg_db: psycopg.Connection) -> None:
    """Re-applying with batches present reuses every minted id and adds nothing.

    The expanded hops take synthetic hop_seq values, so a second apply that
    numbered them differently would duplicate every repeat submission.
    """
    _provision(pg_db, with_batches=True)
    before = pg_db.execute(
        "SELECT id, deliverable_id, action_timestamp, action_type_id, user_id"
        " FROM demos_app.deliverable_action ORDER BY id"
    ).fetchall()
    _apply(pg_db, LOADER)
    after = pg_db.execute(
        "SELECT id, deliverable_id, action_timestamp, action_type_id, user_id"
        " FROM demos_app.deliverable_action ORDER BY id"
    ).fetchall()
    assert before == after
