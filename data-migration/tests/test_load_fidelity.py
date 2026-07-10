"""Unit coverage for the load-fidelity check's pure diff logic.

The DuckDB dual-attach collection needs a live MySQL source and a populated
mysql_raw and is exercised in the integration tier.
"""

from __future__ import annotations

import pytest

from migration.phases import load_fidelity as lf


def test_scalar_int_returns_aggregate_value_not_rowcount() -> None:
    """Regression: the pg-side count must return the aggregate, not the row count.

    The original bug wrapped ``postgres_query('pg', 'SELECT count(*) ...')`` in
    an outer ``count(*)``, which counts the single aggregate row (always 1)
    instead of returning the count it already computed. ``_scalar_int`` must
    read the value out of the first row.
    """
    duckdb = pytest.importorskip("duckdb")
    con = duckdb.connect()
    try:
        con.execute("CREATE TABLE t (id INTEGER)")
        con.executemany("INSERT INTO t VALUES (?)", [(i,) for i in range(3)])
        # The aggregate already yields one row holding the value 3.
        assert lf._scalar_int(con, "SELECT count(*) FROM t") == 3
        # The historical bug shape would have collapsed that to 1:
        bug = con.execute("SELECT count(*) FROM (SELECT count(*) FROM t)").fetchall()
        assert bug[0][0] == 1
    finally:
        con.close()


def test_scalar_int_handles_zero_and_empty() -> None:
    """A 0-count (one row, value 0) and a truly empty result both read as 0."""
    duckdb = pytest.importorskip("duckdb")
    con = duckdb.connect()
    try:
        con.execute("CREATE TABLE t (id INTEGER)")
        assert lf._scalar_int(con, "SELECT count(*) FROM t") == 0
        assert lf._scalar_int(con, "SELECT id FROM t WHERE false") == 0
    finally:
        con.close()


def test_count_row_matches() -> None:
    assert lf.CountRow("t", 10, 10).matches is True
    assert lf.CountRow("t", 10, 9).matches is False


def test_summarize_clean() -> None:
    rows = [lf.CountRow("a", 5, 5), lf.CountRow("b", 0, 0)]
    assert lf.summarize_load_fidelity(rows) == []


def test_summarize_reports_signed_delta() -> None:
    rows = [
        lf.CountRow("a", 5, 5),
        lf.CountRow("b", 10, 7),
        lf.CountRow("c", 3, 8),
    ]
    issues = lf.summarize_load_fidelity(rows)
    assert len(issues) == 2
    joined = " ".join(issues)
    assert "b: source=10 mysql_raw=7 (delta -3)" in joined
    assert "c: source=3 mysql_raw=8 (delta +5)" in joined


def test_is_safe_identifier() -> None:
    assert lf._is_safe_identifier("mdcd_demo")
    assert lf._is_safe_identifier("Table_1")
    assert not lf._is_safe_identifier("")
    assert not lf._is_safe_identifier("drop; table")
    assert not lf._is_safe_identifier("a.b")
    assert not lf._is_safe_identifier('a"b')
