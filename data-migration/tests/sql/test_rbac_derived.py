"""Live-PG harness for the user-RBAC derive layer (person_state + system_role_assignment).

Exercises the real stg resolvers (sql/10_stg/23,24) and the 23_app_derived
loaders against a hand-built, FK-free schema, asserting the row-selection
rules the spec fixes:

  * CMS users + admins fan out to EVERY demos_app.state row;
  * non-CMS users get only their explicit user_authrzd_state_acs states;
  * the 'XX' all-states sentinel on a non-CMS user is held (flagged, not
    granted), as is an unmapped state code;
  * a system_role_assignment row is emitted only when the user's derived
    person_type matches the System role's required person_type (so an
    admin who also holds State User gets only the Admin row).

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

PERSON_STATE_RESOLVED = STG_DIR / "23_person_state_resolved.sql"
SRA_RESOLVED = STG_DIR / "24_system_role_assignment_resolved.sql"
PERSON_STATE_LOAD = DERIVED_DIR / "10_person_state.sql"
SRA_LOAD = DERIVED_DIR / "20_system_role_assignment.sql"
SYSTEM_ROLE_CROSSWALK = CROSSWALK_DIR / "44_system_role.sql"

# Deterministic person UUIDs: A=CMS, B=state, C=state(XX-only), D=admin.
UID = {k: str(uuid.UUID(int=i)) for i, k in enumerate(("A", "B", "C", "D"), start=1)}
LEGACY = {"A": 1, "B": 2, "C": 3, "D": 4}


def _provision(conn: Any) -> None:
    """Build a minimal, FK-free source + target the resolvers/loaders read."""
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration, demos_app CASCADE")
    for schema in ("stg", "mysql_raw", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # --- source (mysql_raw) ---
    conn.execute(
        "CREATE TABLE mysql_raw.user_role_asgnmt (user_id int, role_cd int)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.user_authrzd_state_acs "
        "(user_id int, geo_ansi_state_cd text)"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_state (legacy_cd text, demos_text_id text)"
    )
    conn.execute("CREATE TABLE mysql_raw.role_rfrnc (role_cd int)")
    conn.execute("INSERT INTO mysql_raw.role_rfrnc VALUES (1), (4)")
    conn.execute(SYSTEM_ROLE_CROSSWALK.read_text(encoding="utf-8"))
    # 44_system_role.sql is now DDL-only (production load is the crosswalks
    # phase CSV loader); insert the two System rows directly for the test.
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_system_role "
        "(legacy_role_cd, legacy_name, role_id, grant_level_id, person_type_id, notes) VALUES "
        "(1, 'Internal Administrator', 'Admin User', 'System', 'demos-admin', "
        "'system-level; role_person_type allows only demos-admin'), "
        "(4, 'State User', 'State User', 'System', 'demos-state-user', "
        "'system-level; role_person_type allows only demos-state-user')"
    )

    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_state (legacy_cd, demos_text_id) VALUES "
        "('CA','CA'), ('NY','NY'), ('TX','TX')"
    )
    conn.execute(
        "INSERT INTO mysql_raw.user_authrzd_state_acs (user_id, geo_ansi_state_cd) VALUES "
        f"({LEGACY['A']},'XX'),"  # CMS: ignored, gets all states regardless
        f"({LEGACY['B']},'CA'), ({LEGACY['B']},'NY'), ({LEGACY['B']},'ZZ'),"  # ZZ unmapped
        f"({LEGACY['C']},'XX'),"  # state user, all-states sentinel -> held
        f"({LEGACY['D']},'XX')"  # admin: ignored, gets all states regardless
    )
    conn.execute(
        "INSERT INTO mysql_raw.user_role_asgnmt (user_id, role_cd) VALUES "
        f"({LEGACY['A']}, 2),"  # CMS PO: demonstration role, not in system crosswalk
        f"({LEGACY['B']}, 4),"  # State User
        f"({LEGACY['D']}, 1), ({LEGACY['D']}, 4)"  # admin also holds State User
    )

    # --- id map + stg.users_resolved stand-in (real one needs the role crosswalk) ---
    conn.execute(
        "CREATE TABLE migration._id_map_users (legacy_int_id bigint, new_uuid uuid)"
    )
    conn.execute(
        "CREATE TABLE stg.users_resolved "
        "(new_uuid uuid, person_type_id text, email text)"
    )
    ptype = {
        "A": "demos-cms-user",
        "B": "demos-state-user",
        "C": "demos-state-user",
        "D": "demos-admin",
    }
    for k, u in UID.items():
        conn.execute(
            "INSERT INTO migration._id_map_users (legacy_int_id, new_uuid) VALUES (%s, %s)",
            (LEGACY[k], u),
        )
        conn.execute(
            "INSERT INTO stg.users_resolved (new_uuid, person_type_id, email) "
            "VALUES (%s, %s, %s)",
            (u, ptype[k], f"{k.lower()}@example.gov"),
        )

    # --- target (demos_app), FK-free ---
    conn.execute(
        "CREATE TABLE demos_app.person "
        "(id uuid, person_type_id text, updated_at timestamptz)"
    )
    conn.execute("CREATE TABLE demos_app.state (id text)")
    conn.execute(
        "CREATE TABLE demos_app.person_state "
        "(person_id uuid, state_id text, PRIMARY KEY (person_id, state_id))"
    )
    conn.execute(
        "CREATE TABLE demos_app.system_role_assignment "
        "(person_id uuid, role_id text, person_type_id text, grant_level_id text, "
        " PRIMARY KEY (person_id, role_id))"
    )
    conn.execute("INSERT INTO demos_app.state (id) VALUES ('CA'), ('NY'), ('TX')")
    for k, u in UID.items():
        conn.execute(
            "INSERT INTO demos_app.person (id, person_type_id, updated_at) "
            "VALUES (%s, %s, now())",
            (u, ptype[k]),
        )


def _apply(conn: Any, *files: Path) -> None:
    for f in files:
        conn.execute(f.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    """Return the first column of the single result row as an int."""
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _run_all(conn: Any) -> None:
    _apply(conn, PERSON_STATE_RESOLVED, SRA_RESOLVED, PERSON_STATE_LOAD, SRA_LOAD)


def test_person_state_cms_and_admin_fan_out_to_all_states(pg_db: psycopg.Connection) -> None:
    """CMS user (A) and admin (D) each get one person_state row per state."""
    _provision(pg_db)
    _run_all(pg_db)
    for k in ("A", "D"):
        states = {
            r[0]
            for r in pg_db.execute(
                "SELECT state_id FROM demos_app.person_state WHERE person_id = %s",
                (UID[k],),
            ).fetchall()
        }
        assert states == {"CA", "NY", "TX"}, f"person {k}: {states}"


def test_person_state_state_user_gets_only_explicit_states(pg_db: psycopg.Connection) -> None:
    """State user (B) gets only mapped explicit states; XX (C) gets none."""
    _provision(pg_db)
    _run_all(pg_db)
    b_states = {
        r[0]
        for r in pg_db.execute(
            "SELECT state_id FROM demos_app.person_state WHERE person_id = %s",
            (UID["B"],),
        ).fetchall()
    }
    assert b_states == {"CA", "NY"}  # ZZ is unmapped -> not granted

    c_count = _scalar(
        pg_db,
        "SELECT count(*) FROM demos_app.person_state WHERE person_id = %s",
        (UID["C"],),
    )
    assert c_count == 0


def test_person_state_flags_hold_xx_and_unmapped(pg_db: psycopg.Connection) -> None:
    """The XX state-user (C) and the unmapped code (B/ZZ) are flagged, not granted."""
    _provision(pg_db)
    _run_all(pg_db)
    flags = {
        (r[0], r[1])
        for r in pg_db.execute(
            "SELECT person_id, reason FROM stg.person_state_flags"
        ).fetchall()
    }
    assert (uuid.UUID(UID["C"]), "state_user_all_states_XX") in flags
    assert (uuid.UUID(UID["B"]), "uasa_state_code_unmapped") in flags
    # CMS/admin XX rows are never flagged.
    flagged_people = {r[0] for r in flags}
    assert uuid.UUID(UID["A"]) not in flagged_people
    assert uuid.UUID(UID["D"]) not in flagged_people


def test_system_role_assignment_person_type_match(pg_db: psycopg.Connection) -> None:
    """Admin (D) gets only the Admin row; state user (B) gets State User; CMS PO drops."""
    _provision(pg_db)
    _run_all(pg_db)
    rows = {
        (r[0], r[1])
        for r in pg_db.execute(
            "SELECT person_id, role_id FROM demos_app.system_role_assignment"
        ).fetchall()
    }
    assert rows == {
        (uuid.UUID(UID["D"]), "Admin User"),
        (uuid.UUID(UID["B"]), "State User"),
    }


def test_loaders_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loaders does not change the row counts."""
    _provision(pg_db)
    _run_all(pg_db)

    def counts() -> tuple[int, int]:
        ps = _scalar(pg_db, "SELECT count(*) FROM demos_app.person_state")
        sra = _scalar(pg_db, "SELECT count(*) FROM demos_app.system_role_assignment")
        return ps, sra

    first = counts()
    _apply(pg_db, PERSON_STATE_LOAD, SRA_LOAD)
    assert counts() == first
    assert first == (8, 2)  # 3 (A) + 3 (D) + 2 (B) states; 2 system roles
