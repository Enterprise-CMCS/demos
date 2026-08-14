"""Live-PG harness for the deliverable-comment migration (private/public split).

Covers the loader (sql/20_app/50_comment.sql) and the held-back parity log
(sql/99_parity/44_comment_held.sql) against a hand-built, FK-free schema:

  * a CMS author routes to demos_app.private_comment (author-default route);
  * a state author routes to demos_app.public_comment;
  * a non-user-contact author (external evaluator: person row, no users row)
    is HELD from the public route, not loaded -- otherwise the public_comment
    -> users FK fails at the constraints phase (regression for the
    public-route author guard);
  * unloaded parent, unresolved author, and empty content are held back;
  * every held-back comment is logged with a specific reason, and
    loaded U held = all resolved (the completeness view stays empty).

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
LOADER = ROOT / "sql" / "20_app" / "50_comment.sql"
HELD = ROOT / "sql" / "99_parity" / "44_comment_held.sql"
COMPLETENESS = ROOT / "sql" / "99_parity" / "45_comment_completeness.sql"

DEL_LOADED = uuid.UUID(int=0xF0)
DEL_UNLOADED = uuid.UUID(int=0xF1)
CMS_USER = uuid.UUID(int=0xF2)
STATE_USER = uuid.UUID(int=0xF3)
NON_USER = uuid.UUID(int=0xF4)      # non-user-contact: person row, no users row

C_CMS = uuid.UUID(int=0x201)        # CMS author, loaded parent -> private_comment
C_STATE = uuid.UUID(int=0x202)      # state author, loaded parent -> public_comment
C_NONUSER = uuid.UUID(int=0x203)    # non-user-contact author -> held (regression)
C_NOPARENT = uuid.UUID(int=0x204)   # parent not loaded -> held
C_NOAUTHOR = uuid.UUID(int=0x205)   # unresolved author -> held
C_EMPTY = uuid.UUID(int=0x206)      # empty content -> held


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw, demos_app CASCADE")
    for schema in ("stg", "migration", "mysql_raw", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE TABLE stg.comment_resolved ("
        " legacy_id int, new_uuid uuid PRIMARY KEY, deliverable_id uuid,"
        " author_user_id uuid, author_person_type_id text, content text,"
        " origin_cd text, created_at timestamptz, updated_at timestamptz, source text)"
    )
    conn.execute(
        "INSERT INTO stg.comment_resolved "
        "(legacy_id, new_uuid, deliverable_id, author_user_id, author_person_type_id,"
        " content, origin_cd, created_at, updated_at, source) VALUES "
        "(1, %(cms)s,  %(dl)s, %(cu)s, 'demos-cms-user',    'cms note',   NULL, now(), now(), 'dlvrbl'),"
        "(2, %(st)s,   %(dl)s, %(su)s, 'demos-state-user',  'state note', NULL, now(), now(), 'dlvrbl'),"
        "(3, %(nu)s,   %(dl)s, %(xu)s, 'non-user-contact',  'ext note',   NULL, now(), now(), 'dlvrbl'),"
        "(4, %(np)s,   %(du)s, %(cu)s, 'demos-cms-user',    'no parent',  NULL, now(), now(), 'dlvrbl'),"
        "(5, %(na)s,   %(dl)s, NULL,   NULL,                'no author',  NULL, now(), now(), 'dlvrbl'),"
        "(6, %(em)s,   %(dl)s, %(cu)s, 'demos-cms-user',    '',           NULL, now(), now(), 'dlvrbl')",
        {
            "cms": C_CMS, "st": C_STATE, "nu": C_NONUSER,
            "np": C_NOPARENT, "na": C_NOAUTHOR, "em": C_EMPTY,
            "dl": DEL_LOADED, "du": DEL_UNLOADED,
            "cu": CMS_USER, "su": STATE_USER, "xu": NON_USER,
        },
    )
    conn.execute("CREATE TABLE demos_app.deliverable (id uuid PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.deliverable (id) VALUES (%s)", (DEL_LOADED,))
    conn.execute("CREATE TABLE demos_app.user_person_type_limit (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.user_person_type_limit (id) VALUES "
        "('demos-admin'), ('demos-cms-user'), ('demos-state-user')"
    )
    conn.execute("CREATE TABLE mysql_raw.crosswalk_comment_origin (legacy_cd text, demos_route text)")
    conn.execute(
        "CREATE TABLE demos_app.private_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " author_person_type_id text, content text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    conn.execute(
        "CREATE TABLE demos_app.public_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " content text, created_at timestamptz, updated_at timestamptz)"
    )
    _apply(conn, LOADER)
    _apply(conn, HELD)
    _apply(conn, COMPLETENESS)


def test_cms_author_routes_to_private(pg_db: psycopg.Connection) -> None:
    """A CMS author on a loaded deliverable lands in private_comment only."""
    _provision(pg_db)
    priv = pg_db.execute(
        "SELECT id, author_user_id FROM demos_app.private_comment"
    ).fetchall()
    assert priv == [(C_CMS, CMS_USER)]


def test_state_author_routes_to_public(pg_db: psycopg.Connection) -> None:
    """A state author on a loaded deliverable lands in public_comment."""
    _provision(pg_db)
    pub = dict(
        pg_db.execute(
            "SELECT id, author_user_id FROM demos_app.public_comment"
        ).fetchall()
    )
    assert pub.get(C_STATE) == STATE_USER


def test_non_user_contact_author_held_not_loaded(pg_db: psycopg.Connection) -> None:
    """Regression: a non-user-contact author (no users row) is held from the
    public route, never inserted, so the public_comment -> users FK holds."""
    _provision(pg_db)
    pub_ids = {r[0] for r in pg_db.execute("SELECT id FROM demos_app.public_comment").fetchall()}
    priv_ids = {r[0] for r in pg_db.execute("SELECT id FROM demos_app.private_comment").fetchall()}
    assert C_NONUSER not in pub_ids
    assert C_NONUSER not in priv_ids
    reason = pg_db.execute(
        "SELECT reason FROM migration._parity_comment_held WHERE comment_id = %s",
        (C_NONUSER,),
    ).fetchone()
    assert reason is not None
    assert "not an auth user" in reason[0]


def test_held_reasons_are_specific(pg_db: psycopg.Connection) -> None:
    """Every held-back comment is logged with its specific reason."""
    _provision(pg_db)
    held = dict(
        pg_db.execute(
            "SELECT comment_id, reason FROM migration._parity_comment_held"
        ).fetchall()
    )
    assert set(held) == {C_NONUSER, C_NOPARENT, C_NOAUTHOR, C_EMPTY}
    assert "not an auth user" in held[C_NONUSER]
    assert "parent deliverable not loaded" in held[C_NOPARENT]
    assert "author did not migrate" in held[C_NOAUTHOR]
    assert "empty comment content" in held[C_EMPTY]


def test_completeness_invariant_holds(pg_db: psycopg.Connection) -> None:
    """Loaded U held = all resolved, so the gating completeness view is empty."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._parity_comment_completeness") == 0


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision(pg_db)
    _apply(pg_db, LOADER)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.private_comment") == 1
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.public_comment") == 1


def test_comment_held_applies_before_completeness() -> None:
    """apply_dir runs sql/99_parity/*.sql in lexical order, and the completeness
    view reads migration._parity_comment_held. If the held file does not sort
    first, the completeness view is silently skipped and its gating check passes
    vacuously. Lock the apply order (pure test; no DB)."""
    ordered = sorted(p.name for p in (ROOT / "sql" / "99_parity").glob("*.sql"))
    held = next(n for n in ordered if n.endswith("_comment_held.sql"))
    completeness = next(n for n in ordered if n.endswith("_comment_completeness.sql"))
    assert ordered.index(held) < ordered.index(completeness), (
        "comment held view must be created before the completeness view that reads it"
    )


def test_loader_noop_when_stg_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op when stg.comment_resolved does not exist."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw, demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute(
        "CREATE TABLE demos_app.private_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " author_person_type_id text, content text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    conn.execute(
        "CREATE TABLE demos_app.public_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " content text, created_at timestamptz, updated_at timestamptz)"
    )
    _apply(conn, LOADER)  # must NOT raise
    assert _scalar(conn, "SELECT count(*) FROM demos_app.private_comment") == 0
    assert _scalar(conn, "SELECT count(*) FROM demos_app.public_comment") == 0
