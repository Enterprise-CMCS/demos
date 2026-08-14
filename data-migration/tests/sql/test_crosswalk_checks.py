"""Live-PG harness for the crosswalk completeness checks (CODE_REVIEW H4).

The two ``sql/04_crosswalks/*_check.sql`` DO blocks must: skip when the source
table is absent (standalone dev), hard-fail when it is present but empty,
hard-fail when a legacy code has no mapping, and pass when every code maps.
Runs the real SQL against a throwaway Postgres (``PG_TEST_DSN``).
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, LiteralString, cast

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
CHECK_DIR = ROOT / "sql" / "04_crosswalks"
STATUS_CHECK = CHECK_DIR / "11_demo_status_check.sql"
STATE_CHECK = CHECK_DIR / "21_state_check.sql"
APPLICATION_TYPE_CHECK = CHECK_DIR / "61_application_type_check.sql"
SDG_DIVISION_CHECK = CHECK_DIR / "63_sdg_division_check.sql"


def _provision(conn: Any) -> None:
    """Build a minimal mysql_raw with the columns the two checks read."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd int, geo_ansi_state_cd text)"
    )
    conn.execute("CREATE TABLE mysql_raw.crosswalk_demo_status (legacy_int_cd int)")
    conn.execute("CREATE TABLE mysql_raw.crosswalk_state (legacy_cd text)")


def _run(conn: Any, check: Path) -> None:
    conn.execute(check.read_text(encoding="utf-8"))


def test_absent_source_skips(pg_db: psycopg.Connection) -> None:
    """No mysql_raw.mdcd_demo at all -> the checks no-op (standalone dev)."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    _run(pg_db, STATUS_CHECK)
    _run(pg_db, STATE_CHECK)


def test_present_but_empty_source_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty source must hard-fail, not pass vacuously."""
    import psycopg

    _provision(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, STATUS_CHECK)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, STATE_CHECK)


def test_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A legacy code present in the source but absent from the crosswalk fails."""
    import psycopg

    _provision(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_stus_cd, geo_ansi_state_cd) "
        "VALUES (5, 'CA')"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, STATUS_CHECK)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, STATE_CHECK)


def test_complete_mapping_passes(pg_db: psycopg.Connection) -> None:
    """Every legacy code mapped -> both checks pass without raising."""
    _provision(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_stus_cd, geo_ansi_state_cd) "
        "VALUES (5, 'CA')"
    )
    pg_db.execute("INSERT INTO mysql_raw.crosswalk_demo_status (legacy_int_cd) VALUES (5)")
    pg_db.execute("INSERT INTO mysql_raw.crosswalk_state (legacy_cd) VALUES ('CA')")
    _run(pg_db, STATUS_CHECK)
    _run(pg_db, STATE_CHECK)


# --- data-backed identity crosswalks: application_type + sdg_division --------
#
# These read different source tables/columns than demo_status/state, so they
# get a dedicated provisioner. The target-existence half of each check is
# guarded by to_regclass(demos_app.*) and is inert here (no demos_app schema),
# exactly as in standalone dev -- so these exercise the completeness half.


def _provision_identity(conn: Any) -> None:
    """Build the mysql_raw source tables the identity-map checks read."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE TABLE mysql_raw.mdcd_demo_aplctn (mdcd_demo_aplctn_type_cd int)")
    conn.execute("CREATE TABLE mysql_raw.mdcd_demo (mdcd_chip_div_cd int)")
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_application_type "
        "(legacy_int_cd int, demos_text_id text)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_sdg_division "
        "(legacy_int_cd int, demos_text_id text)"
    )


def test_identity_absent_source_skips(pg_db: psycopg.Connection) -> None:
    """No source tables -> the identity-map checks no-op (standalone dev)."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    _run(pg_db, APPLICATION_TYPE_CHECK)
    _run(pg_db, SDG_DIVISION_CHECK)


def test_identity_present_but_empty_source_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty source must hard-fail, not pass vacuously."""
    import psycopg

    _provision_identity(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, APPLICATION_TYPE_CHECK)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SDG_DIVISION_CHECK)


