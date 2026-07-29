"""Live-PG harness for the pending program-detail tag loaders.

Exercises the pending-track tag fold against a hand-built, FK-free ``mysql_raw``
skeleton on a throwaway Postgres (``pg_db``); self-skips without ``PG_TEST_DSN``.

  * loader 12 (fixed-tag, fold-aware): a mapped ``mdcd_pendg_<type>_pgm_dtl`` row
    attaches its tag to the pending demo's own 'Under Review' demonstration
    (orphan) or, when the pending demo folds into an approved counterpart, to the
    APPROVED demonstration's UUID (via ``stg._pendg_demo_fold``);
  * loader 13 (free-text "Other"): a ``mdcd_pendg_othr_pgm_dtl`` row whose name
    exactly equals a seeded demonstration-type tag is assigned; a free-text 1115
    name is held (never invented as a tag) and surfaced non-gating in
    ``migration._parity_pendg_pgm_dtl_tag_othr_held``;
  * the fail-closed ``_parity_pendg_pgm_dtl_tag_unseeded`` guard is empty because
    the derived pending mapping reuses the seeded base tag_names;
  * re-applying both loaders is a no-op (idempotent).
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
FOLD = ROOT / "sql" / "10_stg" / "23_pendg_demo_fold.sql"
XWALK_DDL = ROOT / "sql" / "04_crosswalks" / "47_pendg_pgm_dtl_tag.sql"
LOADER_FIXED = ROOT / "sql" / "21_app_associative" / "12_pending_demonstration_type_tag_assignment.sql"
LOADER_OTHR = ROOT / "sql" / "21_app_associative" / "13_pending_demonstration_type_tag_othr.sql"
PARITY = ROOT / "sql" / "99_parity" / "55_pendg_pgm_dtl_tag_othr_held.sql"

P_ORPHAN = 3001   # 11-W-03001/6 -> orphan_loadable, own Under Review demo
P_FOLD = 3002     # 11-W-04000/6 == approved A_APPROVED -> folded to approved
A_APPROVED = 7001  # approved 11-W-04000/6, the fold target for P_FOLD

FROM_DT = "2020-01-01"
TO_DT = "2025-12-31"


def _u(legacy: int) -> uuid.UUID:
    return uuid.UUID(int=legacy)


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _provision(conn: Any) -> None:
    create_mysql_raw_skeleton(conn)
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # Pending + approved demo rows the fold classifier reads.
    for legacy, num in ((P_ORPHAN, "11-W-03001/6"), (P_FOLD, "11-W-04000/6")):
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_pendg_demo (mdcd_pendg_demo_id, mdcd_demo_num, dltd_ind) "
            "VALUES (%s,%s,0)",
            (legacy, num),
        )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo (mdcd_demo_id, mdcd_demo_num, dltd_ind) VALUES (%s,%s,0)",
        (A_APPROVED, "11-W-04000/6"),
    )

    # id maps + PMDA-valid filters the fold view joins.
    conn.execute("CREATE TABLE migration._id_map_mdcd_pendg_demo (legacy_int_id bigint, new_uuid uuid)")
    for legacy in (P_ORPHAN, P_FOLD):
        conn.execute(
            "INSERT INTO migration._id_map_mdcd_pendg_demo (legacy_int_id, new_uuid) VALUES (%s,%s)",
            (legacy, _u(legacy)),
        )
    conn.execute("CREATE TABLE migration._id_map_mdcd_demo (legacy_int_id bigint, new_uuid uuid)")
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo (legacy_int_id, new_uuid) VALUES (%s,%s)",
        (A_APPROVED, _u(A_APPROVED)),
    )
    conn.execute("CREATE TABLE stg._valid_pendg_demo_ids (demo_id bigint)")
    for legacy in (P_ORPHAN, P_FOLD):
        conn.execute("INSERT INTO stg._valid_pendg_demo_ids (demo_id) VALUES (%s)", (legacy,))
    conn.execute("CREATE TABLE stg._valid_demo_ids (demo_id bigint)")
    conn.execute("INSERT INTO stg._valid_demo_ids (demo_id) VALUES (%s)", (A_APPROVED,))

    _apply(conn, FOLD)  # stg._pendg_demo_fold

    # Program-detail source rows (fixed-tag + free-text).
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_pendg_bnfts_pgm_dtl "
        "(mdcd_pendg_bnfts_pgm_dtl_id, mdcd_pendg_demo_id, from_dt, to_dt, dltd_ind) "
        "VALUES (1,%s,%s,%s,0)",
        (P_ORPHAN, FROM_DT, TO_DT),
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_pendg_mc_pgm_dtl "
        "(mdcd_pendg_mc_pgm_dtl_id, mdcd_pendg_demo_id, from_dt, to_dt, dltd_ind) "
        "VALUES (1,%s,%s,%s,0)",
        (P_FOLD, FROM_DT, TO_DT),
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_pendg_othr_pgm_dtl "
        "(mdcd_pendg_othr_pgm_dtl_id, mdcd_pendg_demo_id, mdcd_othr_pgm_dtl_name, from_dt, to_dt, dltd_ind) "
        "VALUES (1,%s,'Behavioral Health',%s,%s,0), (2,%s,'Badger Care',%s,%s,0)",
        (P_ORPHAN, FROM_DT, TO_DT, P_ORPHAN, FROM_DT, TO_DT),
    )

    # Pending crosswalk (real DDL) + the mappings under test.
    _apply(conn, XWALK_DDL)
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_pendg_pgm_dtl_tag "
        "(source_table, tag_name, from_dt_col, to_dt_col, additional_attrs, notes) VALUES "
        "('mdcd_pendg_bnfts_pgm_dtl','Benefits','from_dt','to_dt','',''), "
        "('mdcd_pendg_mc_pgm_dtl','Managed Care','from_dt','to_dt','',''), "
        "('mdcd_pendg_othr_pgm_dtl','','from_dt','to_dt','','')"
    )

    # Minimal DEMOS app surface the loaders write into.
    conn.execute("CREATE TABLE demos_app.demonstration_type_tag_type_limit (id text PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.demonstration_type_tag_type_limit (id) VALUES ('Demonstration Type')")
    conn.execute("CREATE TABLE demos_app.tag (tag_name_id text, tag_type_id text)")
    for name in ("Benefits", "Managed Care", "Behavioral Health"):
        conn.execute(
            "INSERT INTO demos_app.tag (tag_name_id, tag_type_id) VALUES (%s,'Demonstration Type')",
            (name,),
        )
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY)")
    for legacy in (P_ORPHAN, A_APPROVED):  # orphan's own demo + the fold-target approved demo
        conn.execute("INSERT INTO demos_app.demonstration (id) VALUES (%s)", (_u(legacy),))
    conn.execute(
        "CREATE TABLE demos_app.demonstration_type_tag_assignment ("
        " demonstration_id uuid, tag_name_id text, tag_type_id text, "
        " effective_date timestamptz, expiration_date timestamptz, "
        " created_at timestamptz, updated_at timestamptz, "
        " CONSTRAINT dtta_uq UNIQUE (demonstration_id, tag_name_id))"
    )

    _apply(conn, LOADER_FIXED)
    _apply(conn, LOADER_OTHR)
    _apply(conn, PARITY)


def _assigned(conn: Any, demo: uuid.UUID, tag: str) -> bool:
    return (
        conn.execute(
            "SELECT 1 FROM demos_app.demonstration_type_tag_assignment "
            "WHERE demonstration_id = %s AND tag_name_id = %s",
            (demo, tag),
        ).fetchone()
        is not None
    )


def _scalar(conn: Any, sql: str, params: tuple[Any, ...] | None = None) -> int:
    row = conn.execute(sql, params).fetchone()
    assert row is not None
    return int(row[0])


def test_fixed_tag_orphan_gets_own_demo(pg_db: psycopg.Connection) -> None:
    """An orphan pending demo's fixed-tag program detail attaches to its own demo."""
    _provision(pg_db)
    assert _assigned(pg_db, _u(P_ORPHAN), "Benefits")


