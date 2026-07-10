"""Behavioral harness for the budget-neutrality oracle (CODE_REVIEW M-SQL1).

``sql/10_stg/60_budget_neutrality.sql`` aggregates the legacy ``bdgt_ntrlty_*``
machinery into ``migration.bn_workbook_detail``. The fact CTEs filter
``dltd_ind`` but the demo-year / eligibility-group dimension joins did not, so
soft-deleted years/groups leaked into the parity aggregate. This runs the real
SQL against a throwaway Postgres (``PG_TEST_DSN``) with fixtures that include
soft-deleted dimension rows and asserts they are excluded.

pg_jsonschema is unavailable here (no Docker), so ``jsonb_matches_schema`` is
stubbed; the aggregation logic under test is independent of JSON-schema
validation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING, Any

from tests.sql._skeleton import create_mysql_raw_skeleton

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "sql"
SUPPLEMENTS_DIR = SQL_DIR / "01_ddl_supplements"
ID_MAPS_DIR = SQL_DIR / "05_id_maps"
STG_DIR = SQL_DIR / "10_stg"
BN_SQL = STG_DIR / "60_budget_neutrality.sql"
BN_SCHEMA = ROOT / "reports" / "jsonb_schemas" / "budget_neutrality.schema.json"

LIVE_YEAR, DELETED_YEAR = 10, 11
LIVE_GRP, DELETED_GRP = 20, 21
FIL_DOC_ID, DEMO_ID = 100, 1


def _provision(conn: Any) -> None:
    """Stand up schemas, the stubbed validator, supplements, id-maps, demo filter."""
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration CASCADE")
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE SCHEMA migration")
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    # Stand in for pg_jsonschema (unavailable without Docker). The BN
    # aggregation under test does not depend on real schema validation.
    conn.execute(
        "CREATE OR REPLACE FUNCTION public.jsonb_matches_schema(json, jsonb) "
        "RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT true $$"
    )

    create_mysql_raw_skeleton(conn)

    conn.execute((SUPPLEMENTS_DIR / "00_jsonb_schema_registry.sql").read_text(encoding="utf-8"))
    conn.execute((SUPPLEMENTS_DIR / "10_bn_workbook_detail.sql").read_text(encoding="utf-8"))
    conn.execute(
        "INSERT INTO migration.jsonb_schemas (name, schema) VALUES (%s, %s::jsonb)",
        ("budget_neutrality", BN_SCHEMA.read_text(encoding="utf-8")),
    )

    for f in sorted(ID_MAPS_DIR.glob("*.sql")):
        conn.execute(f.read_text(encoding="utf-8"))
    conn.execute((STG_DIR / "00_keep_drop_ids.sql").read_text(encoding="utf-8"))
    conn.execute((STG_DIR / "10_filter_demo.sql").read_text(encoding="utf-8"))


def _insert_fixtures(conn: Any) -> None:
    """One valid demo + BN file, a live and a soft-deleted year and group.

    Member-month facts (all live) reference: the live year+group (kept), the
    deleted year (must drop), and the deleted group (must drop).
    """
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, mdcd_demo_num, geo_ansi_state_cd, creatd_dt) "
        "VALUES (%s, '11-W-12345/5', 'CA', now())",
        (DEMO_ID,),
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl_fil_doc "
        "(mdcd_dlvrbl_fil_doc_id, mdcd_demo_id, bdgt_ntrlty_fil_ind, dltd_ind, dlvrbl_fil_name) "
        "VALUES (%s, %s, 1, 0, 'BN.xlsx')",
        (FIL_DOC_ID, DEMO_ID),
    )
    conn.execute(
        "INSERT INTO mysql_raw.bdgt_ntrlty_demo_yr "
        "(bdgt_ntrlty_demo_yr_id, mdcd_demo_id, sqnc_num, demo_yr_strt_dt, demo_yr_end_dt, dltd_ind) "
        "VALUES (%s, %s, 1, '2020-01-01', '2020-12-31', 0), "
        "       (%s, %s, 2, '2021-01-01', '2021-12-31', 1)",
        (LIVE_YEAR, DEMO_ID, DELETED_YEAR, DEMO_ID),
    )
    conn.execute(
        "INSERT INTO mysql_raw.bdgt_ntrlty_mdcd_elgblty_grp "
        "(bdgt_ntrlty_mdcd_elgblty_grp_id, bdgt_ntrlty_mdcd_elgblty_grp_name, dltd_ind) "
        "VALUES (%s, 'Adults', 0), (%s, 'DeletedGrp', 1)",
        (LIVE_GRP, DELETED_GRP),
    )
    # Live member-month actuals: kept combo + deleted-year combo + deleted-group combo.
    conn.execute(
        "INSERT INTO mysql_raw.bdgt_ntrlty_mmbr_mo_actl "
        "(mdcd_dlvrbl_fil_doc_id, bdgt_ntrlty_demo_yr_id, bdgt_ntrlty_mdcd_elgblty_grp_id,"
        " mmbr_mo_actl_val_num, dltd_ind) VALUES "
        "(%s, %s, %s, 100, 0), (%s, %s, %s, 200, 0), (%s, %s, %s, 300, 0)",
        (
            FIL_DOC_ID, LIVE_YEAR, LIVE_GRP,
            FIL_DOC_ID, DELETED_YEAR, LIVE_GRP,
            FIL_DOC_ID, LIVE_YEAR, DELETED_GRP,
        ),
    )
    conn.execute(
        "INSERT INTO mysql_raw.bdgt_ntrlty_mmbr_mo_prjtd "
        "(mdcd_dlvrbl_fil_doc_id, bdgt_ntrlty_demo_yr_id, bdgt_ntrlty_mdcd_elgblty_grp_id,"
        " mmbr_mo_prjtd_val_num, dltd_ind) VALUES (%s, %s, %s, 110, 0)",
        (FIL_DOC_ID, LIVE_YEAR, LIVE_GRP),
    )


def _apply_bn(conn: Any) -> None:
    conn.execute(BN_SQL.read_text(encoding="utf-8"))


def _validation_data(conn: Any) -> dict[str, Any]:
    rows = conn.execute("SELECT validation_data FROM migration.bn_workbook_detail").fetchall()
    assert len(rows) == 1, f"expected exactly one BN workbook row, got {len(rows)}"
    vd = rows[0][0]
    return vd if isinstance(vd, dict) else json.loads(vd)


def test_excludes_soft_deleted_year_and_group(pg_db: psycopg.Connection) -> None:
    """Soft-deleted demo years and eligibility groups must not enter the oracle."""
    _provision(pg_db)
    _insert_fixtures(pg_db)
    _apply_bn(pg_db)

    vd = _validation_data(pg_db)
    years = {dy["demo_yr_id"] for dy in vd["demo_years"]}
    assert years == {LIVE_YEAR}, f"soft-deleted year leaked: {years}"

    live = next(dy for dy in vd["demo_years"] if dy["demo_yr_id"] == LIVE_YEAR)
    grps = {g["mdcd_elgblty_grp_id"] for g in live["eligibility_groups"]}
    assert grps == {LIVE_GRP}, f"soft-deleted group leaked: {grps}"


def test_aggregate_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying the BN loader on a fixed snapshot yields identical output."""
    _provision(pg_db)
    _insert_fixtures(pg_db)
    _apply_bn(pg_db)
    first = _validation_data(pg_db)
    _apply_bn(pg_db)
    second = _validation_data(pg_db)
    assert first == second
