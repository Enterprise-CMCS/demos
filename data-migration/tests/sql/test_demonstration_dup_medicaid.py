"""Live-PG harness for the demonstration loader's duplicate-medicaid_id hold-back.

RED-4: the DEMOS ``demonstration_medicaid_id_key`` UNIQUE constraint rejects two
demonstrations that carry the same legacy ``mdcd_demo_num``. The source has such
a defect (LA #2506 and TX #2513 both numbered 11-W-00232/6), and the loader used
to hard-fail the whole build (ERROR 23505). It now mirrors the Approved-held /
amendment hold-back pattern: for a shared medicaid_id it loads exactly one
deterministic winner and holds the rest back, logging them to
``migration._parity_demonstration_held_dup_medicaid_id`` for SME review.

Winner rule (SME-ratified): among the duplicates the row whose medicaid_id
region suffix (the ``/N``; region 10 is written as trailing ``0``) matches its
state's CMS region (``migration.state_region``) wins; if two or more match, the
lowest legacy ``mdcd_demo_id`` breaks the tie. If NO member matches its state's
region the project number's region is wrong: the WHOLE group is held (none
loaded) and parity check 21 gates RED (``gating=true``) -- there is no lowest-id
fallback in that case.

Applies the real chain (resolved view 22, loader 30, parity views 11 + 14)
against a hand-built, FK-free schema on a throwaway Postgres (``pg_db``); self-
skips without ``PG_TEST_DSN``.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import apply_migration_helper_fns, create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
RESOLVED = ROOT / "sql" / "10_stg" / "22_demonstration_resolved.sql"
LOADER = ROOT / "sql" / "20_app" / "30_demonstration.sql"
COMPLETENESS = ROOT / "sql" / "99_parity" / "11_demonstration_completeness.sql"
DUP_HELD = ROOT / "sql" / "99_parity" / "14_demonstration_held_dup_medicaid.sql"
PN_COLLISION = ROOT / "sql" / "99_parity" / "16_approved_project_number_collision.sql"

# (legacy_id, num, state, medicaid group intent)
# Pair A: same CMS region (both /6, both region 6) -> tie -> lowest id wins.
LA_WIN = 2506   # Louisiana, 11-W-00232/6, region 6 match, lowest id -> WINNER
TX_LOSE = 2513  # Texas,     11-W-00232/6, region 6 match, higher id -> loser
# Pair B: cross region -> region match beats lowest id.
VT_LOSE = 100   # Vermont,   11-W-00500/6, suffix 6 != region 1 -> loser
LA_WIN2 = 200   # Louisiana, 11-W-00500/6, suffix 6 == region 6 -> WINNER (higher id)
# Singleton control: no duplicate -> loads untouched.
MA_SOLO = 300   # Massachusetts, 11-W-00777/1, region 1 match
# Group C: region-INCORRECT duplicate -> NO member matches its state region, so
# the whole group is held (none loaded) and parity check 21 gates RED. Mirrors
# the empirical orphan case 11-W-00036/4 (Delaware, region 3, suffix /4).
DE_HELD_A = 400  # Delaware, 11-W-00036/4, suffix 4 != region 3 -> held (gating)
DE_HELD_B = 500  # Delaware, 11-W-00036/4, suffix 4 != region 3 -> held (gating)

DEMOS = [
    (LA_WIN, "11-W-00232/6", "LA"),
    (TX_LOSE, "11-W-00232/6", "TX"),
    (VT_LOSE, "11-W-00500/6", "VT"),
    (LA_WIN2, "11-W-00500/6", "LA"),
    (MA_SOLO, "11-W-00777/1", "MA"),
    (DE_HELD_A, "11-W-00036/4", "DE"),
    (DE_HELD_B, "11-W-00036/4", "DE"),
]
STATE_REGION = [("LA", 6), ("TX", 6), ("VT", 1), ("MA", 1), ("DE", 3)]


def _u(legacy: int) -> uuid.UUID:
    return uuid.UUID(int=legacy)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    create_mysql_raw_skeleton(conn)  # drops+recreates mysql_raw with all source tables
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    apply_migration_helper_fns(conn)  # 22_demonstration_resolved calls eastern_day_*

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
        "(id uuid PRIMARY KEY, application_type_id text NOT NULL, "
        "is_migrated_from_pmda boolean NOT NULL DEFAULT false)"
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
    _apply(conn, PN_COLLISION)   # parity project-number collision detector


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
    """RED-4: the collision no longer raises 23505; one demo loads per medicaid_id.

    Four distinct medicaid_ids, but the region-incorrect group (11-W-00036/4)
    loads nothing, so exactly 3 demonstrations (+ IS-A anchors) land.
    """
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration") == 3
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.application") == 3


def test_application_rows_are_flagged_migrated(pg_db: psycopg.Connection) -> None:
    """Every application the migration writes must set is_migrated_from_pmda.

    Upstream the column is ``BOOLEAN NOT NULL DEFAULT false``, so omitting it from
    an INSERT does not error -- it silently records migrated applications as
    natively created, which is the distinction DEMOS relies on to exempt them from
    the has_logged_in constraint and to identify legacy data.
    """
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.application") > 0
    assert (
        _scalar(pg_db, "SELECT count(*) FROM demos_app.application WHERE NOT is_migrated_from_pmda")
        == 0
    )


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


def test_effective_expiration_anchored_to_eastern(pg_db: psycopg.Connection) -> None:
    """demonstration_resolved anchors effective/expiration to Eastern day bounds.

    The fixture's state_prfmnc window is 2020-01-01..2025-12-31; viewed in
    America/New_York, effective_date round-trips to the start day and
    expiration_date to the end day, regardless of session TimeZone.
    """
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT (effective_date AT TIME ZONE 'America/New_York')::date, "
        "(expiration_date AT TIME ZONE 'America/New_York')::date "
        "FROM demos_app.demonstration WHERE id = %s",
        (_u(MA_SOLO),),
    ).fetchone()
    assert row is not None
    assert str(row[0]) == "2020-01-01"
    assert str(row[1]) == "2025-12-31"


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


def test_region_incorrect_group_is_fully_held(pg_db: psycopg.Connection) -> None:
    """No member's /N matches its state region -> the whole group is held (no load)."""
    _provision(pg_db)
    assert not _loaded(pg_db, DE_HELD_A)
    assert not _loaded(pg_db, DE_HELD_B)