def test_fixed_tag_folded_attaches_to_approved(pg_db: psycopg.Connection) -> None:
    """A folded pending demo's tag lands on the APPROVED counterpart, not its own UUID."""
    _provision(pg_db)
    assert _assigned(pg_db, _u(A_APPROVED), "Managed Care")
    assert not _assigned(pg_db, _u(P_FOLD), "Managed Care")  # pending UUID never loaded


def test_othr_exact_name_match_assigned(pg_db: psycopg.Connection) -> None:
    """A free-text Other name equal to a seeded tag is assigned."""
    _provision(pg_db)
    assert _assigned(pg_db, _u(P_ORPHAN), "Behavioral Health")


def test_othr_freetext_held_and_logged(pg_db: psycopg.Connection) -> None:
    """A 1115 free-text name is never turned into a tag; held + logged non-gating."""
    _provision(pg_db)
    assert not _assigned(pg_db, _u(P_ORPHAN), "Badger Care")
    held = pg_db.execute(
        "SELECT othr_name, reason FROM migration._parity_pendg_pgm_dtl_tag_othr_held"
    ).fetchall()
    names = {r[0] for r in held}
    assert "Badger Care" in names
    assert "Behavioral Health" not in names  # it was assigned, so not held


def test_unseeded_guard_is_empty(pg_db: psycopg.Connection) -> None:
    """Every derived pending tag_name resolves to a seeded demonstration-type tag."""
    _provision(pg_db)
    assert _scalar(pg_db, "SELECT count(*) FROM migration._parity_pendg_pgm_dtl_tag_unseeded") == 0


def test_loaders_are_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying both fold loaders inserts nothing new."""
    _provision(pg_db)
    before = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration_type_tag_assignment")
    _apply(pg_db, LOADER_FIXED)
    _apply(pg_db, LOADER_OTHR)
    after = _scalar(pg_db, "SELECT count(*) FROM demos_app.demonstration_type_tag_assignment")
    assert before == after == 3  # Benefits + Managed Care + Behavioral Health
