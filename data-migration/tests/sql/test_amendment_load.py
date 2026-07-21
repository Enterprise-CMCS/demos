"""Live-PG load-correctness harness for the amendment loader.

Exercises the real amendment chain -- crosswalk (sql/04_crosswalks/64), id map
(sql/05_id_maps/16 + sql/10_stg/29), resolved view (sql/10_stg/30), parity views
(sql/99_parity/52), and loader (sql/20_app/35) -- against a hand-built, FK-free
schema, asserting the derivations the spec fixes:

  * an Approved amendment with an OA signature on a LOADED parent loads with
    status_id 'Approved', current_phase_id 'Approval Summary', signature 'OA';
  * a Pending amendment with a legacy OGD(3) signature loads with status_id
    'Under Review', current_phase_id 'Review', signature NULLed -- and is logged
    in migration._parity_amendment_signature_dropped;
  * an amendment whose only parent is a pending (unmigrated) demo is held back
    (not loaded) and appears in migration._parity_amendment_held;
  * an amendment whose approved parent was itself held back (no demonstration
    row) is held back too, reason 'approved parent held back';
  * an Approved amendment on a loaded parent whose signature is NULL (legacy
    code neither OA nor OCD) is held back (not loaded) rather than violating
    check_amendment_non_null_fields_when_approved, and appears in
    migration._parity_amendment_held_missing_field;
  * re-applying the loader is a no-op (idempotent).

Runs against a throwaway Postgres (``PG_TEST_DSN`` via the ``pg_db`` fixture);
self-skips without it.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
CROSSWALK = ROOT / "sql" / "04_crosswalks" / "64_amendment_status.sql"
CROSSWALK_CSV = ROOT / "reports" / "crosswalks" / "amendment_status.csv"
IDMAP_CREATE = ROOT / "sql" / "05_id_maps" / "16_mdcd_demo_amndmt.sql"
IDMAP_POP = ROOT / "sql" / "10_stg" / "29_populate_id_map_mdcd_demo_amndmt.sql"
RESOLVED = ROOT / "sql" / "10_stg" / "30_amendment_resolved.sql"
PARITY = ROOT / "sql" / "99_parity" / "52_amendment_load.sql"
LOADER = ROOT / "sql" / "20_app" / "35_amendment.sql"

DEMO_U1 = uuid.UUID(int=0xD1)  # approved parent that IS loaded
DEMO_U2 = uuid.UUID(int=0xD2)  # approved parent that is NOT loaded (held back)

# mdcd_demo_amndmt rows: (amndmt_id, mdcd_demo_id, mdcd_pendg_demo_id, name,
#                         status_cd, signature_cd)
A_APPROVED = 10  # parent demo 1 loaded, Approved(2), OA(1)
A_OGD = 20       # parent demo 1 loaded, Pending(1)->Under Review, OGD(3)->NULL
A_PENDING_ONLY = 30  # only pending parent -> held
A_PARENT_HELD = 40   # approved parent demo 2 not loaded -> held
A_APPROVED_NOSIG = 50  # parent demo 1 loaded, Approved(2), OGD(3)->NULL sig -> held (missing field)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration, demos_app CASCADE")
    for schema in ("stg", "mysql_raw", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # --- source (mysql_raw), typed as pgloader lands it (int->bigint,
    # date/datetime->date/timestamptz), matching tests/sql/_skeleton.py. ---
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo_amndmt ("
        " mdcd_demo_amndmt_id bigint, mdcd_demo_id bigint, mdcd_pendg_demo_id bigint,"
        " mdcd_demo_amndmt_name text, amndmt_desc text,"
        " mdcd_demo_amndmt_stus_cd bigint, mdcd_demo_aplctn_sgntr_lvl_cd bigint,"
        " amndmt_prd_from_dt date, creatd_dt timestamptz, dltd_ind bigint)"
    )
    rows = [
        (A_APPROVED, "1", None, "Approved Amd", "desc a", "2", "1", "2024-02-01", "2024-01-01", "0"),
        (A_OGD, "1", None, "OGD Amd", None, "1", "3", "2024-03-01", "2024-01-02", "0"),
        (A_PENDING_ONLY, None, "99", "Pending-Only Amd", None, "2", "1", None, "2024-01-03", "0"),
        (A_PARENT_HELD, "2", None, "Parent-Held Amd", None, "2", "2", None, "2024-01-04", "0"),
        (A_APPROVED_NOSIG, "1", None, "Approved NoSig Amd", "desc e", "2", "3", "2024-05-01", "2024-01-05", "0"),
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

    _apply(conn, CROSSWALK)  # mysql_raw.crosswalk_amendment_status (DDL only)
    from migration.lib import copy_csv_into_table

    copy_csv_into_table(  # values now live in the load CSV (registry-canonical)
        conn, "mysql_raw", "crosswalk_amendment_status", CROSSWALK_CSV
    )

    # --- migration plumbing ---
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)"
    )
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) "
        "VALUES (1, %s), (2, %s)",
        (DEMO_U1, DEMO_U2),
    )
    conn.execute("CREATE TABLE stg._valid_amndmt_ids (amndmt_id bigint)")
    conn.execute(
        "INSERT INTO stg._valid_amndmt_ids (amndmt_id) VALUES (%s),(%s),(%s),(%s),(%s)",
        (A_APPROVED, A_OGD, A_PENDING_ONLY, A_PARENT_HELD, A_APPROVED_NOSIG),
    )
    _apply(conn, IDMAP_CREATE)  # migration._id_map_mdcd_demo_amndmt (empty)
    _apply(conn, IDMAP_POP)     # mint a UUID per valid id
    _apply(conn, RESOLVED)      # stg.amendment_resolved view

    # --- target (demos_app), FK-free but with the columns the loader writes ---
    conn.execute(
        "CREATE TABLE demos_app.demonstration "
        "(id uuid PRIMARY KEY, name text, status_id text NOT NULL)"
    )
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, name, status_id) "
        "VALUES (%s, 'Parent Demo', 'Approved')",
        (DEMO_U1,),
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

    _apply(conn, PARITY)   # migration._parity_amendment_* views
    _apply(conn, LOADER)   # the load itself


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


def test_only_loaded_parents_load(pg_db: psycopg.Connection) -> None:
    """Exactly the two amendments with a loaded parent demonstration load."""
    _provision(pg_db)
    n_amd = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    n_app = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.application WHERE application_type_id = 'Amendment'",
    )
    assert n_amd == 2
    assert n_app == 2  # IS-A: one application anchor per amendment


def test_approved_amendment_derivations(pg_db: psycopg.Connection) -> None:
    """Approved + OA on a loaded parent -> Approved / Approval Summary / OA."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT demonstration_id, status_id, current_phase_id, signature_level_id, "
        "clearance_level_id FROM demos_app.amendment WHERE id = %s",
        (_amndmt_uuid(pg_db, A_APPROVED),),
    ).fetchone()
    assert row is not None
    assert row[0] == DEMO_U1
    assert row[1] == "Approved"
    assert row[2] == "Approval Summary"
    assert row[3] == "OA"
    assert row[4] == "CMS (OSORA)"  # DEFAULT applied (column omitted by loader)