def test_identity_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A legacy code present in the source but absent from the crosswalk fails."""
    import psycopg

    _provision_identity(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn VALUES (1)")
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo VALUES (2)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, APPLICATION_TYPE_CHECK)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SDG_DIVISION_CHECK)


def test_identity_complete_mapping_passes(pg_db: psycopg.Connection) -> None:
    """Every legacy code mapped -> both checks pass without raising.

    Includes the sdg_division ``0`` sentinel, which maps to a NULL
    ``demos_text_id`` but must still be present as a crosswalk row.
    """
    _provision_identity(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn VALUES (1)")
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo VALUES (0), (2)")
    pg_db.execute(
        "INSERT INTO mysql_raw.crosswalk_application_type "
        "(legacy_int_cd, demos_text_id) VALUES (1, 'Demonstration')"
    )
    pg_db.execute(
        "INSERT INTO mysql_raw.crosswalk_sdg_division "
        "(legacy_int_cd, demos_text_id) VALUES "
        "(0, NULL), (2, 'Division of System Reform Demonstrations')"
    )
    _run(pg_db, APPLICATION_TYPE_CHECK)
    _run(pg_db, SDG_DIVISION_CHECK)


# --- tuple/seed-backed crosswalks: signature_level + deliverable_status -------
#
# These two are now CSV+registry like the identity maps: each test applies the
# REAL DDL-only sql/04_crosswalks/{30,50}_*.sql, COPYs the load-ready
# reports/crosswalks/{signature_level,deliverable_status}.csv into the table
# (mirroring run_crosswalks), provisions the real DEMOS seed domains (so check
# clause (b) is exercised, not skipped), then runs the completeness check.

REPORTS_DIR = ROOT / "reports"
SIGNATURE_LEVEL_SQL = CHECK_DIR / "30_signature_level.sql"
SIGNATURE_LEVEL_CHECK = CHECK_DIR / "31_signature_level_check.sql"
SIGNATURE_LEVEL_CSV = REPORTS_DIR / "crosswalks" / "signature_level.csv"
DELIVERABLE_STATUS_SQL = CHECK_DIR / "50_deliverable_status.sql"
DELIVERABLE_STATUS_CHECK = CHECK_DIR / "51_deliverable_status_check.sql"
DELIVERABLE_STATUS_CSV = REPORTS_DIR / "crosswalks" / "deliverable_status.csv"
DEMO_STATUS_SQL = CHECK_DIR / "10_demo_status.sql"
DEMO_STATUS_CSV = REPORTS_DIR / "crosswalks" / "demo_status.csv"
DELIVERABLE_TYPE_SQL = CHECK_DIR / "52_deliverable_type.sql"
DELIVERABLE_TYPE_CHECK = CHECK_DIR / "53_deliverable_type_check.sql"
DELIVERABLE_TYPE_CSV = REPORTS_DIR / "crosswalks" / "deliverable_type.csv"


def _load_crosswalk_csv(conn: Any, sql_file: Path, table: str, csv_path: Path) -> None:
    """Apply the DDL-only crosswalk SQL then COPY its load CSV (as run_crosswalks does)."""
    from migration.lib import copy_csv_into_table

    conn.execute(cast(LiteralString, sql_file.read_text(encoding="utf-8")))
    copy_csv_into_table(conn, "mysql_raw", table, csv_path)


def _provision_signature_level(conn: Any) -> None:
    """Real crosswalk SQL + minimal source/seed to exercise clauses (a),(b),(c).

    Drops any leftover ``stg`` schema so clause (c) deterministically takes the
    raw-source branch here (no ``mdcd_demo_id``/valid-set scoping). ``mdcd_demo``
    carries ``dltd_ind`` because the raw branch skips soft-deleted rows.
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.signature_level (id text PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.signature_level VALUES ('OA'),('OCD'),('OGD')")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd int, mdcd_demo_aplctn_sgntr_lvl_cd int, dltd_ind int)"
    )
    _load_crosswalk_csv(
        conn, SIGNATURE_LEVEL_SQL, "crosswalk_signature_level", SIGNATURE_LEVEL_CSV
    )


def test_signature_level_idempotent(pg_db: psycopg.Connection) -> None:
    """The crosswalk DDL+COPY applies twice and holds all 5 source codes (0-4)."""
    _provision_signature_level(pg_db)
    _load_crosswalk_csv(  # second apply
        pg_db, SIGNATURE_LEVEL_SQL, "crosswalk_signature_level", SIGNATURE_LEVEL_CSV
    )
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_signature_level")
        assert cur.fetchone() == (5,)


def test_signature_level_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    """Every used code maps to a seed value -> (a)+(b)+(c) green, no raise."""
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd) VALUES (2,1),(3,2),(8,3)"
    )
    _run(pg_db, SIGNATURE_LEVEL_CHECK)


def test_signature_level_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source signature code with no crosswalk row fails closed (clause a)."""
    import psycopg

    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd) VALUES (2, 99)"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)


def test_signature_level_approved_code0_accepted_passes(pg_db: psycopg.Connection) -> None:
    """Clause (c): an APPROVED demo on code 0 (null_ok) is an SME-accepted case, no raise."""
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd, dltd_ind) VALUES (2, 0, 0)"
    )
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # must NOT raise


def test_signature_level_approved_pending_null_raises(pg_db: psycopg.Connection) -> None:
    """Clause (c): a LIVE APPROVED demo on code 4 (DD, not null_ok) fails closed."""
    import psycopg

    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd, dltd_ind) VALUES (2, 4, 0)"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)


def test_signature_level_raw_soft_deleted_passes(pg_db: psycopg.Connection) -> None:
    """Clause (c) raw branch: a soft-deleted approved code-4 demo is skipped (never migrates)."""
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd, dltd_ind) VALUES (2, 4, 1)"
    )
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # must NOT raise


def test_signature_level_present_but_empty_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty mdcd_demo must hard-fail, not pass vacuously (H4)."""
    import psycopg

    _provision_signature_level(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)


