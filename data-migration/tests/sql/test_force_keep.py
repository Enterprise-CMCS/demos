"""Live-PG harness for force-keep override integrity (CODE_REVIEW H5).

A force-keep id that does not exist in the source must neither survive the
filter view's ``keep`` union (so no phantom UUID is minted) nor pass the
build-time assertion. Runs the real SQL against a throwaway Postgres
(``PG_TEST_DSN``).
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

from migration.phases import build

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
STG_DIR = ROOT / "sql" / "10_stg"


def _provision(conn: Any) -> None:
    """Minimal mysql_raw.mdcd_demo + override tables + the demo filter view."""
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA stg")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo ("
        " mdcd_demo_id bigint, mdcd_demo_num text, geo_ansi_state_cd text,"
        " creatd_dt timestamptz, state_prfmnc_yr_strt_dt timestamptz)"
    )
    conn.execute((STG_DIR / "00_keep_drop_ids.sql").read_text(encoding="utf-8"))
    conn.execute((STG_DIR / "10_filter_demo.sql").read_text(encoding="utf-8"))


def _insert_valid_demo(conn: Any, demo_id: int) -> None:
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, mdcd_demo_num, geo_ansi_state_cd, creatd_dt) "
        "VALUES (%s, '11-W-12345/5', 'CA', now())",
        (demo_id,),
    )


def test_phantom_keep_id_not_minted(pg_db: psycopg.Connection) -> None:
    """A force-keep id absent from the source must not appear in the valid view."""
    _provision(pg_db)
    _insert_valid_demo(pg_db, 1)
    pg_db.execute("INSERT INTO stg._keep_ids (entity, legacy_id) VALUES ('mdcd_demo', 999)")

    ids = {r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_demo_ids").fetchall()}
    assert 1 in ids
    assert 999 not in ids


def test_real_keep_id_survives(pg_db: psycopg.Connection) -> None:
    """A force-keep id that exists is honored (intersect does not over-filter)."""
    _provision(pg_db)
    # A row that FAILS the project-number rule, rescued by an existing keep id.
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_id, mdcd_demo_num, geo_ansi_state_cd, creatd_dt) "
        "VALUES (7, 'BOGUS', 'CA', now())"
    )
    pg_db.execute("INSERT INTO stg._keep_ids (entity, legacy_id) VALUES ('mdcd_demo', 7)")

    ids = {r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_demo_ids").fetchall()}
    assert 7 in ids


def test_build_assert_dies_on_phantom_keep(pg_db: psycopg.Connection) -> None:
    """The build-time assertion hard-fails on a keep id absent from the source."""
    _provision(pg_db)
    _insert_valid_demo(pg_db, 1)
    pg_db.execute("INSERT INTO stg._keep_ids (entity, legacy_id) VALUES ('mdcd_demo', 999)")

    with pytest.raises(SystemExit):
        build._assert_overrides_exist(pg_db)


def test_build_assert_dies_on_unknown_entity(pg_db: psycopg.Connection) -> None:
    """An override naming an unmapped entity is a typo and must hard-fail."""
    _provision(pg_db)
    pg_db.execute("INSERT INTO stg._drop_ids (entity, legacy_id) VALUES ('not_a_table', 1)")

    with pytest.raises(SystemExit):
        build._assert_overrides_exist(pg_db)


def test_build_assert_passes_for_real_ids(pg_db: psycopg.Connection) -> None:
    """When every override id exists in its source, the assertion passes."""
    _provision(pg_db)
    _insert_valid_demo(pg_db, 1)
    pg_db.execute("INSERT INTO stg._keep_ids (entity, legacy_id) VALUES ('mdcd_demo', 1)")
    pg_db.execute("INSERT INTO stg._drop_ids (entity, legacy_id) VALUES ('mdcd_demo', 1)")

    build._assert_overrides_exist(pg_db)
