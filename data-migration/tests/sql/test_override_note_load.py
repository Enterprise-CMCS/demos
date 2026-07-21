"""Live-PG harness for the budget-neutrality override-note migration.

Covers the four Part-4 layers against a hand-built, FK-free schema:

  * populate (sql/10_stg/34_*): only valid deliverables with a NON-EMPTY
    override comment mint an override-note UUID;
  * stg view (sql/10_stg/35_*): author resolves updtd_user_id first then
    creatd_user_id, and the uuid + person_type are taken as a pair;
  * loader (sql/20_app/51_*): a CMS-authored note on a loaded deliverable loads
    into demos_app.private_comment; non-CMS author, unresolved author, unloaded
    parent, or empty content are held back;
  * parity (sql/99_parity/48_*): held notes are logged per-row with a reason;
    the completeness view stays empty (loaded U held = all resolved).

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
POPULATE = ROOT / "sql" / "10_stg" / "34_populate_id_map_override_note.sql"
STG_VIEW = ROOT / "sql" / "10_stg" / "35_override_note_resolved.sql"
LOADER = ROOT / "sql" / "20_app" / "51_override_note.sql"
PARITY = ROOT / "sql" / "99_parity" / "48_override_note.sql"

# loader fixture ids
DEL_LOADED = uuid.UUID(int=0xF0)
DEL_UNLOADED = uuid.UUID(int=0xF1)
CMS_USER = uuid.UUID(int=0xF2)
STATE_USER = uuid.UUID(int=0xF3)
N_OK = uuid.UUID(int=0x101)       # CMS author, parent loaded -> loads
N_NONCMS = uuid.UUID(int=0x102)   # state author -> held
N_NOPARENT = uuid.UUID(int=0x103) # parent not loaded -> held
N_NOAUTHOR = uuid.UUID(int=0x104) # unresolved author -> held
N_EMPTY = uuid.UUID(int=0x105)    # empty content -> held


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


# --------------------------------------------------------------------------- #
# populate (34)                                                               #
# --------------------------------------------------------------------------- #
def _provision_populate(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw CASCADE")
    for schema in ("stg", "migration", "mysql_raw"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl ("
        " mdcd_dlvrbl_id bigint, bdgt_ntrlty_ovrrd_cmt_txt text,"
        " creatd_user_id bigint, updtd_user_id bigint,"
        " creatd_dt timestamptz, updtd_dt timestamptz)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_id, bdgt_ntrlty_ovrrd_cmt_txt) VALUES "
        "(1, 'override reason A'),"   # valid + non-empty -> mints
        "(2, '   '),"                  # whitespace only -> no mint
        "(3, NULL),"                   # null -> no mint
        "(4, 'override reason B'),"    # non-empty but parent NOT in deliverable id map -> no mint
        "(5, 'override reason C')"     # valid + non-empty -> mints
    )
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_dlvrbl "
        "(legacy_int_id bigint PRIMARY KEY, new_uuid uuid DEFAULT gen_random_uuid())"
    )
    # deliverables 1,2,3,5 minted a UUID; 4 did not (dropped by demo/deliverable filter)
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_dlvrbl (legacy_int_id) VALUES (1), (2), (3), (5)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_override_note "
        "(legacy_int_id bigint PRIMARY KEY, new_uuid uuid DEFAULT gen_random_uuid())"
    )
    _apply(conn, POPULATE)


def test_populate_mints_only_nonempty_valid_notes(pg_db: psycopg.Connection) -> None:
    """Only valid deliverables (1, 5) with a non-empty override comment mint a UUID."""
    _provision_populate(pg_db)
    ids = [
        r[0]
        for r in pg_db.execute(
            "SELECT legacy_int_id FROM migration._id_map_override_note ORDER BY legacy_int_id"
        ).fetchall()
    ]
    assert ids == [1, 5]


def test_populate_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying populate mints nothing new (ON CONFLICT DO NOTHING)."""
    _provision_populate(pg_db)
    _apply(pg_db, POPULATE)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._id_map_override_note") == 2