def _provision_signature_level_scoped(conn: Any, *, in_scope: bool, code: int = 4) -> None:
    """Like _provision_signature_level but with stg._valid_demo_ids present so
    clause (c) takes the scoped branch. One APPROVED (status 2) demo on the given
    signature ``code`` (default 4 'DD' -> NULL, not null_ok); it is in the
    migratable valid set iff ``in_scope``."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE TABLE demos_app.signature_level (id text PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.signature_level VALUES ('OA'),('OCD'),('OGD')")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo (mdcd_demo_id int, mdcd_demo_stus_cd int, "
        "mdcd_demo_aplctn_sgntr_lvl_cd int, dltd_ind int)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd, dltd_ind) "
        f"VALUES (7, 2, {code}, 0)"
    )
    conn.execute("CREATE TABLE stg._valid_demo_ids (demo_id int)")
    if in_scope:
        conn.execute("INSERT INTO stg._valid_demo_ids VALUES (7)")
    _load_crosswalk_csv(
        conn, SIGNATURE_LEVEL_SQL, "crosswalk_signature_level", SIGNATURE_LEVEL_CSV
    )


def test_signature_level_scoped_in_valid_set_raises(pg_db: psycopg.Connection) -> None:
    """Scoped (c): an approved code-4 (pending, not null_ok) demo inside
    stg._valid_demo_ids (will migrate) fails closed."""
    import psycopg

    _provision_signature_level_scoped(pg_db, in_scope=True)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)


def test_signature_level_scoped_excluded_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (c): an approved code-4 demo excluded from stg._valid_demo_ids
    (malformed / SME-deferred via drop_ids) does not trip a gate it never
    reaches."""
    _provision_signature_level_scoped(pg_db, in_scope=False)
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # must NOT raise


def test_signature_level_scoped_soft_deleted_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (c): a soft-deleted (dltd_ind=1) approved code-4 demo is skipped
    even when present in the valid set."""
    _provision_signature_level_scoped(pg_db, in_scope=True)
    pg_db.execute("UPDATE mysql_raw.mdcd_demo SET dltd_ind = 1 WHERE mdcd_demo_id = 7")
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # must NOT raise


def test_signature_level_scoped_code0_accepted_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (c): an approved code-0 (null_ok) demo in the valid set is accepted."""
    _provision_signature_level_scoped(pg_db, in_scope=True, code=0)
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # must NOT raise


def _provision_deliverable_status(conn: Any) -> None:
    """Real crosswalk SQL + the three DEMOS seed domains check (b) validates against.

    Drops any leftover ``stg`` schema so clause (a) deterministically takes the
    raw-source branch here (the bare mdcd_dlvrbl has no ``dltd_ind``/id column).
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.deliverable_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_status VALUES "
        "('Upcoming'),('Past Due'),('Submitted'),('Under CMS Review'),"
        "('Accepted'),('Approved'),('Received and Filed'),('Deleted')"
    )
    conn.execute("CREATE TABLE demos_app.deliverable_due_date_type (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_due_date_type VALUES ('Normal'),('Open Ended')"
    )
    conn.execute("CREATE TABLE demos_app.deliverable_extension_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_extension_status VALUES "
        "('Requested'),('Approved'),('Denied'),('Withdrawn')"
    )
    conn.execute("CREATE TABLE mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd int)")
    _load_crosswalk_csv(
        conn, DELIVERABLE_STATUS_SQL, "crosswalk_deliverable_status", DELIVERABLE_STATUS_CSV
    )


def test_deliverable_status_idempotent(pg_db: psycopg.Connection) -> None:
    """The crosswalk DDL+COPY applies twice and holds all 17 source codes (0-16)."""
    _provision_deliverable_status(pg_db)
    _load_crosswalk_csv(  # second apply
        pg_db, DELIVERABLE_STATUS_SQL, "crosswalk_deliverable_status", DELIVERABLE_STATUS_CSV
    )
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_deliverable_status")
        assert cur.fetchone() == (17,)


def test_deliverable_status_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    """Codes with a confirmed non-NULL status_id -> (a)+(b) green, no raise.

    Also proves every authored status_id/due_date_type_id/emit_extension_status
    exists in the real DEMOS seed (a typo would fail clause (b) here).
    """
    _provision_deliverable_status(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES "
        "(1),(3),(5),(6),(7),(8),(13),(14),(15),(16)"
    )
    _run(pg_db, DELIVERABLE_STATUS_CHECK)


def test_deliverable_status_code7_maps_to_under_cms_review(pg_db: psycopg.Connection) -> None:
    """RED-2: code 7 (Overridden) now resolves to 'Under CMS Review' (SME, data-profile match)."""
    _provision_deliverable_status(pg_db)
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT status_id, null_ok FROM mysql_raw.crosswalk_deliverable_status "
            "WHERE legacy_int_cd = 7"
        )
        assert cur.fetchone() == ("Under CMS Review", False)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES (7)")
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # must NOT raise


def test_deliverable_status_code0_null_ok_passes(pg_db: psycopg.Connection) -> None:
    """RED-2: code 0 (N/A) carries a NULL status_id flagged null_ok -> SME-accepted, no raise.

    Mirrors signature_level code 0: the loader holds these rows back (cw.status_id
    IS NOT NULL guard) and logs them in _parity_deliverable_held; the completeness
    check must exempt them rather than fail closed.
    """
    _provision_deliverable_status(pg_db)
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT status_id, null_ok FROM mysql_raw.crosswalk_deliverable_status "
            "WHERE legacy_int_cd = 0"
        )
        assert cur.fetchone() == (None, True)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES (0)")
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # must NOT raise


def test_deliverable_status_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source code absent from the crosswalk (neither mapped nor null_ok) fails closed."""
    import psycopg

    _provision_deliverable_status(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES (99)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_STATUS_CHECK)


