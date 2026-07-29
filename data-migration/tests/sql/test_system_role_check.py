"""Live-PG harness for the System-role crosswalk check (45_system_role_check.sql).

The DO block must: skip when crosswalk_system_role is absent (standalone dev),
pass when the person_type rows validate against the DEMOS seeds, and hard-fail
on a missing System-grant (role, person_type) pairing, a (role_id,
grant_level_id) absent from demos_app.role, a non-System / unknown grant level,
or a (role_id, person_type_id) the role_person_type seed does not permit. Runs
the real SQL against a throwaway Postgres (``PG_TEST_DSN``); self-skips without
it.
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


def _seed_source(conn: Any) -> None:
    """mysql_raw with the crosswalk_system_role table (person_type-keyed).

    Applies 44_system_role.sql for the DDL (now CREATE TABLE only -- the
    production load path is the crosswalks phase CSV loader), then inserts
    the person_type rows directly so the check has data to validate.
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute(SYSTEM_ROLE.read_text(encoding="utf-8"))
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_system_role "
        "(person_type_id, role_id, grant_level_id, notes) VALUES "
        "('demos-admin', 'Admin User', 'System', "
        "'system-level; role_person_type pairs Admin User with demos-admin'), "
        "('demos-state-user', 'State User', 'System', "
        "'system-level; role_person_type pairs State User with demos-state-user')"
    )


def _run_check(conn: Any) -> None:
    conn.execute(SYSTEM_ROLE_CHECK.read_text(encoding="utf-8"))


def test_absent_crosswalk_skips(pg_db: psycopg.Connection) -> None:
    """No crosswalk_system_role table -> the check no-ops."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    _run_check(pg_db)


def test_complete_mapping_passes(pg_db: psycopg.Connection) -> None:
    """The person_type rows validate against the DEMOS seeds."""
    _seed_demos(pg_db)
    _seed_source(pg_db)
    _run_check(pg_db)


def test_missing_person_type_mapping_raises(pg_db: psycopg.Connection) -> None:
    """A System-grant (role, person_type) pairing with no crosswalk row hard-fails."""
    import psycopg

    _seed_demos(pg_db)
    _seed_source(pg_db)
    # demos permits (State User, demos-state-user) at System grant; drop its
    # crosswalk row to create a completeness gap.
    pg_db.execute(
        "DELETE FROM mysql_raw.crosswalk_system_role WHERE person_type_id = 'demos-state-user'"
    )
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
