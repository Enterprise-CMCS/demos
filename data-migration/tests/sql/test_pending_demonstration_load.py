"""Live-PG harness for the pending-demonstration loader (workflow 7 reversal).

Exercises the real pending chain -- fold classifier (sql/10_stg/23), pending
resolved view (sql/10_stg/24), loader (sql/20_app/31), and parity views
(sql/99_parity/04) -- against a hand-built, FK-free ``mysql_raw`` skeleton on a
throwaway Postgres (``pg_db``); self-skips without ``PG_TEST_DSN``.

Asserts the 2026-07-10 SME reversal:
  * an ORPHAN pending demo (project number, no approved counterpart) loads as
    its own 'Under Review' demonstration, chip_id NULL;
  * a pending demo that FOLDS into an approved counterpart (shared project
    number) is classified 'folded' and does NOT get its own row;
  * a pending demo with NO project number is held back ('held_no_project') and
    logged as pending_only_deferred / no_project_number in check 4;
  * among orphans, a duplicate medicaid_id loads one deterministic winner and
    holds the loser back (RED-4), and a state absent from state_region is held;
    both are logged (non-gating) in _parity_pending_demonstration_held;
  * no pending demo that must NOT load leaks into the target (leaked == 0);
  * re-applying the loader is a no-op (idempotent).
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
FOLD = ROOT / "sql" / "10_stg" / "23_pendg_demo_fold.sql"
RESOLVED = ROOT / "sql" / "10_stg" / "24_pending_demonstration_resolved.sql"
LOADER = ROOT / "sql" / "20_app" / "31_pending_demonstration.sql"
PARITY = ROOT / "sql" / "99_parity" / "04_pending_approved.sql"

# Pending demos: (legacy_id, mdcd_demo_num, state, disposition intent)
P_ORPHAN = 1001     # 11-W-00801/6, LA -> orphan_loadable, LOADS (Under Review)
P_NOPROJ = 1002     # NULL num, LA -> held_no_project (pending_only_deferred)
P_FOLD = 1003       # 11-W-00900/6 == approved A_APPROVED -> folded, NOT loaded
P_DUP_WIN = 1004    # 11-W-00810/6, LA (region 6 match) -> dup WINNER, loads
P_DUP_LOSE = 1005   # 11-W-00810/6, VT (region 1, suffix 6 != 1) -> dup loser, held
P_BADSTATE = 1006   # 11-W-00820/6, ZZ (not in state_region) -> held (state)

A_APPROVED = 5001   # approved 11-W-00900/6, LA -> the fold target for P_FOLD

# (legacy_id, num, state, chip_div)
PENDG = [
    (P_ORPHAN, "11-W-00801/6", "LA"),
    (P_NOPROJ, None, "LA"),
    (P_FOLD, "11-W-00900/6", "LA"),
    (P_DUP_WIN, "11-W-00810/6", "LA"),
    (P_DUP_LOSE, "11-W-00810/6", "VT"),
    (P_BADSTATE, "11-W-00820/6", "ZZ"),
]
STATE_REGION = [("LA", 6), ("VT", 1)]


def _u(legacy: int) -> uuid.UUID:
    return uuid.UUID(int=legacy)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    create_mysql_raw_skeleton(conn)  # all mysql_raw source tables, empty
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    for legacy, num, state in PENDG:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_pendg_demo (mdcd_pendg_demo_id, mdcd_demo_num, "
            "mdcd_demo_name, mdcd_demo_desc, geo_ansi_state_cd, mdcd_chip_div_cd, "
            "state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, creatd_dt, updtd_dt, dltd_ind) "
            "VALUES (%s,%s,%s,'',%s,3,%s,%s,%s,NULL,0)",
            (legacy, num, f"Pending {legacy}", state, "2020-01-01", "2025-12-31",
             "2020-01-01 00:00:00+00"),
        )
    # The approved counterpart P_FOLD folds into (present + PMDA-valid + mapped).
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_id, mdcd_demo_num, mdcd_demo_name, "
        "mdcd_demo_desc, state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, mdcd_demo_stus_cd, "
        "geo_ansi_state_cd, mdcd_chip_div_cd, creatd_dt, dltd_ind) "
        "VALUES (%s,%s,'Approved 900','',%s,%s,2,'LA',3,%s,0)",
        (A_APPROVED, "11-W-00900/6", "2020-01-01", "2025-12-31", "2020-01-01 00:00:00+00"),
    )
    # An original application row (type 1) for the orphan -> phase-by-date 'Review'.
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo_aplctn (mdcd_demo_aplctn_id, mdcd_pendg_demo_id, "
        "mdcd_demo_id, mdcd_demo_aplctn_type_cd, phase_4_strt_dt, dltd_ind) "
        "VALUES (1, %s, 0, 1, %s, 0)",
        (P_ORPHAN, "2021-01-01"),
    )

    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_sdg_division (legacy_int_cd bigint, demos_text_id text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_sdg_division (legacy_int_cd, demos_text_id) VALUES (3,'DSG')"
    )

    # migration + stg plumbing the fold/resolved views read.
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_pendg_demo (legacy_int_id bigint, new_uuid uuid)"
    )
    for legacy, _num, _state in PENDG:
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_pendg_demo (legacy_int_id, new_uuid) VALUES (%s,%s)",
            (legacy, _u(legacy)),
        )
    conn.execute("CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)")
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) VALUES (%s,%s)",
        (A_APPROVED, _u(A_APPROVED)),
    )
    conn.execute("CREATE TABLE stg._valid_pendg_demo_ids (demo_id bigint)")
    for legacy, _num, _state in PENDG:
        conn.execute("INSERT INTO stg._valid_pendg_demo_ids (demo_id) VALUES (%s)", (legacy,))
    conn.execute("CREATE TABLE stg._valid_demo_ids (demo_id bigint)")
    conn.execute("INSERT INTO stg._valid_demo_ids (demo_id) VALUES (%s)", (A_APPROVED,))
    conn.execute("CREATE TABLE migration.state_region (state_id text, region smallint)")
    for state, region in STATE_REGION:
        conn.execute(
            "INSERT INTO migration.state_region (state_id, region) VALUES (%s,%s)", (state, region)
        )

    _apply(conn, FOLD)      # stg._pendg_demo_fold
    _apply(conn, RESOLVED)  # stg.pending_demonstration_resolved

    conn.execute(
        "CREATE TABLE demos_app.application "
        "(id uuid PRIMARY KEY, application_type_id text NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE demos_app.demonstration ("
        " id uuid PRIMARY KEY, application_type_id text NOT NULL, name text, "
        " description text, effective_date timestamptz, expiration_date timestamptz, "
        " signature_level_id text, sdg_division_id text, status_id text, "
        " current_phase_id text, state_id text, medicaid_id text, chip_id text, "
        " created_at timestamptz, updated_at timestamptz, status_updated_at timestamptz, "
        " CONSTRAINT demonstration_medicaid_id_key UNIQUE (medicaid_id))"
    )
    conn.execute("CREATE SEQUENCE demos_app.medicaid_id_number_seq START 1000")

    _apply(conn, LOADER)  # pending demonstration load
    _apply(conn, PARITY)  # _parity_pending_approved + _parity_pending_demonstration_held


def _loaded(conn: Any, legacy: int) -> bool:
    return (
        conn.execute(
            "SELECT 1 FROM demos_app.demonstration WHERE id = %s", (_u(legacy),)
        ).fetchone()
        is not None
    )


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def test_orphan_with_project_loads_under_review(pg_db: psycopg.Connection) -> None:
    """An orphan pending demo loads as its own 'Under Review' demonstration, chip NULL."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT status_id, current_phase_id, chip_id, medicaid_id "
        "FROM demos_app.demonstration WHERE id = %s",
        (_u(P_ORPHAN),),
    ).fetchone()
    assert row is not None
    assert row[0] == "Under Review"
    assert row[1] == "Review"  # phase-by-date from the type-1 application row
    assert row[2] is None      # chip_id never minted for pending
    assert row[3] == "11-W-00801/6"


