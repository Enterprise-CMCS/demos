"""Smoke tests for the P1 demonstration id-map scaffolding.

Schema-only file/content checks; full SQL execution against a loaded
mysql_raw is covered by CI integration once a source DB is available
(mirrors tutorial-add-a-new-transform.adoc step 6). These assert the
files exist, the maps are created with the canonical shape, and the
population is idempotent and drawn only from the PMDA-valid filter views
(the demonstration-ID invariant).
"""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

CREATE_FILES = (
    "sql/05_id_maps/10_mdcd_demo.sql",
    "sql/05_id_maps/11_mdcd_pendg_demo.sql",
)
POPULATE_FILES = (
    "sql/10_stg/18_populate_id_map_mdcd_demo.sql",
    "sql/10_stg/19_populate_id_map_mdcd_pendg_demo.sql",
)


def test_idmap_files_present() -> None:
    for rel in (*CREATE_FILES, *POPULATE_FILES):
        assert (PROJECT_ROOT / rel).is_file(), rel


def test_idmap_creation_shape() -> None:
    # Case-insensitive: pg_format owns keyword/type case (uppercase keywords,
    # lowercase types), so assert structure, not casing.
    for rel in CREATE_FILES:
        sql = (PROJECT_ROOT / rel).read_text(encoding="utf-8").lower()
        assert "legacy_int_id bigint primary key" in sql
        assert "gen_random_uuid()" in sql
        assert "create table if not exists migration._id_map_" in sql


def test_population_is_idempotent_and_pmda_scoped() -> None:
    demo = (PROJECT_ROOT / "sql/10_stg/18_populate_id_map_mdcd_demo.sql").read_text(encoding="utf-8")
    assert "ON CONFLICT DO NOTHING" in demo
    assert "stg._valid_demo_ids" in demo

    pendg = (PROJECT_ROOT / "sql/10_stg/19_populate_id_map_mdcd_pendg_demo.sql").read_text(
        encoding="utf-8"
    )
    assert "ON CONFLICT DO NOTHING" in pendg
    assert "stg._valid_pendg_demo_ids" in pendg


def test_filter_views_use_real_snapshot_columns() -> None:
    # Regression guard against the pre-snapshot placeholder column names.
    demo_filter = (PROJECT_ROOT / "sql/10_stg/10_filter_demo.sql").read_text(encoding="utf-8")
    assert "mdcd_demo_num" in demo_filter
    assert "geo_ansi_state_cd" in demo_filter
    assert "creatd_dt" in demo_filter
    assert "demo_prjct_nbr" not in demo_filter  # old placeholder
    assert "crtd_dttm" not in demo_filter  # old placeholder