def test_deliverable_status_present_but_empty_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty mdcd_dlvrbl must hard-fail, not pass vacuously (H4)."""
    import psycopg

    _provision_deliverable_status(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_STATUS_CHECK)


def _provision_deliverable_status_scoped(conn: Any, *, in_scope: bool, code: int = 99) -> None:
    """Like _provision_deliverable_status but with stg._valid_dlvrbl_ids present
    so clause (a) takes the scoped branch. One deliverable on the given ``code``
    (default 99, absent from the crosswalk -> neither mapped nor null_ok); it is
    in the migratable set iff ``in_scope``."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE TABLE demos_app.deliverable_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_status VALUES "
        "('Upcoming'),('Past Due'),('Submitted'),('Under CMS Review'),"
        "('Accepted'),('Approved'),('Received and Filed'),('Deleted')"
    )
    conn.execute("CREATE TABLE demos_app.deliverable_due_date_type (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_due_date_type VALUES ('Normal'),('Open Ended')"
    )
    conn.execute("CREATE TABLE demos_app.deliverable_extension_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_extension_status VALUES "
        "('Requested'),('Approved'),('Denied'),('Withdrawn')"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl "
        "(mdcd_dlvrbl_id int, mdcd_dlvrbl_crnt_stus_cd int, dltd_ind int)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl "
        "(mdcd_dlvrbl_id, mdcd_dlvrbl_crnt_stus_cd, dltd_ind) VALUES (5, %s, 0)",
        (code,),
    )
    conn.execute("CREATE TABLE stg._valid_dlvrbl_ids (dlvrbl_id int)")
    if in_scope:
        conn.execute("INSERT INTO stg._valid_dlvrbl_ids VALUES (5)")
    _load_crosswalk_csv(
        conn, DELIVERABLE_STATUS_SQL, "crosswalk_deliverable_status", DELIVERABLE_STATUS_CSV
    )


def test_deliverable_status_scoped_in_valid_set_raises(pg_db: psycopg.Connection) -> None:
    """Scoped (a): an unmapped-code deliverable inside stg._valid_dlvrbl_ids
    (will migrate) still fails closed."""
    import psycopg

    _provision_deliverable_status_scoped(pg_db, in_scope=True)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_STATUS_CHECK)


def test_deliverable_status_scoped_excluded_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (a): an unmapped-code deliverable excluded from stg._valid_dlvrbl_ids
    (dropped parent / soft-deleted) does not trip a gate it never reaches."""
    _provision_deliverable_status_scoped(pg_db, in_scope=False)
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # must NOT raise


def test_deliverable_status_scoped_soft_deleted_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (a): a soft-deleted (dltd_ind=1) unmapped-code deliverable is skipped
    even when present in the valid set."""
    _provision_deliverable_status_scoped(pg_db, in_scope=True)
    pg_db.execute("UPDATE mysql_raw.mdcd_dlvrbl SET dltd_ind = 1 WHERE mdcd_dlvrbl_id = 5")
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # must NOT raise


