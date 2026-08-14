"""Live-PG harness for the migrated-users loader against the real Tier-C schema.

The DEMOS 20260623222056_add_migrated_user_features migration shipped
``is_migrated_from_pmda`` + ``has_logged_in`` (both NOT NULL), made
``cognito_subject``/``username`` nullable, and added
``check_external_fields_exist_for_logged_in_users`` (when ``has_logged_in`` is
false, both ``cognito_subject`` and ``username`` must be NULL). There is no
``migrated_user`` column. This harness stands up that exact shape -- with the
CHECK constraints KEPT (the real build drops only FKs) -- and asserts the
loader:

  * loads one auth account per migrated person whose type is in
    user_person_type_limit (non-user-contact is person-only, excluded);
  * sets username=NULL, cognito_subject=NULL, is_migrated_from_pmda=TRUE,
    has_logged_in=FALSE so both CHECK constraints hold at insert time;
  * is idempotent (ON CONFLICT (id) DO NOTHING);
  * stays inert (skips) when the Tier-C column is absent or person is unloaded.

Runs against a throwaway Postgres (``PG_TEST_DSN`` via ``pg_db``); self-skips
without it.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
LOADER = ROOT / "sql" / "20_app" / "20_users.sql"

U_CMS = uuid.UUID(int=0xA1)      # demos-cms-user -> auth account
U_ADMIN = uuid.UUID(int=0xA2)    # demos-admin    -> auth account
U_CONTACT = uuid.UUID(int=0xA3)  # non-user-contact -> person only, no users row

_USERS_TIER_C = """
CREATE TABLE demos_app.users (
  id uuid PRIMARY KEY,
  person_type_id text NOT NULL,
  cognito_subject uuid,
  username text,
  is_migrated_from_pmda boolean NOT NULL,
  has_logged_in boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL,
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT check_external_fields_exist_for_logged_in_users CHECK (
    (has_logged_in AND (cognito_subject IS NOT NULL AND username IS NOT NULL))
    OR (NOT has_logged_in AND (cognito_subject IS NULL AND username IS NULL))
  ),
  CONSTRAINT check_all_regular_users_are_logged_in CHECK (
    (NOT is_migrated_from_pmda AND has_logged_in) OR (is_migrated_from_pmda)
  )
)
"""

_USERS_PRE_TIER_C = """
CREATE TABLE demos_app.users (
  id uuid PRIMARY KEY,
  person_type_id text NOT NULL,
  cognito_subject uuid NOT NULL,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL
)
"""


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _provision(conn: Any, *, with_tier_c: bool = True, load_person: bool = True) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    conn.execute("CREATE TABLE demos_app.user_person_type_limit (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.user_person_type_limit (id) VALUES "
        "('demos-admin'), ('demos-cms-user'), ('demos-state-user')"
    )

    conn.execute(
        "CREATE TABLE demos_app.person ("
        " id uuid PRIMARY KEY, person_type_id text NOT NULL,"
        " email text, first_name text, last_name text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    if load_person:
        conn.execute(
            "INSERT INTO demos_app.person (id, person_type_id, email) VALUES "
            "(%(cms)s, 'demos-cms-user', 'c@x'),"
            "(%(adm)s, 'demos-admin', 'a@x'),"
            "(%(con)s, 'non-user-contact', 'n@x')",
            {"cms": U_CMS, "adm": U_ADMIN, "con": U_CONTACT},
        )

    conn.execute(_USERS_TIER_C if with_tier_c else _USERS_PRE_TIER_C)

    conn.execute(
        "CREATE TABLE stg.users_resolved ("
        " new_uuid uuid PRIMARY KEY, person_type_id text,"
        " email text, first_name text, last_name text,"
        " username text, eua_id text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    conn.execute(
        "INSERT INTO stg.users_resolved "
        "(new_uuid, person_type_id, username, created_at, updated_at) VALUES "
        "(%(cms)s, 'demos-cms-user', 'cmsuser', now(), now()),"
        "(%(adm)s, 'demos-admin', 'adminuser', now(), now()),"
        "(%(con)s, 'non-user-contact', 'contactuser', now(), now())",
        {"cms": U_CMS, "adm": U_ADMIN, "con": U_CONTACT},
    )


def test_loads_auth_users_only(pg_db: psycopg.Connection) -> None:
    """Exactly the demos-cms-user and demos-admin accounts load; contact is excluded."""
    _provision(pg_db)
    _apply(pg_db, LOADER)
    ids = {r[0] for r in pg_db.execute("SELECT id FROM demos_app.users").fetchall()}
    assert ids == {U_CMS, U_ADMIN}


def test_loaded_users_satisfy_tier_c_invariants(pg_db: psycopg.Connection) -> None:
    """Loaded rows carry NULL username/cognito, is_migrated=TRUE, has_logged_in=FALSE."""
    _provision(pg_db)
    _apply(pg_db, LOADER)
    rows = pg_db.execute(
        "SELECT username, cognito_subject, is_migrated_from_pmda, has_logged_in "
        "FROM demos_app.users"
    ).fetchall()
    assert len(rows) == 2
    for username, cognito, migrated, logged_in in rows:
        assert username is None
        assert cognito is None
        assert migrated is True
        assert logged_in is False


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new (ON CONFLICT DO NOTHING)."""
    _provision(pg_db)
    _apply(pg_db, LOADER)
    _apply(pg_db, LOADER)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.users") == 2


def test_guard_skips_when_tier_c_column_absent(pg_db: psycopg.Connection) -> None:
    """Guard: no rows load (clean no-op) when is_migrated_from_pmda is absent."""
    _provision(pg_db, with_tier_c=False)
    _apply(pg_db, LOADER)  # must NOT raise
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.users") == 0


def test_guard_skips_when_person_not_loaded(pg_db: psycopg.Connection) -> None:
    """Guard: no rows load when demos_app.person is empty (composite FK parent)."""
    _provision(pg_db, load_person=False)
    _apply(pg_db, LOADER)  # must NOT raise
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.users") == 0
