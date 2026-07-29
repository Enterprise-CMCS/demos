"""Live-PG harness for scripts/sme_review_exports.py (Branch 5 SME exports).

Two SME-review exports:
  * held "Other" program names -- read from the parity view
    migration._parity_pgm_dtl_tag_othr_held (surfaced for SDG review);
  * a snapshot of the seven non-deliverable comment tables the migration
    leaves behind in PMDA, normalized into one column set with a "deleted"
    column so every row (including soft-deleted ones) is visible.

The exporter lives under scripts/ (not an installed package), so it is imported
by path. Runs against a throwaway Postgres (``PG_TEST_DSN`` via ``pg_db``);
self-skips without it.
"""

from __future__ import annotations

import csv
import importlib.util
import os
import sys
import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

from tests.sql._skeleton import apply_migration_helper_fns

if TYPE_CHECKING:
    import psycopg

_SCRIPTS_DIR = Path(__file__).resolve().parents[2] / "scripts"
sys.path.insert(0, str(_SCRIPTS_DIR))


def _load() -> Any:
    spec = importlib.util.spec_from_file_location(
        "sme_review_exports", _SCRIPTS_DIR / "sme_review_exports.py"
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["sme_review_exports"] = module
    spec.loader.exec_module(module)
    return module


sre = _load()

DEMO_UUID = uuid.UUID(int=0xD1)


def _provision_othr_held(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA migration")
    conn.execute(
        "CREATE VIEW migration._parity_pgm_dtl_tag_othr_held AS "
        "SELECT * FROM (VALUES "
        f"  (11, 1, '{DEMO_UUID}'::uuid, 'Badger Care', 'Zeta Waiver',"
        "   'free-text name is not a seeded tag'),"
        "  (10, 1, NULL::uuid, NULL::text, 'Alpha Waiver',"
        "   'parent demonstration not migrated')"
        ") AS v(legacy_id, legacy_demo_id, demonstration_id, demonstration_name,"
        "       othr_name, reason)"
    )


def _provision_comment_tables(conn: Any, *, tables: set[str] | None = None) -> None:
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    want = tables if tables is not None else set(sre.COMMENT_SOURCE_TABLES)

    if "mdcd_demo_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_cmt ("
            " mdcd_demo_cmt_id int, proj_ofcr_user_id int, mdcd_demo_id int,"
            " cmt_txt text, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_cmt VALUES "
            "(10, 100, 1, 'demo note', '2020-01-01T00:00:00Z')"
        )
    if "mdcd_demo_amndmt_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_amndmt_cmt ("
            " mdcd_demo_amndmt_cmt_id int, mdcd_demo_amndmt_id int, user_id int,"
            " cmt_txt text, cmt_orgn_cd text, dltd_ind smallint, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_amndmt_cmt VALUES "
            "(20, 2, 101, 'amend note', 'A', 0, '2020-01-02T00:00:00Z'),"
            "(21, 2, 101, 'deleted amend', 'B', 1, '2020-01-03T00:00:00Z')"
        )
    if "mdcd_demo_rnwl_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_rnwl_cmt ("
            " mdcd_demo_rnwl_cmt_id int, mdcd_demo_rnwl_id int, user_id int,"
            " cmt_txt text, cmt_orgn_cd text, dltd_ind smallint, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_rnwl_cmt VALUES "
            "(30, 3, 102, 'rnwl note', 'R', 0, '2020-01-04T00:00:00Z')"
        )
    if "mdcd_pgm_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_pgm_cmt ("
            " mdcd_pgm_cmt_id int, mdcd_demo_id int, mdcd_pgm_id int,"
            " mdcd_demo_type_name text, cmt_txt text, user_id int, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_pgm_cmt VALUES "
            "(40, 1, 4, 'MG', 'pgm note', 103, '2020-01-05T00:00:00Z')"
        )
    if "mdcd_demo_finl_dcsn_dtl_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_finl_dcsn_dtl_cmt ("
            " mdcd_demo_finl_dcsn_dtl_cmt_id int, user_id int, mdcd_demo_id int,"
            " cmt_txt text, cmt_orgn_cd text, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_finl_dcsn_dtl_cmt VALUES "
            "(50, 104, 1, 'finl note', 'I', '2020-01-06T00:00:00Z')"
        )
    if "mdcd_demo_pgm_mntrg_doc_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_pgm_mntrg_doc_cmt ("
            " mdcd_demo_pgm_mntrg_doc_cmt_id int, mdcd_demo_pgm_mntrg_doc_id int,"
            " cmt_txt text, creatd_user_id int, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_pgm_mntrg_doc_cmt VALUES "
            "(60, 6, 'mntr note', 105, '2020-01-07T00:00:00Z')"
        )
    if "bdgt_ntrlty_fil_doc_cmt" in want:
        conn.execute(
            "CREATE TABLE mysql_raw.bdgt_ntrlty_fil_doc_cmt ("
            " bdgt_ntrlty_fil_doc_cmt_id int, mdcd_dlvrbl_fil_doc_id int,"
            " gnrl_cmt_txt text, creatd_dt timestamptz)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.bdgt_ntrlty_fil_doc_cmt VALUES "
            "(70, 7, 'bn note', '2020-01-08T00:00:00Z')"
        )