def test_no_project_number_held_and_deferred(pg_db: psycopg.Connection) -> None:
    """A pending demo with no project number is held back and logged deferred."""
    _provision(pg_db)
    assert not _loaded(pg_db, P_NOPROJ)
    deferred = pg_db.execute(
        "SELECT legacy_pendg_demo_id, reason FROM migration._parity_pending_approved "
        "WHERE category = 'pending_only_deferred'"
    ).fetchall()
    assert (P_NOPROJ, "no_project_number") in [(int(r[0]), r[1]) for r in deferred]


def test_folded_pending_not_loaded(pg_db: psycopg.Connection) -> None:
    """A pending demo sharing a project number with a valid approved demo folds in."""
    _provision(pg_db)
    disposition = pg_db.execute(
        "SELECT disposition FROM stg._pendg_demo_fold WHERE legacy_pendg_demo_id = %s",
        (P_FOLD,),
    ).fetchone()
    assert disposition is not None
    assert disposition[0] == "folded"
    assert not _loaded(pg_db, P_FOLD)  # its own pending UUID never loads


def test_duplicate_medicaid_winner_and_state_holdbacks(pg_db: psycopg.Connection) -> None:
    """Dup medicaid loads one winner; the loser and the bad-state row are held + logged."""
    _provision(pg_db)
    assert _loaded(pg_db, P_DUP_WIN)       # region-6 match wins
    assert not _loaded(pg_db, P_DUP_LOSE)  # region-1 state, held
    assert not _loaded(pg_db, P_BADSTATE)  # state not in state_region
    held = {
        (int(r[0]), r[1])
        for r in pg_db.execute(
            "SELECT legacy_pendg_demo_id, reason FROM migration._parity_pending_demonstration_held"
        ).fetchall()
    }
    assert (P_DUP_LOSE, "duplicate_medicaid_id") in held
    assert (P_BADSTATE, "state_unresolvable") in held


def test_no_pending_leak(pg_db: psycopg.Connection) -> None:
    """No pending demo that must not load leaks into the target (HARD gate)."""
    _provision(pg_db)
    leaked = _scalar(
        pg_db,
        "SELECT count(*) FROM migration._parity_pending_approved WHERE category = 'leaked'",
    )
    assert leaked == 0


def test_exactly_two_orphans_load(pg_db: psycopg.Connection) -> None:
    """Only the orphan and the dup-winner load; anchors match one-per-demo."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration") == 2
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.application") == 2


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    assert before == after == 2
