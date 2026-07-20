"""Live-PG harness for fold-aware pending-track amendment loading.

Companion to tests/sql/test_amendment_load.py, exercising the pending side of the
2026-07-10 workflow-7 reversal: stg.amendment_resolved (sql/10_stg/33) now
resolves an amendment's parent through stg._pendg_demo_fold when there is no
approved parent, and the loader (sql/20_app/35) assigns 'Under Review' to a
pending-track amendment whose source status is NULL (the statusless pending-track
amendments the SME described).

Uses a populated stub ``stg._pendg_demo_fold`` (only legacy_pendg_demo_id +
demo_uuid are read by the resolved view) so the fold outcomes can be asserted
directly, mirroring how test_amendment_load stubs the id maps. Runs against a
throwaway Postgres (``pg_db``); self-skips without ``PG_TEST_DSN``.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import apply_migration_helper_fns

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
CROSSWALK = ROOT / "sql" / "04_crosswalks" / "64_amendment_status.sql"
CROSSWALK_CSV = ROOT / "reports" / "crosswalks" / "amendment_status.csv"
IDMAP_CREATE = ROOT / "sql" / "05_id_maps" / "16_mdcd_demo_amndmt.sql"
IDMAP_POP = ROOT / "sql" / "10_stg" / "32_populate_id_map_mdcd_demo_amndmt.sql"
RESOLVED = ROOT / "sql" / "10_stg" / "33_amendment_resolved.sql"
PARITY = ROOT / "sql" / "99_parity" / "52_amendment_load.sql"
LOADER = ROOT / "sql" / "20_app" / "35_amendment.sql"

# Loaded pending demonstrations (present in demos_app.demonstration).
PENDG_ORPHAN_UUID = uuid.UUID(int=0x1001)   # orphan pending demo that loaded
APPROVED_FOLD_UUID = uuid.UUID(int=0x5001)  # approved demo a folded pending points at
PENDG_HELD_UUID = uuid.UUID(int=0x1002)     # pending demo held back (NOT loaded)

# mdcd_demo_amndmt rows (mdcd_demo_id = 0 sentinel: no approved parent).
AP_ORPHAN_NOSTATUS = 210  # pending orphan parent, NULL status -> Under Review
AP_ORPHAN_STATUS = 220    # pending orphan parent, Approved(2) status -> Approved
AP_FOLDED = 230           # folded pending parent -> attaches to approved, Under Review
AP_PENDING_HELD = 240     # pending parent not loaded -> held back


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration, demos_app CASCADE")
    for schema in ("stg", "mysql_raw", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    apply_migration_helper_fns(conn)  # 33_amendment_resolved calls eastern_day_start

    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo_amndmt ("
        " mdcd_demo_amndmt_id bigint, mdcd_demo_id bigint, mdcd_pendg_demo_id bigint,"
        " mdcd_demo_amndmt_name text, amndmt_desc text,"
        " mdcd_demo_amndmt_stus_cd bigint, mdcd_demo_aplctn_sgntr_lvl_cd bigint,"
        " amndmt_prd_from_dt date, creatd_dt timestamptz, dltd_ind bigint)"
    )
    rows = [
        (AP_ORPHAN_NOSTATUS, "0", "4097", "Orphan NoStatus Amd", None, None, None, None, "2024-01-01", "0"),
        (AP_ORPHAN_STATUS, "0", "4097", "Orphan Approved Amd", "desc", "2", "1", "2024-02-01", "2024-01-02", "0"),
        (AP_FOLDED, "0", "4099", "Folded NoStatus Amd", None, None, None, None, "2024-01-03", "0"),
        (AP_PENDING_HELD, "0", "4098", "Pending Held Amd", None, None, None, None, "2024-01-04", "0"),
    ]
    for r in rows:
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_amndmt ("
            " mdcd_demo_amndmt_id, mdcd_demo_id, mdcd_pendg_demo_id,"
            " mdcd_demo_amndmt_name, amndmt_desc, mdcd_demo_amndmt_stus_cd,"
            " mdcd_demo_aplctn_sgntr_lvl_cd, amndmt_prd_from_dt, creatd_dt, dltd_ind)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            tuple(str(v) if v is not None else None for v in r),
        )

    _apply(conn, CROSSWALK)
    from migration.lib import copy_csv_into_table

    copy_csv_into_table(conn, "mysql_raw", "crosswalk_amendment_status", CROSSWALK_CSV)

    # No approved parents in this fixture; the id map exists but is empty.
    conn.execute("CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)")

    # Populated fold stub: legacy_pendg_demo_id + demo_uuid are all 30 reads.
    #   4097 -> loaded orphan pending demo; 4099 -> folded into an approved demo;
    #   4098 -> a held-back pending demo (demo_uuid maps, but never loaded).
    conn.execute(
        "CREATE TABLE stg._pendg_demo_fold (legacy_pendg_demo_id bigint, demo_uuid uuid)"
    )
    conn.execute(
        "INSERT INTO stg._pendg_demo_fold (legacy_pendg_demo_id, demo_uuid) "
        "VALUES (4097,%s),(4099,%s),(4098,%s)",
        (PENDG_ORPHAN_UUID, APPROVED_FOLD_UUID, PENDG_HELD_UUID),
    )

    conn.execute("CREATE TABLE stg._valid_amndmt_ids (amndmt_id bigint)")
    conn.execute(
        "INSERT INTO stg._valid_amndmt_ids (amndmt_id) VALUES (%s),(%s),(%s),(%s)",
        (AP_ORPHAN_NOSTATUS, AP_ORPHAN_STATUS, AP_FOLDED, AP_PENDING_HELD),
    )
    _apply(conn, IDMAP_CREATE)
    _apply(conn, IDMAP_POP)
    _apply(conn, RESOLVED)

    conn.execute(
        "CREATE TABLE demos_app.demonstration "
        "(id uuid PRIMARY KEY, name text, status_id text NOT NULL)"
    )
    # Only the orphan and the fold-target approved demo are loaded (NOT the held one).
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, name, status_id) "
        "VALUES (%s, 'Orphan Pending Demo', 'Under Review'), (%s, 'Approved Demo', 'Approved')",
        (PENDG_ORPHAN_UUID, APPROVED_FOLD_UUID),
    )
    conn.execute(
        "CREATE TABLE demos_app.application "
        "(id uuid PRIMARY KEY, application_type_id text NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE demos_app.amendment ("
        " id uuid PRIMARY KEY, application_type_id text NOT NULL,"
        " demonstration_id uuid NOT NULL, demonstration_status_id text NOT NULL,"
        " name text NOT NULL, description text,"
        " effective_date timestamptz, status_id text NOT NULL,"
        " current_phase_id text NOT NULL,"
        " signature_level_id text"
        "   CHECK (signature_level_id IS NULL OR signature_level_id IN ('OA','OCD')),"
        " clearance_level_id text NOT NULL DEFAULT 'CMS (OSORA)',"
        " created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,"
        " status_updated_at timestamptz NOT NULL,"
        " CONSTRAINT check_amendment_non_null_fields_when_approved"
        "   CHECK (NOT (status_id = 'Approved'"
        "     AND (effective_date IS NULL OR signature_level_id IS NULL))))"
    )

    _apply(conn, PARITY)
    _apply(conn, LOADER)


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _amndmt_uuid(conn: Any, legacy: int) -> uuid.UUID:
    row = conn.execute(
        "SELECT new_uuid FROM migration._id_map_mdcd_demo_amndmt WHERE legacy_int_id = %s",
        (legacy,),
    ).fetchone()
    assert row is not None
    return row[0]


def test_statusless_pending_amendment_defaults_under_review(pg_db: psycopg.Connection) -> None:
    """A statusless amendment on a loaded orphan pending demo loads 'Under Review'."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT demonstration_id, status_id, current_phase_id, signature_level_id "
        "FROM demos_app.amendment WHERE id = %s",
        (_amndmt_uuid(pg_db, AP_ORPHAN_NOSTATUS),),
    ).fetchone()
    assert row is not None
    assert row[0] == PENDG_ORPHAN_UUID
    assert row[1] == "Under Review"
    assert row[2] == "Review"
    assert row[3] is None