# --- held "Other" names ---------------------------------------------------- #


def test_othr_held_rows_ordered(pg_db: psycopg.Connection) -> None:
    """Rows come back ordered by othr_name then legacy_id, keyed by column name."""
    _provision_othr_held(pg_db)
    rows = sre.fetch_othr_held(pg_db)
    assert [r["othr_name"] for r in rows] == ["Alpha Waiver", "Zeta Waiver"]
    assert rows[0]["legacy_id"] == 10
    assert rows[1]["demonstration_id"] == DEMO_UUID
    assert rows[1]["reason"] == "free-text name is not a seeded tag"


def test_othr_held_carries_demonstration_name(pg_db: psycopg.Connection) -> None:
    """The migrated parent's DEMOS name rides along, NULL when it did not migrate."""
    _provision_othr_held(pg_db)
    by_id = {r["legacy_id"]: r for r in sre.fetch_othr_held(pg_db)}
    assert by_id[11]["demonstration_name"] == "Badger Care"
    assert by_id[10]["demonstration_name"] is None


def test_othr_held_dies_when_view_absent(pg_db: psycopg.Connection) -> None:
    """Missing parity view is a build error, not a silent empty export."""
    pg_db.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    pg_db.execute("CREATE SCHEMA migration")
    with pytest.raises(SystemExit):
        sre.fetch_othr_held(pg_db)


# --- non-deliverable comments snapshot ------------------------------------- #


def _by_key(rows: list[dict[str, Any]]) -> dict[tuple[str, int], dict[str, Any]]:
    return {(r["source_table"], r["legacy_comment_id"]): r for r in rows}


def test_comments_snapshot_normalizes_all_seven_tables(pg_db: psycopg.Connection) -> None:
    """Every non-deliverable comment table folds into the shared column set."""
    _provision_comment_tables(pg_db)
    rows = sre.fetch_comments_snapshot(pg_db)
    assert len(rows) == 8  # one per table + one extra (soft-deleted) amendment
    by = _by_key(rows)

    # heterogeneous author columns normalize into author_legacy_user_id
    assert by[("mdcd_demo_cmt", 10)]["author_legacy_user_id"] == 100  # proj_ofcr_user_id
    assert by[("mdcd_demo_pgm_mntrg_doc_cmt", 60)]["author_legacy_user_id"] == 105  # creatd_user_id
    assert by[("bdgt_ntrlty_fil_doc_cmt", 70)]["author_legacy_user_id"] is None

    # comment text column differs (gnrl_cmt_txt) but normalizes to content
    assert by[("bdgt_ntrlty_fil_doc_cmt", 70)]["content"] == "bn note"

    # parent kind + parent id are labeled per source
    assert by[("mdcd_demo_amndmt_cmt", 20)]["parent_kind"] == "amendment"
    assert by[("mdcd_demo_amndmt_cmt", 20)]["parent_legacy_id"] == 2
    assert by[("mdcd_pgm_cmt", 40)]["demo_legacy_id"] == 1