def test_ogd_signature_nulled_and_logged(pg_db: psycopg.Connection) -> None:
    """Pending + OGD(3) -> Under Review / Review / NULL signature, and logged."""
    _provision(pg_db)
    amd_uuid = _amndmt_uuid(pg_db, A_OGD)
    row = pg_db.execute(
        "SELECT status_id, current_phase_id, signature_level_id "
        "FROM demos_app.amendment WHERE id = %s",
        (amd_uuid,),
    ).fetchone()
    assert row is not None
    assert row[0] == "Under Review"
    assert row[1] == "Review"
    assert row[2] is None
    logged = pg_db.execute(
        "SELECT signature_cd FROM migration._parity_amendment_signature_dropped "
        "WHERE amendment_uuid = %s",
        (amd_uuid,),
    ).fetchone()
    assert logged is not None
    assert logged[0] == 3


def test_unloaded_parents_held_back(pg_db: psycopg.Connection) -> None:
    """Pending-only and approved-but-held parents are excluded and logged."""
    _provision(pg_db)
    held = dict(
        pg_db.execute(
            "SELECT amendment_uuid, reason FROM migration._parity_amendment_held"
        ).fetchall()
    )
    assert _amndmt_uuid(pg_db, A_PENDING_ONLY) in held
    assert _amndmt_uuid(pg_db, A_PARENT_HELD) in held
    assert held[_amndmt_uuid(pg_db, A_PENDING_ONLY)] == "pending-only or unmapped parent"
    assert held[_amndmt_uuid(pg_db, A_PARENT_HELD)] == "approved parent held back"
    # Neither held amendment reached the target table.
    loaded = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    assert loaded == 2


def test_approved_missing_signature_held_back(pg_db: psycopg.Connection) -> None:
    """An Approved amendment with a NULL signature is held back, not crashed.

    Mirrors the demonstration loader: rather than violate
    check_amendment_non_null_fields_when_approved, the loader holds the row back
    (does not insert it) and logs it in _parity_amendment_held_missing_field.
    """
    _provision(pg_db)
    amd_uuid = _amndmt_uuid(pg_db, A_APPROVED_NOSIG)
    loaded = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.amendment WHERE id = %s",
        (amd_uuid,),
    )
    assert loaded == 0
    row = pg_db.execute(
        "SELECT missing_signature, missing_effective_date "
        "FROM migration._parity_amendment_held_missing_field WHERE amendment_uuid = %s",
        (amd_uuid,),
    ).fetchone()
    assert row is not None
    assert row[0] is True
    assert row[1] is False


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    assert before == after == 2