def test_region_incorrect_group_flagged_gating(pg_db: psycopg.Connection) -> None:
    """Both held rows are tagged region_incorrect + gating=true with no kept winner."""
    _provision(pg_db)
    rows = {
        r[0]: (r[1], r[2], r[3])
        for r in pg_db.execute(
            "SELECT demonstration_id, disposition, gating, kept_legacy_demo_id "
            "FROM migration._parity_demonstration_held_dup_medicaid_id"
        ).fetchall()
    }
    for legacy in (DE_HELD_A, DE_HELD_B):
        disposition, gating, kept = rows[_u(legacy)]
        assert disposition == "region_incorrect"
        assert gating is True
        assert kept is None
    # a resolvable-group non-winner is still tagged non-gating
    assert rows[_u(TX_LOSE)] == ("held_nonwinner", False, LA_WIN)


def test_region_incorrect_group_excluded_from_completeness(pg_db: psycopg.Connection) -> None:
    """Region-incorrect held rows are excluded from completeness (gate is check 21, not 8)."""
    _provision(pg_db)
    completeness_ids = {
        r[0]
        for r in pg_db.execute(
            "SELECT demonstration_id FROM migration._parity_demonstration_completeness"
        ).fetchall()
    }
    assert _u(DE_HELD_A) not in completeness_ids
    assert _u(DE_HELD_B) not in completeness_ids


def test_missing_secondary_number_leaves_chip_id_null(pg_db: psycopg.Connection) -> None:
    """No minting: a demo with a NULL mdcd_scndry_demo_num loads with chip_id NULL.

    Every fixture demo has a NULL secondary number, so if the loader still minted
    a 21-W fallback we would see a non-NULL chip_id here. The migration must leave
    chip_id NULL for the DEMOS app to backfill.
    """
    _provision(pg_db)
    minted = _scalar(
        pg_db, "SELECT count(*) FROM demos_app.demonstration WHERE chip_id IS NOT NULL"
    )
    assert minted == 0
    # The chip sequence must not have been consumed by a mint (no nextval calls);
    # the loader only floors it via setval, which leaves last_value at the START.
    assert _scalar(pg_db, "SELECT last_value FROM demos_app.chip_id_number_seq") == 1000