def test_comments_snapshot_includes_soft_deleted_flagged(pg_db: psycopg.Connection) -> None:
    """Soft-deleted rows are retained and flagged; delete-less tables read 0."""
    _provision_comment_tables(pg_db)
    by = _by_key(sre.fetch_comments_snapshot(pg_db))
    assert by[("mdcd_demo_amndmt_cmt", 21)]["deleted"] == 1
    assert by[("mdcd_demo_amndmt_cmt", 20)]["deleted"] == 0
    assert by[("mdcd_demo_cmt", 10)]["deleted"] == 0  # no dltd_ind column -> 0


def test_comments_snapshot_skips_absent_tables(pg_db: psycopg.Connection) -> None:
    """A partially-loaded target must not error; present tables still export."""
    _provision_comment_tables(pg_db, tables={"mdcd_demo_cmt", "bdgt_ntrlty_fil_doc_cmt"})
    rows = sre.fetch_comments_snapshot(pg_db)
    assert {r["source_table"] for r in rows} == {"mdcd_demo_cmt", "bdgt_ntrlty_fil_doc_cmt"}


def test_comments_snapshot_dies_when_none_present(pg_db: psycopg.Connection) -> None:
    """No comment tables at all is a build error, not a silent empty export."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    with pytest.raises(SystemExit):
        sre.fetch_comments_snapshot(pg_db)


# --- end-to-end CSV emission ---------------------------------------------- #


def test_main_both_writes_two_csvs(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """`both` connects via --dsn, writes both stamped CSVs, and exits 0."""
    dsn = os.environ["PG_TEST_DSN"]
    _provision_othr_held(pg_db)
    _provision_comment_tables(pg_db)

    rc = sre.main(["both", "--dsn", dsn, "--out-dir", str(tmp_path)])
    assert rc == 0

    othr = list(tmp_path.glob("sme_review_othr_names_*.csv"))
    comments = list(tmp_path.glob("sme_review_comments_snapshot_*.csv"))
    assert len(othr) == 1
    assert len(comments) == 1

    with othr[0].open(encoding="utf-8", newline="") as fh:
        othr_rows = list(csv.DictReader(fh))
    assert [r["othr_name"] for r in othr_rows] == ["Alpha Waiver", "Zeta Waiver"]
    assert othr_rows[1]["demonstration_name"] == "Badger Care"

    with comments[0].open(encoding="utf-8", newline="") as fh:
        cmt_rows = list(csv.DictReader(fh))
    assert len(cmt_rows) == 8
    assert "deleted" in cmt_rows[0]


# --- waiver / expenditure authorities snapshot ----------------------------- #

AUTH_DEMO_UUID = uuid.UUID(int=0xA1)

_AUTH_DEFAULT = {
    "mdcd_demo_wvr_authrty",
    "expndtr_authrty_title_rfrnc",
    "mdcd_demo_expndtr_authrty_load",
    "mdcd_pendg_expndtr_cap_pgm_dtl",
    "bene_grp_asctd_wvr",
}


def _provision_authorities(conn: Any, *, tables: set[str] | None = None) -> None:
    """A small mysql_raw fixture spanning the authority tiers, plus the demo id
    map so the demonstration_id enrichment can resolve."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA migration")
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid NOT NULL)"
    )
    conn.execute("INSERT INTO migration._id_map_mdcd_demo VALUES (1, %s)", (AUTH_DEMO_UUID,))

    want = tables if tables is not None else set(_AUTH_DEFAULT)
    if "mdcd_demo_wvr_authrty" in want:  # instance tier, has mdcd_demo_id + a deleted row
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_wvr_authrty ("
            " mdcd_demo_wvr_authrty_id int, mdcd_demo_id int,"
            " wvr_authrty_desc text, dltd_ind smallint)"
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo_wvr_authrty VALUES "
            "(100, 1, 'live waiver', 0), (101, 999, 'deleted waiver', 1)"
        )
    if "expndtr_authrty_title_rfrnc" in want:  # reference tier, no mdcd_demo_id
        conn.execute(
            "CREATE TABLE mysql_raw.expndtr_authrty_title_rfrnc ("
            " expndtr_authrty_title_cd int, expndtr_authrty_title_name text, dltd_ind smallint)"
        )
        conn.execute("INSERT INTO mysql_raw.expndtr_authrty_title_rfrnc VALUES (5, 'Title XIX', 0)")
    if "mdcd_demo_expndtr_authrty_load" in want:  # instance history/load (technical)
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_demo_expndtr_authrty_load ("
            " mdcd_demo_expndtr_authrty_id int, mdcd_demo_id int)"
        )
        conn.execute("INSERT INTO mysql_raw.mdcd_demo_expndtr_authrty_load VALUES (200, 1)")
    if "mdcd_pendg_expndtr_cap_pgm_dtl" in want:  # pending pgm_dtl overlap
        conn.execute(
            "CREATE TABLE mysql_raw.mdcd_pendg_expndtr_cap_pgm_dtl ("
            " mdcd_pendg_expndtr_cap_pgm_dtl_id int, mdcd_demo_id int, dltd_ind smallint)"
        )
        conn.execute("INSERT INTO mysql_raw.mdcd_pendg_expndtr_cap_pgm_dtl VALUES (300, 1, 0)")
    if "bene_grp_asctd_wvr" in want:  # bene-group link, no mdcd_demo_id
        conn.execute(
            "CREATE TABLE mysql_raw.bene_grp_asctd_wvr ("
            " bene_grp_asctd_wvr_id int, bene_grp_id int, dltd_ind smallint)"
        )
        conn.execute("INSERT INTO mysql_raw.bene_grp_asctd_wvr VALUES (400, 40, 0)")