def test_deliverable_status_scoped_code0_null_ok_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (a): a code-0 (null_ok) deliverable in the valid set is SME-accepted."""
    _provision_deliverable_status_scoped(pg_db, in_scope=True, code=0)
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # must NOT raise


# --- single-input crosswalk: deliverable_type (rpt_ocrnc vocabulary) ---------
#
# crosswalk_deliverable_type maps mdcd_dlvrbl.mdcd_dlvrbl_type_cd (the rich
# report-occurrence vocabulary, proven 40/40 against mdcd_dlvrbl_rpt_ocrnc_rfrnc)
# directly to a DEMOS deliverable_type. Each test applies the REAL DDL-only
# 52_deliverable_type.sql + COPYs the load-ready CSV (as run_crosswalks does),
# provisions the real DEMOS deliverable_type seed so check clause (b) runs, then
# exercises the completeness clause (a). Mirrors deliverable_status.

# The 17 DEMOS deliverable_type seed ids (STATIC_CONSTRAINT).
_DELIVERABLE_TYPE_SEED = (
    "Annual Budget Neutrality Report",
    "Close Out Report",
    "Demonstration-Specific Deliverable",
    "Evaluation Design",
    "HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)",
    "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
    "HCBS Evidentiary Report",
    "HCBS Performance Measures Report",
    "HCBS Quality Improvement Strategy Report",
    "Implementation Plan",
    "Interim Evaluation Report",
    "Mid-point Assessment",
    "Monitoring Protocol",
    "Monitoring Report",
    "Quarterly Budget Neutrality Report",
    "Summative Evaluation Report",
    "Transition Plan",
)


def _provision_deliverable_type(conn: Any) -> None:
    """Real crosswalk SQL + the DEMOS deliverable_type seed check (b) validates against.

    Drops any leftover ``stg`` schema so clause (a) deterministically takes the
    raw-source branch here (the bare mdcd_dlvrbl has no ``dltd_ind``/id column).
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.deliverable_type (id text PRIMARY KEY)")
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO demos_app.deliverable_type (id) VALUES (%s)",
            [(v,) for v in _DELIVERABLE_TYPE_SEED],
        )
    conn.execute("CREATE TABLE mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_type_cd int)")
    _load_crosswalk_csv(
        conn, DELIVERABLE_TYPE_SQL, "crosswalk_deliverable_type", DELIVERABLE_TYPE_CSV
    )


def test_deliverable_type_idempotent(pg_db: psycopg.Connection) -> None:
    """The crosswalk DDL+COPY applies twice and holds all 41 raw rpt_ocrnc codes."""
    _provision_deliverable_type(pg_db)
    _load_crosswalk_csv(  # second apply
        pg_db, DELIVERABLE_TYPE_SQL, "crosswalk_deliverable_type", DELIVERABLE_TYPE_CSV
    )
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_deliverable_type")
        assert cur.fetchone() == (41,)


def test_deliverable_type_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    """Every used code maps to a seed value -> (a)+(b) green, no raise.

    Also proves every authored demos_text_id exists in the real DEMOS
    deliverable_type seed (a typo would fail clause (b) here).
    """
    _provision_deliverable_type(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_type_cd) VALUES "
        "(0),(57),(70),(53),(83),(84),(87),(88),(69),(79),(86),(51)"
    )
    _run(pg_db, DELIVERABLE_TYPE_CHECK)


def test_deliverable_type_bn_codes_route_directly(pg_db: psycopg.Connection) -> None:
    """Type codes 57/70 map directly to the two DEMOS BN types (single-input pivot)."""
    _provision_deliverable_type(pg_db)
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT legacy_int_cd, demos_text_id FROM mysql_raw.crosswalk_deliverable_type "
            "WHERE legacy_int_cd IN (57, 70) ORDER BY legacy_int_cd"
        )
        assert cur.fetchall() == [
            (57, "Quarterly Budget Neutrality Report"),
            (70, "Annual Budget Neutrality Report"),
        ]


def test_deliverable_type_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source code absent from the crosswalk fails closed (clause a)."""
    import psycopg

    _provision_deliverable_type(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_type_cd) VALUES (999)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_TYPE_CHECK)


def test_deliverable_type_present_but_empty_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty mdcd_dlvrbl must hard-fail, not pass vacuously (H4)."""
    import psycopg

    _provision_deliverable_type(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_TYPE_CHECK)