def test_project_number_collision_detector_is_quiet_on_clean_data(
    pg_db: psycopg.Connection,
) -> None:
    """No fixture demo shares a project number under two medicaid_ids -> empty view."""
    _provision(pg_db)
    assert (
        _scalar(
            pg_db,
            "SELECT count(*) FROM migration._parity_approved_project_number_collision",
        )
        == 0
    )


def test_project_number_collision_detector_fires(pg_db: psycopg.Connection) -> None:
    """A mistyped region digit on the APPROVED anchor must be detected.

    Synthetic because the live source has zero occurrences: no project number maps
    to more than one medicaid_id. The condition still has to be detectable, since
    both rows satisfy the medicaid_id UNIQUE constraint and would load as two
    separate demonstrations for one waiver, which nothing else in the parity suite
    looks for (check 21 covers the same-medicaid_id case).
    """
    _provision(pg_db)
    # MA_SOLO is 11-W-00777/1 in Massachusetts (region 1, correct). Add a second
    # Massachusetts row with the same project number but the wrong region digit.
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_id, mdcd_demo_num, "
        "mdcd_scndry_demo_num, mdcd_demo_name, mdcd_demo_desc, "
        "state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, mdcd_demo_stus_cd, "
        "geo_ansi_state_cd, mdcd_chip_div_cd, creatd_dt, updtd_dt, aprvl_dt, dltd_ind) "
        "VALUES (301,'11-W-00777/4',NULL,'Demo 301','','2020-01-01','2025-12-31',6,"
        "'MA',3,'2020-01-01 00:00:00+00',NULL,NULL,0)"
    )
    pg_db.execute("INSERT INTO stg._valid_demo_ids (demo_id) VALUES (301)")
    pg_db.execute(
        "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) VALUES (301, %s)",
        (_u(301),),
    )

    rows = pg_db.execute(
        "SELECT legacy_demo_id, medicaid_id, state_region, region_matches_state, "
        "colliding_with, reason FROM migration._parity_approved_project_number_collision "
        "ORDER BY legacy_demo_id"
    ).fetchall()
    assert len(rows) == 2, f"expected both members of the collision, got {rows}"
    by_id = {r[0]: r for r in rows}
    assert by_id[MA_SOLO][1] == "11-W-00777/1"
    assert by_id[MA_SOLO][3] is True  # region 1 == MA's CMS region
    assert by_id[301][1] == "11-W-00777/4"
    assert by_id[301][3] is False  # region 4 != MA's CMS region 1
    assert "11-W-00777/4" in by_id[MA_SOLO][4]
    assert "different region digit" in by_id[301][5]


def test_secondary_number_is_normalized_not_passed_through(pg_db: psycopg.Connection) -> None:
    """chip_id_legacy must be a real 21-W number or NULL, never raw source text.

    mdcd_scndry_demo_num is free text and the live source carries the literal
    'None' and a misfiled Medicaid number in it. Passing it through (the previous
    btrim-only behavior) writes a non-CHIP value into demonstration.chip_id;
    normalizing to NULL instead lets the DEMOS mint trigger issue a valid one.
    """
    _provision(pg_db)
    cases = {
        "21W000715": "21-W-00071/5",  # unseparated -> preserved, canonicalized
        "21-W-00062/0": "21-W-00062/10",  # region 10 as a bare 0
        "None": None,  # placeholder text
        "11-W-001514": None,  # Medicaid number misfiled in the CHIP column
    }
    for raw, expected in cases.items():
        pg_db.execute(
            "UPDATE mysql_raw.mdcd_demo SET mdcd_scndry_demo_num = %s WHERE mdcd_demo_id = %s",
            (raw, MA_SOLO),
        )
        row = pg_db.execute(
            "SELECT chip_id_legacy, chip_id_source FROM stg.demonstration_resolved "
            "WHERE legacy_demo_id = %s",
            (MA_SOLO,),
        ).fetchone()
        assert row is not None
        assert row[0] == expected, f"{raw!r} -> {row[0]!r}, expected {expected!r}"
        # The raw value is retained separately so the SME drop log can name it.
        assert row[1] == raw


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration")
    assert before == after == 3
