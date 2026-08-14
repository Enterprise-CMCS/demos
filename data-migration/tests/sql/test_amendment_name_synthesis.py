"""Live-PG harness for RED-5: amendment name synthesis.

DEMOS requires amendment.name to be a non-empty string (user-entered, no
auto-generation), but the legacy source carries NULL/empty names on a
meaningful subset of amendments (all of this snapshot's loadable set). Rather
than hard-fail the build_app transaction on the NOT NULL constraint, the loader
(sql/20_app/35_amendment.sql) synthesizes a name from the parent demonstration
plus the effective date, and logs every synthesized name for SME review.

Naming rule (SME-ratified, applied only when the source name is NULL/empty):
  "<parent demonstration name> Amendment (effective YYYY-MM-DD)"
    -> fallback "<parent demonstration name> Amendment"  when no effective date
    -> last resort "Amendment"                             when no parent name
A real source name always passes through unchanged.

Asserts:
  * a real source name is preserved verbatim;
  * a NULL name on a loaded parent with an effective date gets the
    parent+date synthesized name;
  * a whitespace-only name is treated as empty and synthesized identically;
  * a NULL name with no effective date falls back to "<parent> Amendment";
  * a NULL name whose parent name is empty falls back to "Amendment";
  * every synthesized name is logged in
    migration._parity_amendment_name_synthesized (and a real name is not);
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

DEMO_U1 = uuid.UUID(int=0xD1)  # loaded parent, name 'MassHealth'
DEMO_U3 = uuid.UUID(int=0xD3)  # loaded parent, empty name -> last-resort fallback

# mdcd_demo_amndmt rows exercise each branch of the synthesis rule.
A_REALNAME = 10        # real source name -> passes through unchanged
A_NULLNAME_DATE = 20   # NULL name, Approved+OA+eff -> parent+date synthesized
A_EMPTYNAME_DATE = 30  # whitespace name, Approved+OA+eff -> parent+date synthesized
A_NULLNAME_NODATE = 40  # NULL name, Under Review, no eff -> "<parent> Amendment"
A_NULLNAME_NOPARENT = 50  # NULL name, parent name empty -> "Amendment"


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration, demos_app CASCADE")
    for schema in ("stg", "mysql_raw", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo_amndmt ("
        " mdcd_demo_amndmt_id bigint, mdcd_demo_id bigint, mdcd_pendg_demo_id bigint,"
        " mdcd_demo_amndmt_name text, amndmt_desc text,"
        " mdcd_demo_amndmt_stus_cd bigint, mdcd_demo_aplctn_sgntr_lvl_cd bigint,"
        " amndmt_prd_from_dt date, creatd_dt timestamptz, dltd_ind bigint)"
    )
    rows = [
        (A_REALNAME, "1", None, "COVID-19 Amendment", "d", "2", "1", "2024-02-01", "2024-01-01", "0"),
        (A_NULLNAME_DATE, "1", None, None, "d", "2", "1", "2024-03-01", "2024-01-02", "0"),
        (A_EMPTYNAME_DATE, "1", None, "   ", "d", "2", "1", "2024-04-01", "2024-01-03", "0"),
        (A_NULLNAME_NODATE, "1", None, None, "d", "1", "1", None, "2024-01-04", "0"),
        (A_NULLNAME_NOPARENT, "3", None, None, "d", "1", "1", None, "2024-01-05", "0"),
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

    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)"
    )
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) "
        "VALUES (1, %s), (3, %s)",
        (DEMO_U1, DEMO_U3),
    )
    conn.execute("CREATE TABLE stg._valid_amndmt_ids (amndmt_id bigint)")
    conn.execute(
        "INSERT INTO stg._valid_amndmt_ids (amndmt_id) VALUES (%s),(%s),(%s),(%s),(%s)",
        (A_REALNAME, A_NULLNAME_DATE, A_EMPTYNAME_DATE, A_NULLNAME_NODATE, A_NULLNAME_NOPARENT),
    )
    _apply(conn, IDMAP_CREATE)
    _apply(conn, IDMAP_POP)
    _apply(conn, RESOLVED)

    conn.execute(
        "CREATE TABLE demos_app.demonstration "
        "(id uuid PRIMARY KEY, name text, status_id text NOT NULL)"
    )
    conn.execute(
        "INSERT INTO demos_app.demonstration (id, name, status_id) "
        "VALUES (%s, 'MassHealth', 'Approved'), (%s, '', 'Approved')",
        (DEMO_U1, DEMO_U3),
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


def _name(conn: Any, legacy: int) -> str | None:
    row = conn.execute(
        "SELECT name FROM demos_app.amendment WHERE id = %s",
        (_amndmt_uuid(conn, legacy),),
    ).fetchone()
    return None if row is None else row[0]


def test_all_five_load(pg_db: psycopg.Connection) -> None:
    """All five amendments load; none hard-fails on the NOT NULL name."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment") == 5


def test_real_name_passes_through(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    assert _name(pg_db, A_REALNAME) == "COVID-19 Amendment"


def test_null_name_with_date_synthesized(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    assert _name(pg_db, A_NULLNAME_DATE) == "MassHealth Amendment (effective 2024-03-01)"


def test_empty_name_with_date_synthesized(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    assert _name(pg_db, A_EMPTYNAME_DATE) == "MassHealth Amendment (effective 2024-04-01)"


def test_null_name_no_date_fallback(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    assert _name(pg_db, A_NULLNAME_NODATE) == "MassHealth Amendment"


def test_null_name_no_parent_name_last_resort(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    assert _name(pg_db, A_NULLNAME_NOPARENT) == "Amendment"


def test_synthesized_names_logged(pg_db: psycopg.Connection) -> None:
    """Every synthesized name is logged; a real source name is not."""
    _provision(pg_db)
    logged = dict(
        pg_db.execute(
            "SELECT amendment_uuid, synthesized_name "
            "FROM migration._parity_amendment_name_synthesized"
        ).fetchall()
    )
    assert _amndmt_uuid(pg_db, A_REALNAME) not in logged
    assert logged[_amndmt_uuid(pg_db, A_NULLNAME_DATE)] == "MassHealth Amendment (effective 2024-03-01)"
    assert logged[_amndmt_uuid(pg_db, A_EMPTYNAME_DATE)] == "MassHealth Amendment (effective 2024-04-01)"
    assert logged[_amndmt_uuid(pg_db, A_NULLNAME_NODATE)] == "MassHealth Amendment"
    assert logged[_amndmt_uuid(pg_db, A_NULLNAME_NOPARENT)] == "Amendment"
    assert len(logged) == 4


def test_loader_is_idempotent(pg_db: psycopg.Connection) -> None:
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    _apply(pg_db, LOADER)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.amendment")
    assert before == after == 5
