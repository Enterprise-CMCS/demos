"""Parity harness for ``sql/99_parity/64_deliverable_submission_batch.sql``.

Unlike the loader tests, this one applies the *real* stg batch views
(``sql/10_stg/39_deliverable_submission_batch.sql``) on top of a hand-built
``mysql_raw``, so the parity view is checking the same SQL that runs in the
pipeline rather than a stub.

The point of a parity check is that it goes RED when the thing it watches
breaks, so every test past the happy path deliberately regresses the stg view
(or its inputs) and asserts the specific reason the check is supposed to emit.
A check that only ever gets exercised against correct data proves nothing.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
STG = ROOT / "sql" / "10_stg" / "39_deliverable_submission_batch.sql"
PARITY = ROOT / "sql" / "99_parity" / "64_deliverable_submission_batch.sql"

D1 = uuid.UUID("11111111-1111-4111-8111-111111111111")
D2 = uuid.UUID("22222222-2222-4222-8222-222222222222")
U10 = uuid.UUID("aaaaaaaa-0000-4000-8000-00000000000a")
U11 = uuid.UUID("aaaaaaaa-0000-4000-8000-00000000000b")
U12 = uuid.UUID("aaaaaaaa-0000-4000-8000-00000000000c")

# The column list stg.deliverable_file_batch exposes. CREATE OR REPLACE VIEW
# demands an identical shape, so every injected regression below reuses it.
FILE_VIEW_COLUMNS = """
    f.mdcd_dlvrbl_fil_doc_id AS legacy_fil_doc_id,
    f.mdcd_dlvrbl_id         AS legacy_dlvrbl_id,
    dm.new_uuid              AS deliverable_id,
    f.user_id                AS legacy_uploader_id,
    um.new_uuid              AS uploader_user_id,
    f.cmt_orgn_cd            AS origin_cd,
    f.upld_aftr_acptd_ind    AS after_accepted_ind,
    f.creatd_dt::timestamptz AS uploaded_at,
"""

FILE_VIEW_FROM = """
    FROM mysql_raw.mdcd_dlvrbl_fil_doc f
    JOIN stg._valid_dlvrbl_ids v ON v.dlvrbl_id = f.mdcd_dlvrbl_id
    JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = f.mdcd_dlvrbl_id
    LEFT JOIN migration._id_map_users um ON um.legacy_int_id = f.user_id
    WHERE f.dltd_ind = 0 AND f.creatd_dt IS NOT NULL
