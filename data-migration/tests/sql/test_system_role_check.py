"""Live-PG harness for the System-role crosswalk check (45_system_role_check.sql).

The DO block must: skip when crosswalk_system_role is absent (standalone dev),
pass when the two System rows validate against the DEMOS seeds, and hard-fail
on a missing System code, a (role_id, grant_level_id) absent from demos_app.role,
a non-System / unknown grant level, or a (role_id, person_type_id) the
role_person_type seed does not permit. Runs the real SQL against a throwaway
Postgres (``PG_TEST_DSN``); self-skips without it.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
CROSSWALK_DIR = ROOT / "sql" / "04_crosswalks"
SYSTEM_ROLE = CROSSWALK_DIR / "44_system_role.sql"
SYSTEM_ROLE_CHECK = CROSSWALK_DIR / "45_system_role_check.sql"


def _seed_demos(conn: Any) -> None:
    """Minimal demos_app seeds the check validates the crosswalk against."""
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.role (id text, grant_level_id text)")
    conn.execute("CREATE TABLE demos_app.system_grant_level_limit (id text)")
    conn.execute("CREATE TABLE demos_app.role_person_type (role_id text, person_type_id text)")
    conn.execute(
        "INSERT INTO demos_app.role VALUES "
        "('Admin User', 'System'), ('State User', 'System')"
    )
    conn.execute("INSERT INTO demos_app.system_grant_level_limit VALUES ('System')")
    conn.execute(
        "INSERT INTO demos_app.role_person_type VALUES "
        "('Admin User', 'demos-admin'), ('State User', 'demos-state-user')"
    )


def _seed_source(conn: Any, role_cds: tuple[int, ...] = (1, 4)) -> None:
    """mysql_raw with role_rfrnc + the crosswalk_system_role table.

    Applies 44_system_role.sql for the DDL (now CREATE TABLE only -- the
    production load path is the crosswalks phase CSV loader), then inserts
    the two System rows directly so the check has data to validate.
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE TABLE mysql_raw.role_rfrnc (role_cd int, role_name text)")
    for cd in role_cds:
        conn.execute("INSERT INTO mysql_raw.role_rfrnc (role_cd) VALUES (%s)", (cd,))
    conn.execute(SYSTEM_ROLE.read_text(encoding="utf-8"))
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_system_role "
        "(legacy_role_cd, legacy_name, role_id, grant_level_id, person_type_id, notes) VALUES "
        "(1, 'Internal Administrator', 'Admin User', 'System', 'demos-admin', "
        "'system-level; role_person_type allows only demos-admin'), "
        "(4, 'State User', 'State User', 'System', 'demos-state-user', "
        "'system-level; role_person_type allows only demos-state-user')"
    )


def _run_check(conn: Any) -> None:
    conn.execute(SYSTEM_ROLE_CHECK.read_text(encoding="utf-8"))


def test_absent_crosswalk_skips(pg_db: psycopg.Connection) -> None:
    """No crosswalk_system_role table -> the check no-ops."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    _run_check(pg_db)


def test_complete_mapping_passes(pg_db: psycopg.Connection) -> None:
    """The two System rows validate against the DEMOS seeds."""
    _seed_demos(pg_db)
    _seed_source(pg_db)
    _run_check(pg_db)


def test_missing_system_code_raises(pg_db: psycopg.Connection) -> None:
    """A System code in role_rfrnc with no crosswalk row hard-fails."""
    import psycopg

    _seed_demos(pg_db)
    _seed_source(pg_db)
    # role_rfrnc now also has code 4, but drop its crosswalk row to create a gap.
    pg_db.execute("DELETE FROM mysql_raw.crosswalk_system_role WHERE legacy_role_cd = 4")
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)


def test_role_pair_not_in_role_raises(pg_db: psycopg.Connection) -> None:
    """A (role_id, grant_level_id) absent from demos_app.role hard-fails."""
    import psycopg

    _seed_demos(pg_db)
    _seed_source(pg_db)
    pg_db.execute("DELETE FROM demos_app.role WHERE id = 'State User'")
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)


def test_bad_grant_level_raises(pg_db: psycopg.Connection) -> None:
    """A grant level absent from system_grant_level_limit hard-fails."""
    import psycopg

    _seed_demos(pg_db)
    _seed_source(pg_db)
    pg_db.execute("DELETE FROM demos_app.system_grant_level_limit WHERE id = 'System'")
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)


def test_person_type_not_permitted_raises(pg_db: psycopg.Connection) -> None:
    """A (role_id, person_type_id) the role_person_type seed forbids hard-fails."""
    import psycopg

    _seed_demos(pg_db)
    _seed_source(pg_db)
    pg_db.execute(
        "DELETE FROM demos_app.role_person_type "
        "WHERE role_id = 'State User' AND person_type_id = 'demos-state-user'"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run_check(pg_db)