def test_authorities_resolves_demonstration_id(pg_db: psycopg.Connection) -> None:
    """Instance tables gain a resolved demonstration_id; unmatched demos read NULL;
    tables without mdcd_demo_id get no demonstration_id column."""
    _provision_authorities(pg_db)
    cols, rows = sre.fetch_authority_table(pg_db, "mdcd_demo_wvr_authrty")
    assert "demonstration_id" in cols
    by_id = {r["mdcd_demo_wvr_authrty_id"]: r for r in rows}
    assert str(by_id[100]["demonstration_id"]) == str(AUTH_DEMO_UUID)
    assert by_id[101]["demonstration_id"] is None  # mdcd_demo_id 999 not in the map

    rcols, _ = sre.fetch_authority_table(pg_db, "expndtr_authrty_title_rfrnc")
    assert "demonstration_id" not in rcols


def test_authorities_retains_soft_deleted(pg_db: psycopg.Connection) -> None:
    """Soft-deleted authority rows are kept in the snapshot (SME decides fate)."""
    _provision_authorities(pg_db)
    _, rows = sre.fetch_authority_table(pg_db, "mdcd_demo_wvr_authrty")
    assert len(rows) == 2
    deleted = [r for r in rows if r["dltd_ind"] == 1]
    assert [r["mdcd_demo_wvr_authrty_id"] for r in deleted] == [101]


