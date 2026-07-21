"""Live load-fidelity tests: DuckDB mysql_scanner + postgres_scanner dual-attach.

Seeds a source MySQL and a 1:1 ``mysql_raw`` in the target Postgres, then drives
``load_fidelity._collect_counts`` against the real engines. Skips unless
``MYSQL_URL`` and ``PG_TEST_DSN`` are set (see docker-compose.test.yml).
"""

from __future__ import annotations

import os
from typing import Any

import pytest

from migration.lib import Env
from migration.phases import load_fidelity as lf

pytestmark = pytest.mark.integration


def _seed_mysql(conn: Any) -> None:
    """Source: widget (3 rows), gadget (0 rows)."""
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS widget")
    cur.execute("DROP TABLE IF EXISTS gadget")
    cur.execute("CREATE TABLE widget (id INT PRIMARY KEY, name VARCHAR(32))")
    cur.execute("CREATE TABLE gadget (id INT PRIMARY KEY)")
    cur.execute("INSERT INTO widget (id, name) VALUES (1,'a'),(2,'b'),(3,'c')")
    cur.close()


def _seed_mysql_raw(conn: Any, *, widget_rows: int) -> None:
    """Target mysql_raw: a 1:1 dump (parameterized widget count for drift tests)."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE TABLE mysql_raw.widget (id int, name text)")
    conn.execute("CREATE TABLE mysql_raw.gadget (id int)")
    for i in range(1, widget_rows + 1):
        conn.execute("INSERT INTO mysql_raw.widget (id, name) VALUES (%s, %s)", (i, "x"))


def _env(monkeypatch: pytest.MonkeyPatch) -> Env:
    monkeypatch.setenv("MYSQL_URL", os.environ["MYSQL_URL"])
    monkeypatch.setenv("PG_URL", os.environ["PG_TEST_DSN"])
    return Env.load()


def test_load_fidelity_clean_when_1to1(
    mysql_conn: Any, target_pg: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A faithful 1:1 dump -> every compared table matches."""
    _seed_mysql(mysql_conn)
    _seed_mysql_raw(target_pg, widget_rows=3)

    rows = lf._collect_counts(_env(monkeypatch), ["widget", "gadget"])
    assert lf.summarize_load_fidelity(rows) == []


def test_load_fidelity_detects_dropped_rows(
    mysql_conn: Any, target_pg: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    """mysql_raw missing a row -> reported as a signed-delta mismatch."""
    _seed_mysql(mysql_conn)
    _seed_mysql_raw(target_pg, widget_rows=2)

    rows = lf._collect_counts(_env(monkeypatch), ["widget", "gadget"])
    issues = lf.summarize_load_fidelity(rows)
    assert any("widget" in i and "delta -1" in i for i in issues)