def _provision_deliverable_type_scoped(conn: Any, *, in_scope: bool, code: int = 999) -> None:
    """Like _provision_deliverable_type but with stg._valid_dlvrbl_ids present so
    clause (a) takes the scoped branch. One deliverable on the given ``code``
    (default 999, absent from the crosswalk); it is in the migratable set iff
    ``in_scope``."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS stg CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE TABLE demos_app.deliverable_type (id text PRIMARY KEY)")
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO demos_app.deliverable_type (id) VALUES (%s)",
            [(v,) for v in _DELIVERABLE_TYPE_SEED],
        )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl "
        "(mdcd_dlvrbl_id int, mdcd_dlvrbl_type_cd int, dltd_ind int)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl "
        "(mdcd_dlvrbl_id, mdcd_dlvrbl_type_cd, dltd_ind) VALUES (5, %s, 0)",
        (code,),
    )
    conn.execute("CREATE TABLE stg._valid_dlvrbl_ids (dlvrbl_id int)")
    if in_scope:
        conn.execute("INSERT INTO stg._valid_dlvrbl_ids VALUES (5)")
    _load_crosswalk_csv(
        conn, DELIVERABLE_TYPE_SQL, "crosswalk_deliverable_type", DELIVERABLE_TYPE_CSV
    )


def test_deliverable_type_scoped_in_valid_set_raises(pg_db: psycopg.Connection) -> None:
    """Scoped (a): an unmapped-code deliverable inside stg._valid_dlvrbl_ids
    (will migrate) still fails closed."""
    import psycopg

    _provision_deliverable_type_scoped(pg_db, in_scope=True)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_TYPE_CHECK)


def test_deliverable_type_scoped_excluded_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (a): an unmapped-code deliverable excluded from stg._valid_dlvrbl_ids
    (dropped parent / soft-deleted) does not trip a gate it never reaches."""
    _provision_deliverable_type_scoped(pg_db, in_scope=False)
    _run(pg_db, DELIVERABLE_TYPE_CHECK)  # must NOT raise


def test_deliverable_type_scoped_soft_deleted_passes(pg_db: psycopg.Connection) -> None:
    """Scoped (a): a soft-deleted (dltd_ind=1) unmapped-code deliverable is skipped
    even when present in the valid set."""
    _provision_deliverable_type_scoped(pg_db, in_scope=True)
    pg_db.execute("UPDATE mysql_raw.mdcd_dlvrbl SET dltd_ind = 1 WHERE mdcd_dlvrbl_id = 5")
    _run(pg_db, DELIVERABLE_TYPE_CHECK)  # must NOT raise


# --- person-type crosswalk: role_person_type ---------------------------------
#
# 43 reads mysql_raw.role_rfrnc for completeness (clause a), checks each
# legacy_name against role_rfrnc.role_name (clause b), and validates
# person_type_id against demos_app.person_type (clause c). role_rfrnc is a
# reference table that must always be populated, so a present-but-empty source
# fails closed (H4) like the other core-table checks.

ROLE_PERSON_TYPE_SQL = CHECK_DIR / "42_role_person_type.sql"
ROLE_PERSON_TYPE_CHECK = CHECK_DIR / "43_role_person_type_check.sql"
ROLE_PERSON_TYPE_CSV = REPORTS_DIR / "crosswalks" / "role_person_type.csv"


def _provision_role_person_type(conn: Any) -> None:
    """Real crosswalk SQL + the role_rfrnc source and demos_app.person_type seed."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.person_type (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.person_type VALUES "
        "('demos-admin'),('demos-cms-user'),('demos-state-user'),('non-user-contact')"
    )
    conn.execute("CREATE TABLE mysql_raw.role_rfrnc (role_cd int, role_name text)")
    _load_crosswalk_csv(
        conn, ROLE_PERSON_TYPE_SQL, "crosswalk_role_person_type", ROLE_PERSON_TYPE_CSV
    )


def test_role_person_type_present_but_empty_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty role_rfrnc must hard-fail, not pass vacuously (H4)."""
    import psycopg

    _provision_role_person_type(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, ROLE_PERSON_TYPE_CHECK)


def test_role_person_type_complete_passes(pg_db: psycopg.Connection) -> None:
    """Every legacy role code mapped, names agree, types seeded -> no raise.

    The role_rfrnc fixture mirrors the crosswalk CSV, so this also proves every
    authored legacy_name/person_type_id is consistent with the source + seed.
    """
    _provision_role_person_type(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.role_rfrnc (role_cd, role_name) "
        "SELECT legacy_int_cd, legacy_name FROM mysql_raw.crosswalk_role_person_type"
    )
    _run(pg_db, ROLE_PERSON_TYPE_CHECK)  # must NOT raise