def test_authorities_snapshot_writes_per_table_csvs_and_manifest(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """One CSV per present table + a manifest listing every known table."""
    _provision_authorities(pg_db)
    manifest_path, total = sre.export_authorities_snapshot(pg_db, tmp_path)
    assert manifest_path.name.startswith("sme_review_authorities_manifest_")
    per_file = list(tmp_path.glob("sme_review_authorities_*.csv"))
    assert len(per_file) == len(_AUTH_DEFAULT) + 1  # present tables + manifest
    assert total == 6  # 2 + 1 + 1 + 1 + 1

    with manifest_path.open(encoding="utf-8", newline="") as fh:
        manifest = {r["source_table"]: r for r in csv.DictReader(fh)}
    assert set(manifest) == set(sre.AUTHORITY_TABLES)  # present + absent all listed
    assert manifest["mdcd_demo_wvr_authrty"]["present"] == "1"
    assert manifest["mdcd_demo_wvr_authrty"]["row_count"] == "2"
    assert manifest["mdcd_demo_wvr_authrty"]["deleted_row_count"] == "1"
    # an absent table is still catalogued, flagged not present
    assert manifest["mdcd_demo_na_expndtr_authrty"]["present"] == "0"
    assert manifest["mdcd_demo_na_expndtr_authrty"]["row_count"] == "0"


def test_authorities_manifest_flags(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """The manifest tier/history/pending/overlap flags surface the SME-deferred
    questions without deciding them in code."""
    _provision_authorities(pg_db)
    manifest_path, _ = sre.export_authorities_snapshot(pg_db, tmp_path)
    with manifest_path.open(encoding="utf-8", newline="") as fh:
        manifest = {r["source_table"]: r for r in csv.DictReader(fh)}
    assert manifest["mdcd_demo_expndtr_authrty_load"]["is_history"] == "1"
    assert manifest["mdcd_pendg_expndtr_cap_pgm_dtl"]["is_pending"] == "1"
    assert manifest["mdcd_pendg_expndtr_cap_pgm_dtl"]["pgm_dtl_overlap"] == "1"
    assert manifest["bene_grp_asctd_wvr"]["tier"] == "bene_link"
    assert manifest["mdcd_demo_wvr_authrty"]["tier"] == "instance"


def test_authorities_snapshot_skips_absent_tables(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """A partially-loaded target must not error; only present tables get a CSV."""
    _provision_authorities(pg_db, tables={"mdcd_demo_wvr_authrty", "bene_grp_asctd_wvr"})
    _, total = sre.export_authorities_snapshot(pg_db, tmp_path)
    per_file = [p.name for p in tmp_path.glob("sme_review_authorities_*.csv")]
    assert any("mdcd_demo_wvr_authrty" in n for n in per_file)
    assert any("bene_grp_asctd_wvr" in n for n in per_file)
    assert not any("expndtr_authrty_title_rfrnc" in n for n in per_file)
    assert total == 3  # 2 + 1


def test_authorities_snapshot_dies_when_none_present(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """No authority tables at all is a build error, not a silent empty export."""
    pg_db.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    pg_db.execute("CREATE SCHEMA mysql_raw")
    with pytest.raises(SystemExit):
        sre.export_authorities_snapshot(pg_db, tmp_path)


def test_main_authorities_snapshot_writes_csvs(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """`authorities-snapshot` connects via --dsn, writes the manifest + per-table
    CSVs, and exits 0."""
    dsn = os.environ["PG_TEST_DSN"]
    _provision_authorities(pg_db)
    rc = sre.main(["authorities-snapshot", "--dsn", dsn, "--out-dir", str(tmp_path)])
    assert rc == 0
    assert len(list(tmp_path.glob("sme_review_authorities_manifest_*.csv"))) == 1
    assert len(list(tmp_path.glob("sme_review_authorities_mdcd_demo_wvr_authrty_*.csv"))) == 1


# --- soft-deleted demonstrations snapshot ---------------------------------- #


def _provision_softdeleted(conn: psycopg.Connection) -> None:
    """Minimal source + target for the soft-deleted demonstration snapshot.

    Four cases, chosen so each output flag is exercised in both states:
      2501  soft-deleted approved, project number DID load elsewhere
      2502  soft-deleted approved, project number loaded nowhere  (a real loss)
      2503  LIVE approved -- must never appear in the snapshot
      9001  soft-deleted pending, project number loaded nowhere   (a real loss)
      9002  soft-deleted pending, unnormalizable project number   (unknowable)
    """
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA IF NOT EXISTS demos_app")
    apply_migration_helper_fns(conn)  # the snapshot calls normalize_medicaid_id
    conn.execute("DROP TABLE IF EXISTS demos_app.demonstration CASCADE")
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY, medicaid_id text)")
    conn.execute(
        "INSERT INTO demos_app.demonstration VALUES (%s, '11-W-00005/4')", (DEMO_UUID,)
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo ("
        " mdcd_demo_id int, mdcd_demo_num text, mdcd_demo_name text,"
        " geo_ansi_state_cd text, mdcd_demo_stus_cd int, dltd_ind smallint,"
        " dltd_user_id int, dltd_dt timestamptz, creatd_dt timestamptz,"
        " state_prfmnc_yr_strt_dt date, state_prfmnc_yr_end_dt date)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo VALUES"
        " (2501, '11-W-0000-5/4', 'Dup Of Loaded', 'KY', 4, 1, 820,"
        "  '2020-09-25 12:53:00+00', '2020-09-25 12:44:13+00', '1997-11-01', '2012-12-31'),"
        " (2502, '11-W-00099/4',  'Gone Forever',  'TN', 4, 1, 821,"
        "  '2021-01-05 09:00:00+00', '2019-01-05 09:00:00+00', '2019-01-01', '2024-12-31'),"
        " (2503, '11-W-00005/4',  'Still Here',    'KY', 4, 0, NULL,"
        "  NULL, '2018-01-01 09:00:00+00', '2018-01-01', '2023-12-31')"
    )
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_pendg_demo ("
        " mdcd_pendg_demo_id int, mdcd_demo_num text, mdcd_demo_name text,"
        " geo_ansi_state_cd text, dltd_ind smallint, dltd_user_id int,"
        " dltd_dt timestamptz, creatd_dt timestamptz,"
        " state_prfmnc_yr_strt_dt date, state_prfmnc_yr_end_dt date)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_pendg_demo VALUES"
        " (9001, '11-W-00123/4', 'Pending Gone', 'OR', 1, 830,"
        "  '2022-03-01 09:00:00+00', '2021-03-01 09:00:00+00', '2021-01-01', '2026-12-31'),"
        " (9002, 'not a number',  'Pending Junk', 'OR', 1, 830,"
        "  '2022-03-01 09:00:00+00', '2021-03-01 09:00:00+00', NULL, NULL)"
    )


def test_softdeleted_snapshot_excludes_live_rows(pg_db: psycopg.Connection) -> None:
    """Only dltd_ind = 1 rows are exported; a live demonstration never appears."""
    _provision_softdeleted(pg_db)
    rows = sre.fetch_softdeleted_demos(pg_db)
    assert sorted(r["source_id"] for r in rows) == ["2501", "2502", "9001", "9002"]
    assert "2503" not in {r["source_id"] for r in rows}


def test_softdeleted_snapshot_spans_approved_and_pending(
    pg_db: psycopg.Connection,
) -> None:
    """Both demonstration sources are covered and labelled by source_table."""
    _provision_softdeleted(pg_db)
    by_src: dict[str, list[str]] = {}
    for r in sre.fetch_softdeleted_demos(pg_db):
        by_src.setdefault(str(r["source_table"]), []).append(str(r["source_id"]))
    assert sorted(by_src["mdcd_demo"]) == ["2501", "2502"]
    assert sorted(by_src["mdcd_pendg_demo"]) == ["9001", "9002"]


def test_softdeleted_snapshot_separates_real_losses_from_duplicates(
    pg_db: psycopg.Connection,
) -> None:
    """The two judgement flags must disagree correctly, or the export misleads.

    A soft-deleted row whose project number reached DEMOS by another row is a
    dedup, not a loss -- flagging it as lost would bury the rows that actually
    vanish. This is the distinction the SME acts on.
    """
    _provision_softdeleted(pg_db)
    by_id = {str(r["source_id"]): r for r in sre.fetch_softdeleted_demos(pg_db)}

    # 2501's typo'd number normalizes onto a loaded demonstration -> not a loss.
    assert by_id["2501"]["project_number_normalized"] == "11-W-00005/4"
    assert by_id["2501"]["has_loaded_counterpart"] is True
    assert by_id["2501"]["project_number_lost_entirely"] is False

    # 2502 and 9001 reach DEMOS by no route at all -> real losses.
    for sid in ("2502", "9001"):
        assert by_id[sid]["has_loaded_counterpart"] is False
        assert by_id[sid]["project_number_lost_entirely"] is True


def test_softdeleted_snapshot_makes_no_claim_without_a_project_number(
    pg_db: psycopg.Connection,
) -> None:
    """Negative control: an unnormalizable number asserts neither flag.

    Nothing can be matched, so claiming 'lost' or 'has a counterpart' would be
    a guess. The row is still exported -- it is exactly the kind of record an
    SME must eyeball -- but both judgements read false.
    """
    _provision_softdeleted(pg_db)
    junk = next(r for r in sre.fetch_softdeleted_demos(pg_db) if r["source_id"] == "9002")
    assert junk["project_number_normalized"] is None
    assert junk["has_loaded_counterpart"] is False
    assert junk["project_number_lost_entirely"] is False


def test_softdeleted_snapshot_dies_without_the_target(pg_db: psycopg.Connection) -> None:
    """No demos_app.demonstration means the flags cannot be computed -- die."""
    _provision_softdeleted(pg_db)
    pg_db.execute("DROP TABLE demos_app.demonstration")
    with pytest.raises(SystemExit):
        sre.fetch_softdeleted_demos(pg_db)


def test_main_softdeleted_snapshot_writes_csv(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """`softdeleted-demos-snapshot` writes one stamped CSV with the full column set."""
    dsn = os.environ["PG_TEST_DSN"]
    _provision_softdeleted(pg_db)
    rc = sre.main(["softdeleted-demos-snapshot", "--dsn", dsn, "--out-dir", str(tmp_path)])
    assert rc == 0
    written = list(tmp_path.glob("sme_review_softdeleted_demos_*.csv"))
    assert len(written) == 1
    with written[0].open(encoding="utf-8", newline="") as fh:
        parsed = list(csv.DictReader(fh))
    assert list(parsed[0]) == sre.SOFTDELETED_DEMO_COLUMNS
    assert len(parsed) == 4


def _provision_dup_medicaid(conn: psycopg.Connection) -> None:
    """Stand up the check-21 view shape with the real 11-W-00232/6 collision."""
    conn.execute("CREATE SCHEMA IF NOT EXISTS migration")
    conn.execute("DROP VIEW IF EXISTS migration._parity_demonstration_held_dup_medicaid_id")
    conn.execute(
        """
        CREATE VIEW migration._parity_demonstration_held_dup_medicaid_id AS
        SELECT * FROM (VALUES
          (2513, 'Texas Women''s Health Waiver', 'TX', 'Approved',
           DATE '2007-01-01', DATE '2012-12-31', '11-W-00232/6', 2506,
           'Louisiana Take Charge Family Planning Program', 'held_nonwinner',
           FALSE, 'duplicate medicaid_id; kept legacy demo 2506 (lower legacy id)')
        ) AS t(legacy_demo_id, name, state_id, status_id, effective_date,
               expiration_date, medicaid_id, kept_legacy_demo_id, kept_name,
               disposition, gating, reason)
        """
    )


def test_dup_medicaid_export_names_both_sides(pg_db: psycopg.Connection) -> None:
    """Both colliding demonstrations must be named, not just their ids.

    Regression guard for the 2026-07-28 SDG review, which was answered against
    the wrong Texas demonstration because the artifact carried no name.
    """
    _provision_dup_medicaid(pg_db)
    rows = sre.fetch_dup_medicaid(pg_db)
    assert len(rows) == 1
    assert rows[0]["held_name"] == "Texas Women's Health Waiver"
    assert rows[0]["kept_name"] == "Louisiana Take Charge Family Planning Program"
    assert rows[0]["medicaid_id"] == "11-W-00232/6"


def test_main_dup_medicaid_writes_csv(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """`dup-medicaid` writes one stamped CSV with the full column set."""
    dsn = os.environ["PG_TEST_DSN"]
    _provision_dup_medicaid(pg_db)
    rc = sre.main(["dup-medicaid", "--dsn", dsn, "--out-dir", str(tmp_path)])
    assert rc == 0
    written = list(tmp_path.glob("sme_review_dup_medicaid_*.csv"))
    assert len(written) == 1
    with written[0].open(encoding="utf-8", newline="") as fh:
        parsed = list(csv.DictReader(fh))
    assert list(parsed[0]) == sre.DUP_MEDICAID_COLUMNS
    assert parsed[0]["held_name"] == "Texas Women's Health Waiver"


def test_dup_medicaid_dies_without_the_parity_view(pg_db: psycopg.Connection) -> None:
    """An absent parity view must die, not export an empty "no collisions" CSV."""
    pg_db.execute("CREATE SCHEMA IF NOT EXISTS migration")
    pg_db.execute("DROP VIEW IF EXISTS migration._parity_demonstration_held_dup_medicaid_id")
    with pytest.raises(SystemExit):
        sre.fetch_dup_medicaid(pg_db)


def test_main_all_keeps_going_but_fails_when_an_export_is_skipped(
    pg_db: psycopg.Connection, tmp_path: Path
) -> None:
    """`all` builds what it can, yet still exits non-zero.

    A partial artifact set that exited 0 would let an operator believe every
    SME artifact was produced. The two provisioned exports must still be
    written, and the run must still fail.
    """
    dsn = os.environ["PG_TEST_DSN"]
    _provision_othr_held(pg_db)
    _provision_comment_tables(pg_db)
    pg_db.execute("DROP VIEW IF EXISTS migration._parity_demonstration_held_dup_medicaid_id")

    rc = sre.main(["all", "--dsn", dsn, "--out-dir", str(tmp_path)])
    assert rc == 1
    assert len(list(tmp_path.glob("sme_review_othr_names_*.csv"))) == 1
    assert len(list(tmp_path.glob("sme_review_comments_snapshot_*.csv"))) == 1
    assert list(tmp_path.glob("sme_review_dup_medicaid_*.csv")) == []


def test_main_all_reports_a_broken_export_as_failed_not_skipped(
    pg_db: psycopg.Connection, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """An export that breaks PAST its existence check is FAILED, never SKIPPED.

    Schema drift satisfies `to_regclass` and then blows up on a missing column.
    Filing that as a benign "inputs absent" skip would hide a real defect, so the
    two outcomes are reported distinctly.
    """
    dsn = os.environ["PG_TEST_DSN"]
    _provision_othr_held(pg_db)
    # A view of the wrong shape satisfies to_regclass, so the export gets past
    # its existence check and then fails on the missing columns.
    pg_db.execute("CREATE SCHEMA IF NOT EXISTS migration")
    pg_db.execute("DROP VIEW IF EXISTS migration._parity_demonstration_held_dup_medicaid_id")
    pg_db.execute(
        "CREATE VIEW migration._parity_demonstration_held_dup_medicaid_id AS SELECT 1 AS wrong_shape"
    )
    try:
        rc = sre.main(["all", "--dsn", dsn, "--out-dir", str(tmp_path)])
    finally:
        pg_db.execute("DROP VIEW IF EXISTS migration._parity_demonstration_held_dup_medicaid_id")
    assert rc == 1
    # lib.log writes to the stderr Console, which wraps at the terminal width.
    err = " ".join(capsys.readouterr().err.split())
    assert "FAILED dup-medicaid" in err
    assert "SKIPPED dup-medicaid" not in err
    # The healthy export still produced its artifact.
    assert len(list(tmp_path.glob("sme_review_othr_names_*.csv"))) == 1
