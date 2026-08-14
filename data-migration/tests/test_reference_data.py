"""Unit tests for the pure helpers in migration.phases.reference_data.

The DuckDB <-> MySQL passthrough needs a live source and is exercised in
integration (mirroring schema_snapshot). These tests cover the identifier
guard and dump-SQL construction that drive the artifacts; the reused
``_write_csv``/``_mysql_attach_dsn`` helpers are covered by
``test_schema_snapshot.py``.
"""

from __future__ import annotations

import pytest

from migration.phases import reference_data as rd


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("mdcd_demo_stus_rfrnc", True),
        ("v_demo_status_dtl", True),
        ("geo_ansi_state_rfrnc", True),
        ("Table123", True),
        ("bad name", False),
        ("evil'; DROP TABLE x;--", False),
        ("with-dash", False),
        ("with.dot", False),
        ("", False),
    ],
)
def test_is_safe_identifier(name: str, expected: bool) -> None:
    assert rd._is_safe_identifier(name) is expected


def test_dump_sql_orders_by_first_column() -> None:
    assert rd._dump_sql("mdcd_demo_stus_rfrnc") == "SELECT * FROM mdcd_demo_stus_rfrnc ORDER BY 1"


def test_views_constant_are_safe_identifiers() -> None:
    assert rd._VIEWS  # non-empty
    assert all(rd._is_safe_identifier(v) for v in rd._VIEWS)


def test_rfrnc_list_sql_anchors_suffix_and_scopes_database() -> None:
    sql = rd._RFRNC_LIST_SQL
    assert "table_schema = DATABASE()" in sql
    assert "table_type = 'BASE TABLE'" in sql
    assert "%\\_rfrnc" in sql  # literal underscore + anchored suffix