"""

# (fil_doc_id, dlvrbl_id, user_id, origin, minutes_offset)
#
# Deliverable 100 state uploads form three sessions: files 1+2 together, then
# file 3 after a 3-hour gap, then file 4 from a different uploader immediately
# after. Its CMS attachment (file 5) batches independently. Deliverable 200 is a
# single lone upload.
FILES = [
    (1, 100, 10, "S", 0),
    (2, 100, 10, "S", 10),
    (3, 100, 10, "S", 190),
    (4, 100, 11, "S", 195),
    (5, 100, 12, "C", 60),
    (6, 200, 10, "S", 0),
]

BASE_TS = "2020-03-02 09:00:00"


def _provision(conn: Any) -> None:
    """Build the minimum mysql_raw + id maps the real stg view reads."""
    conn.execute("DROP SCHEMA IF EXISTS migration, mysql_raw, stg CASCADE")
    for schema in ("migration", "mysql_raw", "stg"):
        conn.execute(f"CREATE SCHEMA {schema}")

    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_fil_doc ("
        " mdcd_dlvrbl_fil_doc_id bigint PRIMARY KEY, mdcd_dlvrbl_id bigint NOT NULL,"
        " user_id bigint, cmt_orgn_cd text NOT NULL, upld_aftr_acptd_ind smallint,"
        " creatd_dt timestamp, dltd_ind smallint NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl_stus_hstry ("
        " mdcd_dlvrbl_stus_hstry_id bigint PRIMARY KEY, mdcd_dlvrbl_id bigint NOT NULL,"
        " mdcd_dlvrbl_stus_cd integer NOT NULL, creatd_dt timestamp,"
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

    conn.execute("INSERT INTO stg._valid_dlvrbl_ids VALUES (100), (200)")
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_dlvrbl VALUES (100, %s), (200, %s)", (D1, D2)
    )
    conn.execute(
        "INSERT INTO migration._id_map_users VALUES (10, %s), (11, %s), (12, %s)",
        (U10, U11, U12),
    )

    for fid, did, uid, origin, offset in FILES:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_dlvrbl_fil_doc VALUES "
            "(%s, %s, %s, %s, 0, %s::timestamp + make_interval(mins => %s), 0)",
            (fid, did, uid, origin, BASE_TS, offset),
        )

    # A Submitted (code 3) event 5 minutes after deliverable 100's first session
    # ends, so exactly one batch is corroborated.
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl_stus_hstry VALUES "
        "(900, 100, 3, %s::timestamp + make_interval(mins => 15), 10, 0)",
        (BASE_TS,),
    )


def _apply_parity(conn: Any) -> None:
    """conn is Any because the SQL is read at runtime, not a LiteralString."""
    conn.execute(PARITY.read_text(encoding="utf-8"))


def _apply(conn: Any) -> None:
    conn.execute(STG.read_text(encoding="utf-8"))
    _apply_parity(conn)


def _reasons(conn: Any) -> list[str]:
    rows = conn.execute(
        "SELECT DISTINCT reason FROM migration._parity_deliverable_submission_batch"
    ).fetchall()
    return sorted(r[0] for r in rows)


def _break_file_view(conn: Any, batch_seq_expr: str) -> None:
    """Swap in a file view whose only difference is how batch_seq is computed."""
    conn.execute(
        "CREATE OR REPLACE VIEW stg.deliverable_file_batch AS SELECT "
        + FILE_VIEW_COLUMNS
        + batch_seq_expr
        + " AS batch_seq"
        + FILE_VIEW_FROM
    )


def test_stg_and_parity_apply_twice(pg_db: psycopg.Connection) -> None:
    """Both files apply, and re-apply, cleanly."""
    _provision(pg_db)
    _apply(pg_db)
    _apply(pg_db)

    row = pg_db.execute(
        "SELECT count(*) FROM stg.deliverable_submission_batch"
    ).fetchone()
    assert row is not None
    # 100/S splits three ways, 100/C stands alone, 200/S is a single upload.
    assert row[0] == 5


def test_parity_empty_on_well_formed_data(pg_db: psycopg.Connection) -> None:
    """The real stg view against sane source data must raise nothing."""
    _provision(pg_db)
    _apply(pg_db)
    assert _reasons(pg_db) == []


def test_parity_view_absent_without_stg(pg_db: psycopg.Connection) -> None:
    """The conditional-DDL guard makes the file a no-op when stg is missing.

    This is what lets the app-layers idempotency harness, which stands up
    demos_app without the stg layer, apply 99_parity wholesale.
    """
    pg_db.execute("DROP SCHEMA IF EXISTS migration, mysql_raw, stg CASCADE")
    pg_db.execute("CREATE SCHEMA migration")
    _apply_parity(pg_db)

    row = pg_db.execute(
        "SELECT to_regclass('migration._parity_deliverable_submission_batch') IS NULL"
    ).fetchone()
    assert row is not None
    assert row[0] is True


def test_detects_file_dropped_by_id_map(pg_db: psycopg.Connection) -> None:
    """A missing id-map row silently drops files through the view's INNER JOIN.

    Only a recompute from mysql_raw can see this: the aggregate and the per-file
    view both derive from the same join, so they agree with each other while
    both are wrong.
    """
    _provision(pg_db)
    _apply(pg_db)
    pg_db.execute("DELETE FROM migration._id_map_mdcd_dlvrbl WHERE legacy_int_id = 200")

    assert "file missing from the batch view" in _reasons(pg_db)


def test_detects_file_in_two_batches(pg_db: psycopg.Connection) -> None:
    """A join that fans out must not be absorbed silently."""
    _provision(pg_db)
    _apply(pg_db)
    pg_db.execute(
        "CREATE OR REPLACE VIEW stg.deliverable_file_batch AS SELECT "
        + FILE_VIEW_COLUMNS
        + " 1::int AS batch_seq"
        + FILE_VIEW_FROM
        + " AND f.mdcd_dlvrbl_id = 200"
        " UNION ALL SELECT " + FILE_VIEW_COLUMNS + " 2::int AS batch_seq" + FILE_VIEW_FROM
        + " AND f.mdcd_dlvrbl_id = 200"
    )

    assert "file assigned to more than one batch" in _reasons(pg_db)


def test_detects_collapsed_batches(pg_db: psycopg.Connection) -> None:
    """Losing the session boundary merges distinct submissions into one."""
    _provision(pg_db)
    _apply(pg_db)
    _break_file_view(pg_db, " 1::int")

    reasons = _reasons(pg_db)
    assert "gap inside a batch exceeds the session window" in reasons
    assert "batch spans more than one uploader" in reasons


def test_detects_over_split_batches(pg_db: psycopg.Connection) -> None:
    """Splitting on every file is the inverse failure and is otherwise invisible.

    Nothing about the output looks malformed: the sequence is still contiguous
    and every batch is internally consistent. Only the boundary justification
    rule catches it.
    """
    _provision(pg_db)
    _apply(pg_db)
    _break_file_view(
        pg_db,
        " row_number() OVER (PARTITION BY f.mdcd_dlvrbl_id, f.cmt_orgn_cd"
        " ORDER BY f.creatd_dt, f.mdcd_dlvrbl_fil_doc_id)::int",
    )

    assert "batch boundary is not justified by an uploader change or a window gap" in _reasons(
        pg_db
    )


def test_detects_batch_seq_not_starting_at_one(pg_db: psycopg.Connection) -> None:
    """Off-by-one numbering breaks the anchor the document loader joins on."""
    _provision(pg_db)
    _apply(pg_db)
    _break_file_view(
        pg_db,
        " (1 + dense_rank() OVER (PARTITION BY f.mdcd_dlvrbl_id, f.cmt_orgn_cd"
        " ORDER BY f.creatd_dt))::int",
    )

    assert "batch_seq does not start at 1" in _reasons(pg_db)


def test_detects_non_contiguous_batch_seq(pg_db: psycopg.Connection) -> None:
    """Gapped numbering means a session was computed and then lost."""
    _provision(pg_db)
    _apply(pg_db)
    _break_file_view(
        pg_db,
        " (2 * dense_rank() OVER (PARTITION BY f.mdcd_dlvrbl_id, f.cmt_orgn_cd"
        " ORDER BY f.creatd_dt) - 1)::int",
    )

    assert "batch_seq is not contiguous" in _reasons(pg_db)


def test_detects_status_event_claimed_twice(pg_db: psycopg.Connection) -> None:
    """The view promises a 1:1 mutual-nearest match; dropping either rank breaks it.

    This regresses the aggregate directly, reproducing what removing the
    ``event_rank = 1`` guard from 39_*.sql would do: one Submitted event
    corroborating every nearby batch at once.
    """
    _provision(pg_db)
    _apply(pg_db)
    pg_db.execute(
        "CREATE OR REPLACE VIEW stg.deliverable_submission_batch AS "
        "WITH agg AS ("
        "  SELECT fb.legacy_dlvrbl_id, fb.deliverable_id, fb.origin_cd, fb.batch_seq,"
        "         fb.legacy_uploader_id, fb.uploader_user_id,"
        "         (array_agg(fb.legacy_fil_doc_id ORDER BY fb.uploaded_at))[1] AS anchor_fil_doc_id,"
        "         count(*)::int AS file_count, min(fb.uploaded_at) AS batch_start_at,"
        "         max(fb.uploaded_at) AS batch_end_at,"
        "         max(fb.after_accepted_ind) AS after_accepted_ind"
        "  FROM stg.deliverable_file_batch fb"
        "  GROUP BY 1,2,3,4,5,6)"
        "SELECT a.legacy_dlvrbl_id, a.deliverable_id, a.origin_cd, a.batch_seq,"
        "       a.anchor_fil_doc_id, a.legacy_uploader_id, a.uploader_user_id,"
        "       a.file_count, a.batch_start_at, a.batch_end_at, a.after_accepted_ind,"
        "       h.mdcd_dlvrbl_stus_hstry_id AS corroborating_status_event_id,"
        "       h.creatd_dt::timestamptz    AS corroborating_status_event_at,"
        "       h.creatd_user_id            AS corroborating_status_event_user_id,"
        "       COALESCE(h.creatd_dt::timestamptz, a.batch_end_at) AS submitted_at "
        "FROM agg a "
        "LEFT JOIN mysql_raw.mdcd_dlvrbl_stus_hstry h "
        "  ON h.mdcd_dlvrbl_id = a.legacy_dlvrbl_id AND h.mdcd_dlvrbl_stus_cd = 3"
        " AND a.origin_cd = 'S'"
    )

    assert "status event claimed by more than one batch" in _reasons(pg_db)
