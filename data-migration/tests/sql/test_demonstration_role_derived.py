"""Live-PG harness for the demonstration-level role derive layer.

Exercises the real stg resolver (sql/10_stg/25), the 23_app_derived loaders
(30 demonstration_role_assignment, 40 primary_demonstration_role_assignment),
and the 99_parity provenance views (sql/99_parity/24) against a hand-built,
FK-free schema, asserting the row-selection rules the spec fixes:

  * each populated per-role user_id COLUMN on a kept demonstration becomes one
    (person, demonstration, role) tuple, role fixed by the column;
  * a person who fills two columns folding to different roles on one demo gets
    one row per role (PO + Policy TD);
  * the bkup_proj_ofcr_user_id = 0 sentinel is dropped (treat_zero_as_null);
  * a demos-state-user sitting in a CMS column (Project Officer) is dropped and
    flagged person_type_not_permitted (role_person_type leg);
  * a state user assigned to an out-of-state demonstration is dropped and
    flagged person_state_missing_for_state (person_state leg);
  * only the is_primary Project Officer feeds primary_demonstration_role_assignment;
  * the integrity view is empty and the loaders are idempotent.

Runs against a throwaway Postgres (``PG_TEST_DSN``); self-skips without it.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
STG_DIR = ROOT / "sql" / "10_stg"
DERIVED_DIR = ROOT / "sql" / "23_app_derived"
CROSSWALK_DIR = ROOT / "sql" / "04_crosswalks"
PARITY_DIR = ROOT / "sql" / "99_parity"

DRA_RESOLVED = STG_DIR / "25_demonstration_role_assignment_resolved.sql"
DRA_LOAD = DERIVED_DIR / "30_demonstration_role_assignment.sql"
PRIMARY_LOAD = DERIVED_DIR / "40_primary_demonstration_role_assignment.sql"
DRA_CROSSWALK = CROSSWALK_DIR / "46_demonstration_role.sql"
DRA_PROVENANCE = PARITY_DIR / "24_demonstration_role_assignment_provenance.sql"

PO = "Project Officer"
POLICY_TD = "Policy Technical Director"
ME_TD = "Monitoring & Evaluation Technical Director"
ANALYST = "DDME Analyst"
STATE_POC = "State Point of Contact"

# Persons: legacy id -> (uuid, person_type). 101/102 CMS, 103/104 state.
PTYPE = {
    101: "demos-cms-user",
    102: "demos-cms-user",
    103: "demos-state-user",
    104: "demos-state-user",
}
PUID = {legacy: uuid.UUID(int=legacy) for legacy in PTYPE}
# Demonstrations: legacy id -> (uuid, state).
DSTATE = {1: "CA", 2: "CA", 3: "NY"}
DUID = {legacy: uuid.UUID(int=200 + legacy) for legacy in DSTATE}


def _provision(conn: Any) -> None:
    """Build a minimal, FK-free source + target the resolver/loaders read."""
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration, demos_app CASCADE")
    for schema in ("stg", "mysql_raw", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # --- source (mysql_raw) ---
    role_cols = (
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
    cols_ddl = ", ".join(f"{c} int" for c in role_cols)
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo "
        f"(mdcd_demo_id int, geo_ansi_state_cd text, {cols_ddl})"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_state (legacy_cd text, demos_text_id text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_state (legacy_cd, demos_text_id) VALUES "
        "('CA','CA'), ('NY','NY')"
    )
    conn.execute(DRA_CROSSWALK.read_text(encoding="utf-8"))
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_demonstration_role "
        "(source_table, source_column, role_id, grant_level_id, is_primary, treat_zero_as_null) VALUES "
        f"('mdcd_demo','proj_ofcr_user_id','{PO}','Demonstration',true,false),"
        f"('mdcd_demo','bkup_proj_ofcr_user_id','{PO}','Demonstration',false,true),"
        f"('mdcd_demo','tchncl_drctr_user_id','{POLICY_TD}','Demonstration',false,false),"
        f"('mdcd_demo','anlyst_user_id','{ANALYST}','Demonstration',false,false),"
        f"('mdcd_demo','state_prmry_poc_user_id','{STATE_POC}','Demonstration',false,false)"
    )

    # D1 (CA): A=PO + Policy TD (same person, two columns), B=analyst,
    #          S=state POC, bkup=0 (dropped). D2 (CA): X(state user)=PO ->
    #          person_type drop. D3 (NY): S=state POC -> person_state drop.
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, geo_ansi_state_cd, proj_ofcr_user_id, tchncl_drctr_user_id, "
        " anlyst_user_id, state_prmry_poc_user_id, bkup_proj_ofcr_user_id) "
        "VALUES (1, 'CA', 101, 101, 102, 103, 0)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, geo_ansi_state_cd, proj_ofcr_user_id) VALUES (2, 'CA', 104)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, geo_ansi_state_cd, state_prmry_poc_user_id) VALUES (3, 'NY', 103)"
    )

    # --- stg + migration plumbing the resolver joins ---
    conn.execute("CREATE TABLE stg._valid_demo_ids (demo_id int)")
    conn.execute("INSERT INTO stg._valid_demo_ids (demo_id) VALUES (1), (2), (3)")
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_users (legacy_int_id bigint, new_uuid uuid)"
    )
    # The 24 flags view LEFT JOINs the pending-demo id-map to resolve
    # legacy_demonstration_id; empty here (all demos are in _id_map_mdcd_demo).
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_pendg_demo (legacy_int_id bigint, new_uuid uuid)"
    )
    conn.execute(
        "CREATE TABLE stg.users_resolved "
        "(new_uuid uuid, person_type_id text, email text)"
    )
    for legacy, u in DUID.items():
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) VALUES (%s, %s)",
            (legacy, u),
        )
    for legacy, u in PUID.items():
        conn.execute(
            "INSERT INTO migration._id_map_users (legacy_int_id, new_uuid) VALUES (%s, %s)",
            (legacy, u),
        )
        conn.execute(
            "INSERT INTO stg.users_resolved (new_uuid, person_type_id, email) "
            "VALUES (%s, %s, %s)",
            (u, PTYPE[legacy], f"u{legacy}@example.gov"),
        )

    # --- target (demos_app), FK-free but with the PKs the loaders need ---
    conn.execute(
        "CREATE TABLE demos_app.person "
        "(id uuid, person_type_id text, updated_at timestamptz)"
    )
    conn.execute("CREATE TABLE demos_app.state (id text)")
    conn.execute(
        "CREATE TABLE demos_app.person_state "
        "(person_id uuid, state_id text, PRIMARY KEY (person_id, state_id))"
    )
    conn.execute("CREATE TABLE demos_app.role (id text, grant_level_id text)")
    conn.execute(
        "CREATE TABLE demos_app.role_person_type (role_id text, person_type_id text)"
    )
    conn.execute(
        "CREATE TABLE demos_app.demonstration (id uuid, state_id text)"
    )
    conn.execute(
        "CREATE TABLE demos_app.demonstration_role_assignment "
        "(person_id uuid, demonstration_id uuid, role_id text, state_id text, "
        " person_type_id text, grant_level_id text, "
        " PRIMARY KEY (person_id, demonstration_id, role_id))"
    )
    conn.execute(
        "CREATE TABLE demos_app.primary_demonstration_role_assignment "
        "(person_id uuid, demonstration_id uuid, role_id text, "
        " PRIMARY KEY (demonstration_id, role_id))"
    )

    conn.execute("INSERT INTO demos_app.state (id) VALUES ('CA'), ('NY')")
    for legacy, u in PUID.items():
        conn.execute(
            "INSERT INTO demos_app.person (id, person_type_id, updated_at) "
            "VALUES (%s, %s, now())",
            (u, PTYPE[legacy]),
        )
    # person_state: CMS users authorized for all states; state users CA only.
    auth = {101: ("CA", "NY"), 102: ("CA", "NY"), 103: ("CA",), 104: ("CA",)}
    for legacy, states in auth.items():
        for s in states:
            conn.execute(
                "INSERT INTO demos_app.person_state (person_id, state_id) VALUES (%s, %s)",
                (PUID[legacy], s),
            )
    for rid in (PO, POLICY_TD, ME_TD, ANALYST, STATE_POC):
        conn.execute(
            "INSERT INTO demos_app.role (id, grant_level_id) VALUES (%s, 'Demonstration')",
            (rid,),
        )
    rpt = {
        PO: ("demos-admin", "demos-cms-user"),
        POLICY_TD: ("demos-admin", "demos-cms-user"),
        ME_TD: ("demos-admin", "demos-cms-user"),
        ANALYST: ("demos-admin", "demos-cms-user"),
        STATE_POC: ("demos-state-user",),
    }
    for rid, ptypes in rpt.items():
        for pt in ptypes:
            conn.execute(
                "INSERT INTO demos_app.role_person_type (role_id, person_type_id) "
                "VALUES (%s, %s)",
                (rid, pt),
            )
    for legacy, u in DUID.items():
        conn.execute(
            "INSERT INTO demos_app.demonstration (id, state_id) VALUES (%s, %s)",
            (u, DSTATE[legacy]),
        )


def _apply(conn: Any, *files: Path) -> None:
    for f in files:
        conn.execute(f.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _run_all(conn: Any) -> None:
    _apply(conn, DRA_RESOLVED, DRA_LOAD, PRIMARY_LOAD, DRA_PROVENANCE)


def _assignments(conn: Any) -> set[tuple[uuid.UUID, uuid.UUID, str]]:
    return {
        (r[0], r[1], r[2])
        for r in conn.execute(
            "SELECT person_id, demonstration_id, role_id "
            "FROM demos_app.demonstration_role_assignment"
        ).fetchall()
    }


def test_columns_become_role_tuples(pg_db: psycopg.Connection) -> None:
    """Each populated column on D1 lands as its mapped role; one row per role."""
    _provision(pg_db)
    _run_all(pg_db)
    assert _assignments(pg_db) == {
        (PUID[101], DUID[1], PO),
        (PUID[101], DUID[1], POLICY_TD),
        (PUID[102], DUID[1], ANALYST),
        (PUID[103], DUID[1], STATE_POC),
    }


def test_zero_backup_dropped(pg_db: psycopg.Connection) -> None:
    """bkup_proj_ofcr_user_id = 0 is the treat_zero_as_null sentinel: no second PO."""
    _provision(pg_db)
    _run_all(pg_db)
    po_on_d1 = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.demonstration_role_assignment "
        "WHERE demonstration_id = %s AND role_id = %s",
        (DUID[1], PO),
    )
    assert po_on_d1 == 1


def test_person_type_mismatch_dropped_and_flagged(pg_db: psycopg.Connection) -> None:
    """A state user in the Project Officer column (D2) is dropped + flagged."""
    _provision(pg_db)
    _run_all(pg_db)
    assert (PUID[104], DUID[2], PO) not in _assignments(pg_db)
    flags = {
        (r[0], r[1], r[2], r[3])
        for r in pg_db.execute(
            "SELECT person_id, demonstration_id, role_id, reason "
            "FROM migration._parity_demonstration_role_assignment_flags"
        ).fetchall()
    }
    assert (PUID[104], DUID[2], PO, "person_type_not_permitted") in flags


def test_out_of_state_dropped_and_flagged(pg_db: psycopg.Connection) -> None:
    """A CA-only state user as POC on a NY demonstration (D3) is dropped + flagged."""
    _provision(pg_db)
    _run_all(pg_db)
    assert (PUID[103], DUID[3], STATE_POC) not in _assignments(pg_db)
    flags = {
        (r[0], r[1], r[2], r[3])
        for r in pg_db.execute(
            "SELECT person_id, demonstration_id, role_id, reason "
            "FROM migration._parity_demonstration_role_assignment_flags"
        ).fetchall()
    }
    assert (PUID[103], DUID[3], STATE_POC, "person_state_missing_for_state") in flags


def test_primary_project_officer_loaded(pg_db: psycopg.Connection) -> None:
    """Only the is_primary Project Officer feeds primary_demonstration_role_assignment."""
    _provision(pg_db)
    _run_all(pg_db)
    rows = {
        (r[0], r[1], r[2])
        for r in pg_db.execute(
            "SELECT person_id, demonstration_id, role_id "
            "FROM demos_app.primary_demonstration_role_assignment"
        ).fetchall()
    }
    assert rows == {(PUID[101], DUID[1], PO)}


def test_integrity_view_empty(pg_db: psycopg.Connection) -> None:
    """Every loaded row resolves its provenance: the integrity view is empty."""
    _provision(pg_db)
    _run_all(pg_db)
    n = _scalar(
        pg_db,
        "SELECT count(*) FROM migration._parity_demonstration_role_assignment_integrity",
    )
    assert n == 0


def test_loaders_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loaders does not change the row counts."""
    _provision(pg_db)
    _run_all(pg_db)

    def counts() -> tuple[int, int]:
        dra = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration_role_assignment")
        primary = _scalar(
            pg_db, "SELECT count(*) FROM demos_app.primary_demonstration_role_assignment"
        )
        return dra, primary

    first = counts()
    _apply(pg_db, DRA_LOAD, PRIMARY_LOAD)
    assert counts() == first
    assert first == (4, 1)
