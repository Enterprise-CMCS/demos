"""Live crosswalk-audit tests: DuckDB mysql_scanner attach + passthrough.

Seeds a tiny source MySQL (a fact table with ``dltd_ind`` and an ``*_rfrnc``
lookup), then drives the audit's live query helpers against the real engine.
Skips unless ``MYSQL_URL`` is set (see docker-compose.test.yml). The pure
comparison layer is covered DB-free in ``tests/test_crosswalk_audit.py``.
"""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from typing import Any

import pytest

from migration.lib import Env

pytestmark = pytest.mark.integration

_SCRIPTS_DIR = Path(__file__).resolve().parents[2] / "scripts"
sys.path.insert(0, str(_SCRIPTS_DIR))


def _load():
    spec = importlib.util.spec_from_file_location(
        "crosswalk_audit", _SCRIPTS_DIR / "crosswalk_audit.py"
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["crosswalk_audit"] = module
    spec.loader.exec_module(module)
    return module


ca = _load()


def _seed(conn: Any) -> None:
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS xw_fact")
    cur.execute("DROP TABLE IF EXISTS xw_rfrnc")
    cur.execute("CREATE TABLE xw_fact (stus_cd INT, dltd_ind INT)")
    cur.execute("CREATE TABLE xw_rfrnc (stus_cd INT, stus_name VARCHAR(32))")
    # codes 1,2 active; code 9 only on a soft-deleted row.
    cur.execute(
        "INSERT INTO xw_fact (stus_cd, dltd_ind) VALUES (1,0),(1,0),(2,0),(9,1)"
    )
    cur.execute(
        "INSERT INTO xw_rfrnc (stus_cd, stus_name) VALUES (1,'Pending'),(2,'Approved'),(9,'Gone')"
    )
    cur.close()


def _env(monkeypatch: pytest.MonkeyPatch) -> Env:
    monkeypatch.setenv("MYSQL_URL", os.environ["MYSQL_URL"])
    return Env.load()


def _con(env: Env):
    import duckdb

    con = duckdb.connect()
    ca._attach_source(con, env)
    return con


def test_live_inventory_and_codes(mysql_conn: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    _seed(mysql_conn)
    con = _con(_env(monkeypatch))
    try:
        tables = ca._live_base_tables(con)
        assert {"xw_fact", "xw_rfrnc"} <= tables
        assert "dltd_ind" in ca._live_columns(con, "xw_fact")

        all_codes = ca._distinct_codes(con, "xw_fact", "stus_cd", active_only=False, subset=None)
        active = ca._distinct_codes(con, "xw_fact", "stus_cd", active_only=True, subset=None)
        assert all_codes == {"1", "2", "9"}
        assert active == {"1", "2"}  # code 9 is soft-deleted only
    finally:
        con.close()


def test_live_volumes_and_rfrnc(mysql_conn: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    _seed(mysql_conn)
    con = _con(_env(monkeypatch))
    try:
        vols = ca._code_volumes(con, "xw_fact", "stus_cd", has_dltd_ind=True, subset=None)
        assert vols["1"] == (2, 2)
        assert vols["9"] == (1, 0)

        rfrnc = ca._live_rfrnc(con, "xw_rfrnc", "stus_cd", "stus_name", None)
        assert rfrnc == {"1": "Pending", "2": "Approved", "9": "Gone"}

        subset = ca._distinct_codes(con, "xw_fact", "stus_cd", active_only=False, subset=[1])
        assert subset == {"1"}
    finally:
        con.close()