# --------------------------------------------------------------------------- #
# stg view (35): author pairing                                              #
# --------------------------------------------------------------------------- #
def _provision_stgview(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, mysql_raw CASCADE")
    for schema in ("stg", "migration", "mysql_raw"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_dlvrbl ("
        " mdcd_dlvrbl_id bigint, bdgt_ntrlty_ovrrd_cmt_txt text,"
        " creatd_user_id bigint, updtd_user_id bigint,"
        " creatd_dt timestamptz, updtd_dt timestamptz)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl VALUES "
        "(10, '  note ten  ', 200, 100, now(), now()),"   # updtd(100) resolves -> use updtd
        "(11, 'note eleven', 200, 999, now(), NULL)"       # updtd(999) unresolved -> fall back to creatd(200)
    )
    for name in ("_id_map_override_note", "_id_map_mdcd_dlvrbl", "_id_map_users"):
        conn.execute(
            f"CREATE TABLE migration.{name} (legacy_int_id bigint PRIMARY KEY, new_uuid uuid)"
        )
    conn.execute(
        "INSERT INTO migration._id_map_override_note VALUES (10, %s), (11, %s)",
        (uuid.UUID(int=0x10), uuid.UUID(int=0x11)),
    )
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_dlvrbl VALUES (10, %s), (11, %s)",
        (uuid.UUID(int=0xD10), uuid.UUID(int=0xD11)),
    )
    conn.execute(
        "INSERT INTO migration._id_map_users VALUES (100, %s), (200, %s)",
        (CMS_USER, STATE_USER),
    )
    conn.execute("CREATE TABLE stg.users_resolved (new_uuid uuid PRIMARY KEY, person_type_id text)")
    conn.execute(
        "INSERT INTO stg.users_resolved VALUES (%s, 'demos-cms-user'), (%s, 'demos-state-user')",
        (CMS_USER, STATE_USER),
    )
    _apply(conn, STG_VIEW)


def test_stg_view_author_pairs_updtd_first_then_creatd(pg_db: psycopg.Connection) -> None:
    """updtd_user_id wins when it resolves; otherwise creatd_user_id, as a uuid+type pair."""
    _provision_stgview(pg_db)
    rows = dict(
        (r[0], (r[1], r[2], r[3]))
        for r in pg_db.execute(
            "SELECT legacy_id, author_user_id, author_person_type_id, content "
            "FROM stg.override_note_resolved ORDER BY legacy_id"
        ).fetchall()
    )
    # deliverable 10: updtd (100 -> CMS) wins; content trimmed
    assert rows[10] == (CMS_USER, "demos-cms-user", "note ten")
    # deliverable 11: updtd 999 unresolved -> creatd (200 -> state)
    assert rows[11] == (STATE_USER, "demos-state-user", "note eleven")


# --------------------------------------------------------------------------- #
# loader (51) + parity (48)                                                  #
# --------------------------------------------------------------------------- #
def _provision_loader(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE TABLE stg.override_note_resolved ("
        " legacy_id int, new_uuid uuid PRIMARY KEY, deliverable_id uuid,"
        " author_user_id uuid, author_person_type_id text, content text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    conn.execute(
        "INSERT INTO stg.override_note_resolved VALUES "
        "(1, %(ok)s,   %(dl)s, %(cms)s,   'demos-cms-user',   'load me',  now(), now()),"
        "(2, %(nc)s,   %(dl)s, %(st)s,    'demos-state-user', 'state',    now(), now()),"
        "(3, %(np)s,   %(du)s, %(cms)s,   'demos-cms-user',   'no parent',now(), now()),"
        "(4, %(na)s,   %(dl)s, NULL,      NULL,               'no author',now(), now()),"
        "(5, %(em)s,   %(dl)s, %(cms)s,   'demos-cms-user',   '',         now(), now())",
        {
            "ok": N_OK, "nc": N_NONCMS, "np": N_NOPARENT, "na": N_NOAUTHOR, "em": N_EMPTY,
            "dl": DEL_LOADED, "du": DEL_UNLOADED, "cms": CMS_USER, "st": STATE_USER,
        },
    )
    conn.execute("CREATE TABLE demos_app.deliverable (id uuid PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.deliverable (id) VALUES (%s)", (DEL_LOADED,))
    conn.execute(
        "CREATE TABLE demos_app.private_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " author_person_type_id text, content text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    _apply(conn, LOADER)
    _apply(conn, PARITY)


def test_only_cms_note_on_loaded_parent_loads(pg_db: psycopg.Connection) -> None:
    """Exactly the CMS-authored note on a loaded deliverable lands in private_comment."""
    _provision_loader(pg_db)
    rows = pg_db.execute(
        "SELECT id, deliverable_id, author_user_id, content FROM demos_app.private_comment"
    ).fetchall()
    assert rows == [(N_OK, DEL_LOADED, CMS_USER, "load me")]


def test_held_notes_logged_with_specific_reasons(pg_db: psycopg.Connection) -> None:
    """Non-CMS, unloaded-parent, unresolved-author, and empty notes are held with a reason."""
    _provision_loader(pg_db)
    held = dict(
        pg_db.execute(
            "SELECT legacy_id, reason FROM migration._parity_override_note_held ORDER BY legacy_id"
        ).fetchall()
    )
    assert set(held) == {2, 3, 4, 5}
    assert "not a CMS user" in held[2]
    assert "parent deliverable not loaded" in held[3]
    assert "author did not migrate" in held[4]
    assert "empty override comment" in held[5]


def test_completeness_invariant_holds(pg_db: psycopg.Connection) -> None:
    """Loaded U held = all resolved, so the gating completeness view is empty."""
    _provision_loader(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._parity_override_note_completeness") == 0


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the loader inserts nothing new."""
    _provision_loader(pg_db)
    _apply(pg_db, LOADER)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.private_comment") == 1


def test_loader_noop_when_stg_absent(pg_db: psycopg.Connection) -> None:
    """Guard: clean no-op when stg.override_note_resolved does not exist."""
    conn = pg_db
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute(
        "CREATE TABLE demos_app.private_comment ("
        " id uuid PRIMARY KEY, deliverable_id uuid, author_user_id uuid,"
        " author_person_type_id text, content text,"
        " created_at timestamptz, updated_at timestamptz)"
    )
    _apply(conn, LOADER)  # must NOT raise
    assert _scalar(conn, "SELECT count(*) FROM demos_app.private_comment") == 0