def test_pending_amendment_with_status_maps_through_crosswalk(pg_db: psycopg.Connection) -> None:
    """A pending-track amendment that DOES carry a status maps normally (not defaulted)."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT status_id, current_phase_id, signature_level_id "
        "FROM demos_app.amendment WHERE id = %s",
        (_amndmt_uuid(pg_db, AP_ORPHAN_STATUS),),
    ).fetchone()
    assert row is not None
    assert row[0] == "Approved"
    assert row[1] == "Approval Summary"
    assert row[2] == "OA"


def test_folded_amendment_attaches_to_approved(pg_db: psycopg.Connection) -> None:
    """A statusless amendment on a FOLDED pending demo attaches to the approved demo."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT demonstration_id, status_id FROM demos_app.amendment WHERE id = %s",
        (_amndmt_uuid(pg_db, AP_FOLDED),),
    ).fetchone()
    assert row is not None
    assert row[0] == APPROVED_FOLD_UUID
    assert row[1] == "Under Review"


def test_amendment_on_unloaded_pending_parent_held(pg_db: psycopg.Connection) -> None:
    """An amendment whose pending parent was held back is held, reason pending-only."""
    _provision(pg_db)
    amd = _amndmt_uuid(pg_db, AP_PENDING_HELD)
    assert (
        _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment WHERE id = %s", (amd,)) == 0
    )
    reason = pg_db.execute(
        "SELECT reason FROM migration._parity_amendment_held WHERE amendment_uuid = %s",
        (amd,),
    ).fetchone()
    assert reason is not None
    assert reason[0] == "pending-only or unmapped parent"


def test_statusless_pending_not_flagged_unmapped(pg_db: psycopg.Connection) -> None:
    """The statusless pending-track amendments must NOT trip the unmapped-status gate."""
    _provision(pg_db)
    flagged = {
        r[0]
        for r in pg_db.execute(
            "SELECT amendment_uuid FROM migration._parity_amendment_unmapped_status"
        ).fetchall()
    }
    assert _amndmt_uuid(pg_db, AP_ORPHAN_NOSTATUS) not in flagged
    assert _amndmt_uuid(pg_db, AP_FOLDED) not in flagged


def test_three_pending_track_amendments_load(pg_db: psycopg.Connection) -> None:
    """Exactly the three amendments with a loaded parent load; the held one does not."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment") == 3


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    assert before == after == 3
