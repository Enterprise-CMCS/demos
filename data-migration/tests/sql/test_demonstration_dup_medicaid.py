"""Live-PG harness for the demonstration loader's duplicate-medicaid_id hold-back.

RED-4: the DEMOS ``demonstration_medicaid_id_key`` UNIQUE constraint rejects two
demonstrations that carry the same legacy ``mdcd_demo_num``. The source has such
a defect (LA #2506 and TX #2513 both numbered 11-W-00232/6), and the loader used
to hard-fail the whole build (ERROR 23505). It now mirrors the Approved-held /
amendment hold-back pattern: for a shared medicaid_id it loads exactly one
deterministic winner and holds the rest back, logging them to
``migration._parity_demonstration_held_dup_medicaid_id`` for SME review.

Winner rule (SME-ratified): prefer the row whose medicaid_id region suffix (the
``/N``; region 10 is written as trailing ``0``) matches its state's CMS region
(``migration.state_region``), then the lowest legacy ``mdcd_demo_id``.

Applies the real chain (resolved view 22, loader 30, parity views 11 + 14)
against a hand-built, FK-free schema on a throwaway Postgres (``pg_db``); self-
skips without ``PG_TEST_DSN``.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
RESOLVED = ROOT / "sql" / "10_stg" / "22_demonstration_resolved.sql"
LOADER = ROOT / "sql" / "20_app" / "30_demonstration.sql"
COMPLETENESS = ROOT / "sql" / "99_parity" / "11_demonstration_completeness.sql"
DUP_HELD = ROOT / "sql" / "99_parity" / "14_demonstration_held_dup_medicaid.sql"

# (legacy_id, num, state, medicaid group intent)
# Pair A: same CMS region (both /6, both region 6) -> tie -> lowest id wins.
LA_WIN = 2506   # Louisiana, 11-W-00232/6, region 6 match, lowest id -> WINNER
TX_LOSE = 2513  # Texas,     11-W-00232/6, region 6 match, higher id -> loser
# Pair B: cross region -> region match beats lowest id.
VT_LOSE = 100   # Vermont,   11-W-00500/6, suffix 6 != region 1 -> loser
LA_WIN2 = 200   # Louisiana, 11-W-00500/6, suffix 6 == region 6 -> WINNER (higher id)
# Singleton control: no duplicate -> loads untouched.
MA_SOLO = 300   # Massachusetts, 11-W-00777/1, region 1 match

DEMOS = [
    (LA_WIN, "11-W-00232/6", "LA"),
    (TX_LOSE, "11-W-00232/6", "TX"),
    (VT_LOSE, "11-W-00500/6", "VT"),
    (LA_WIN2, "11-W-00500/6", "LA"),
    (MA_SOLO, "11-W-00777/1", "MA"),
]
STATE_REGION = [("LA", 6), ("TX", 6), ("VT", 1), ("MA", 1)]


def _u(legacy: int) -> uuid.UUID:
    return uuid.UUID(int=legacy)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    create_mysql_raw_skeleton(conn)  # drops+recreates mysql_raw with all source tables
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    for legacy, num, state in DEMOS:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_id, mdcd_demo_num, "
            "mdcd_scndry_demo_num, mdcd_demo_name, mdcd_demo_desc, "
            "state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, mdcd_demo_stus_cd, "
            "geo_ansi_state_cd, mdcd_chip_div_cd, creatd_dt, updtd_dt, aprvl_dt, dltd_ind) "
            "VALUES (%s,%s,NULL,%s,'',%s,%s,6,%s,3,%s,NULL,NULL,0)",
            (legacy, num, f"Demo {legacy}", "2020-01-01", "2025-12-31",
             state, "2020-01-01 00:00:00+00"),
        )

    # crosswalks (minimal; the real DDL+CSV chain is exercised elsewhere)
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_demo_status (legacy_int_cd bigint, demos_text_id text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_demo_status (legacy_int_cd, demos_text_id) "
        "VALUES (6,'Expired'),(2,'Approved'),(3,'Under Review')"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_sdg_division (legacy_int_cd bigint, demos_text_id text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_sdg_division (legacy_int_cd, demos_text_id) VALUES (3,'DSG')"
    )

    # migration plumbing
    conn.execute("CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)")
    for legacy, _num, _state in DEMOS:
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) VALUES (%s,%s)",
            (legacy, _u(legacy)),
        )
    conn.execute("CREATE TABLE stg._valid_demo_ids (demo_id bigint)")
    for legacy, _num, _state in DEMOS:
        conn.execute("INSERT INTO stg._valid_demo_ids (demo_id) VALUES (%s)", (legacy,))
    conn.execute("CREATE TABLE migration.state_region (state_id text, region smallint)")
    for state, region in STATE_REGION:
        conn.execute(
            "INSERT INTO migration.state_region (state_id, region) VALUES (%s,%s)", (state, region)
        )

    _apply(conn, RESOLVED)  # stg.demonstration_resolved view

    # target (demos_app), FK-free but with the UNIQUE that triggers RED-4
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
    conn.execute("CREATE SEQUENCE demos_app.chip_id_number_seq START 1000")
    conn.execute("CREATE SEQUENCE demos_app.medicaid_id_number_seq START 1000")

    _apply(conn, LOADER)         # the load (RED-4: must not hard-fail on the dup)
    _apply(conn, COMPLETENESS)   # parity check 8 view
    _apply(conn, DUP_HELD)       # parity dup-held view


def _loaded(conn: Any, legacy: int) -> bool:
    row = conn.execute(
        "SELECT 1 FROM demos_app.demonstration WHERE id = %s", (_u(legacy),)
    ).fetchone()
    return row is not None


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def test_dup_medicaid_does_not_hard_fail_and_loads_one_per_group(pg_db: psycopg.Connection) -> None:
    """RED-4: the collision no longer raises 23505; one demo loads per medicaid_id."""
    _provision(pg_db)
    # 3 distinct medicaid_ids -> exactly 3 demonstrations (+ IS-A anchors).
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration") == 3
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.application") == 3


def test_same_region_tie_breaks_to_lowest_legacy_id(pg_db: psycopg.Connection) -> None:
    """Both /6 in region 6 -> lowest legacy id (LA #2506) wins; TX #2513 held."""
    _provision(pg_db)
    assert _loaded(pg_db, LA_WIN)
    assert not _loaded(pg_db, TX_LOSE)


def test_region_match_beats_lowest_legacy_id(pg_db: psycopg.Connection) -> None:
    """/6 matches LA (region 6) but not VT (region 1) -> LA #200 wins despite higher id."""
    _provision(pg_db)
    assert _loaded(pg_db, LA_WIN2)
    assert not _loaded(pg_db, VT_LOSE)


def test_singleton_demo_is_unaffected(pg_db: psycopg.Connection) -> None:
    """A demo with no medicaid_id collision loads normally."""
    _provision(pg_db)
    assert _loaded(pg_db, MA_SOLO)


def test_held_losers_are_logged_with_kept_winner(pg_db: psycopg.Connection) -> None:
    """Each held loser appears in the parity view with its winner's legacy id."""
    _provision(pg_db)
    held = {
        r[0]: r[1]
        for r in pg_db.execute(
            "SELECT demonstration_id, kept_legacy_demo_id "
            "FROM migration._parity_demonstration_held_dup_medicaid_id"
        ).fetchall()
    }
    assert held.get(_u(TX_LOSE)) == LA_WIN
    assert held.get(_u(VT_LOSE)) == LA_WIN2
    # winners / singletons are not logged as held
    assert _u(LA_WIN) not in held
    assert _u(MA_SOLO) not in held


def test_held_losers_excluded_from_completeness(pg_db: psycopg.Connection) -> None:
    """A deliberate dup hold-back must not RED the completeness gate (check 8)."""
    _provision(pg_db)
    completeness_ids = {
        r[0]
        for r in pg_db.execute(
            "SELECT demonstration_id FROM migration._parity_demonstration_completeness"
        ).fetchall()
    }
    assert _u(TX_LOSE) not in completeness_ids
    assert _u(VT_LOSE) not in completeness_ids


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    assert before == after == 3