def test_role_person_type_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source role code with no crosswalk row fails closed (clause a)."""
    import psycopg

    _provision_role_person_type(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.role_rfrnc (role_cd, role_name) VALUES (99, 'Unknown Role')"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, ROLE_PERSON_TYPE_CHECK)


# --- demo_status: code 1 'Pending' is now mapped (decision D1) -----------------
#
# Applies the REAL DDL-only sql/04_crosswalks/10_demo_status.sql + COPYs the
# load-ready reports/crosswalks/demo_status.csv (as run_crosswalks does), then
# runs the completeness gate with a source demo carrying code 1. Before D1 the
# gate failed closed on code 1; the SME mapped it to 'Under Review', so it must
# now pass. This guards the decision against an accidental CSV regression.


def test_demo_status_code_1_pending_maps_to_under_review(pg_db: psycopg.Connection) -> None:
    """D1: a mdcd_demo carrying code 1 passes 11_demo_status_check (code 1 mapped)."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    pg_db.execute(
        "CREATE TABLE mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd int, geo_ansi_state_cd text)"
    )
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_stus_cd, geo_ansi_state_cd) "
        "VALUES (1, 'CA'), (2, 'NY')"
    )
    _load_crosswalk_csv(pg_db, DEMO_STATUS_SQL, "crosswalk_demo_status", DEMO_STATUS_CSV)
    _run(pg_db, STATUS_CHECK)  # must NOT raise: code 1 is now in the crosswalk
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT demos_text_id FROM mysql_raw.crosswalk_demo_status "
            "WHERE legacy_int_cd = 1"
        )
        assert cur.fetchone() == ("Under Review",)
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_demo_status")
        assert cur.fetchone() == (9,)


# --- load-only crosswalks: application_status + document_type (2026-06-26) -----
#
# Both are DDL + registry + check but have NO consumer loader yet. Each test
# applies the REAL DDL-only sql + COPYs the load-ready CSV (as run_crosswalks
# does), provisions the real DEMOS seed domain so check clause (b) runs, then
# exercises the completeness clause (a). application_status fails closed on a
# present-but-empty source (every application has a status); document_type
# treats an empty source as a legitimate NOTICE no-op (an application may have
# no documents), mirroring amendment_status.

APPLICATION_STATUS_SQL = CHECK_DIR / "12_application_status.sql"
APPLICATION_STATUS_CHECK = CHECK_DIR / "13_application_status_check.sql"
APPLICATION_STATUS_CSV = REPORTS_DIR / "crosswalks" / "application_status.csv"
DOCUMENT_TYPE_SQL = CHECK_DIR / "66_document_type.sql"
DOCUMENT_TYPE_CHECK = CHECK_DIR / "67_document_type_check.sql"
DOCUMENT_TYPE_CSV = REPORTS_DIR / "crosswalks" / "document_type.csv"


def _provision_application_status(conn: Any) -> None:
    """Real crosswalk SQL + minimal source/seed to exercise clauses (a),(b)."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.application_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.application_status VALUES "
        "('Pre-Submission'),('Under Review'),('Approved'),('Denied'),"
        "('Withdrawn'),('On-hold')"
    )
    conn.execute("CREATE TABLE mysql_raw.mdcd_demo_aplctn (mdcd_demo_aplctn_stus_cd int)")
    _load_crosswalk_csv(
        conn, APPLICATION_STATUS_SQL, "crosswalk_application_status", APPLICATION_STATUS_CSV
    )


def test_application_status_idempotent(pg_db: psycopg.Connection) -> None:
    """The crosswalk DDL+COPY applies twice and holds all 11 source codes (1-11)."""
    _provision_application_status(pg_db)
    _load_crosswalk_csv(  # second apply
        pg_db, APPLICATION_STATUS_SQL, "crosswalk_application_status", APPLICATION_STATUS_CSV
    )
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_application_status")
        assert cur.fetchone() == (11,)


def test_application_status_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    """Every used code maps to a seed value -> (a)+(b) green, no raise.

    Also proves every authored demos_text_id exists in the real DEMOS
    application_status seed (a typo would fail clause (b) here).
    """
    _provision_application_status(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn VALUES (1),(3),(7),(10),(11)")
    _run(pg_db, APPLICATION_STATUS_CHECK)


def test_application_status_present_but_empty_raises(pg_db: psycopg.Connection) -> None:
    """A present-but-empty mdcd_demo_aplctn must hard-fail, not pass vacuously."""
    import psycopg

    _provision_application_status(pg_db)
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, APPLICATION_STATUS_CHECK)


def test_application_status_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source application-status code with no crosswalk row fails closed (clause a)."""
    import psycopg

    _provision_application_status(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn VALUES (99)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, APPLICATION_STATUS_CHECK)


def _provision_document_type(conn: Any) -> None:
    """Real crosswalk SQL + the DEMOS document_type seed check (b) validates against."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.document_type (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.document_type VALUES "
        "('Application Completeness Letter'),('Approval Letter'),"
        "('Signed Decision Memo'),('Payment Ratio Analysis'),"
        "('State Application'),('General File'),('BN Workbook'),"
        "('Formal OMB Policy Concurrence Email'),('Q&A')"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo_aplctn_doc (mdcd_demo_aplctn_doc_type_cd int)"
    )
    _load_crosswalk_csv(conn, DOCUMENT_TYPE_SQL, "crosswalk_document_type", DOCUMENT_TYPE_CSV)


def test_document_type_idempotent(pg_db: psycopg.Connection) -> None:
    """The crosswalk DDL+COPY applies twice and holds all 10 source codes (1-9, 99)."""
    _provision_document_type(pg_db)
    _load_crosswalk_csv(  # second apply
        pg_db, DOCUMENT_TYPE_SQL, "crosswalk_document_type", DOCUMENT_TYPE_CSV
    )
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_document_type")
        assert cur.fetchone() == (10,)


def test_document_type_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    """Codes mapped to a seed value -> (a)+(b) green; includes the fold codes 6/99."""
    _provision_document_type(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn_doc VALUES (1),(6),(7),(99)")
    _run(pg_db, DOCUMENT_TYPE_CHECK)


def test_document_type_present_but_empty_no_raise(pg_db: psycopg.Connection) -> None:
    """An application with no documents is legitimate -> NOTICE no-op, not a failure."""
    _provision_document_type(pg_db)
    _run(pg_db, DOCUMENT_TYPE_CHECK)  # empty source must NOT raise


def test_document_type_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    """A source doc-type code with no crosswalk row fails closed (clause a)."""
    import psycopg

    _provision_document_type(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_demo_aplctn_doc VALUES (1000)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DOCUMENT_TYPE_CHECK)


# --- column-mapping crosswalk: demonstration_role ----------------------------
#
# 47's clause (a) verifies that every mapped source_column exists on its
# source_table via information_schema. Unlike the code-completeness checks it
# reads no demos_app seed for (a), but it must still defer when the source
# table is not yet loaded: running `migrate crosswalks` standalone (before
# load-full) leaves mysql_raw.mdcd_demo absent, and without a source-table
# guard every one of the 15 mapped columns is reported "absent". These tests
# pin the guard added to clause (a) plus the still-live missing-column detection.

DEMONSTRATION_ROLE_SQL = CHECK_DIR / "46_demonstration_role.sql"
DEMONSTRATION_ROLE_CHECK = CHECK_DIR / "47_demonstration_role_check.sql"
DEMONSTRATION_ROLE_CSV = REPORTS_DIR / "crosswalks" / "demonstration_role.csv"

# The 15 mdcd_demo per-role columns the crosswalk maps (see the CSV).
_DEMONSTRATION_ROLE_COLUMNS = (
    "proj_ofcr_user_id",
    "bkup_proj_ofcr_user_id",
    "ro_fincl_lead_user_id",
    "tchncl_drctr_user_id",
    "mntrg_eval_tchncl_drctr_user_id",
    "ro_mntrg_lead_user_id",
    "anlyst_user_id",
    "anlyst_scndry_user_id",
    "mc_anlyst_id",
    "hcbs_anlyst_id",
    "state_prmry_poc_user_id",
    "state_scndry_poc_user_id",
    "state_3rd_poc_user_id",
    "state_4th_poc_user_id",
    "state_5th_poc_user_id",
)


def _provision_demonstration_role(conn: Any) -> None:
    """Apply the real crosswalk DDL + COPY its load CSV; no demos_app schema.

    Clauses (b)/(c) are to_regclass-guarded on demos_app and stay inert here,
    so these tests exercise clause (a) (column existence) and clause (d) (the
    single is_primary slot, which the CSV satisfies).
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    _load_crosswalk_csv(
        conn, DEMONSTRATION_ROLE_SQL, "crosswalk_demonstration_role", DEMONSTRATION_ROLE_CSV
    )


def test_demonstration_role_absent_source_skips(pg_db: psycopg.Connection) -> None:
    """Regression: crosswalk rows map mdcd_demo columns but mdcd_demo is not
    loaded -> clause (a) defers instead of reporting all 15 columns absent."""
    _provision_demonstration_role(pg_db)
    _run(pg_db, DEMONSTRATION_ROLE_CHECK)  # must NOT raise (source deferred)


def test_demonstration_role_loaded_source_missing_column_raises(
    pg_db: psycopg.Connection,
) -> None:
    """A loaded mdcd_demo missing a mapped column still fails closed (clause a)."""
    import psycopg

    _provision_demonstration_role(pg_db)
    pg_db.execute("CREATE TABLE mysql_raw.mdcd_demo (mdcd_demo_id int)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DEMONSTRATION_ROLE_CHECK)


def test_demonstration_role_complete_columns_pass(pg_db: psycopg.Connection) -> None:
    """A loaded mdcd_demo carrying every mapped column passes clause (a)."""
    _provision_demonstration_role(pg_db)
    cols = ", ".join(f"{c} int" for c in _DEMONSTRATION_ROLE_COLUMNS)
    pg_db.execute(f"CREATE TABLE mysql_raw.mdcd_demo ({cols})")
    _run(pg_db, DEMONSTRATION_ROLE_CHECK)  # must NOT raise
