"""Unit coverage for the role-B DuckDB analysis helpers (in-memory, no server)."""

from __future__ import annotations

from pathlib import Path

from migration import duck


def _write_csv(path: Path, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def test_to_parquet_roundtrip(tmp_path: Path) -> None:
    """A CSV converts to a Parquet that DuckDB can read back with the same rows."""
    import duckdb

    csv = tmp_path / "t.csv"
    _write_csv(csv, "a,b\n1,x\n2,y\n")
    out = duck.to_parquet(csv)
    assert out == tmp_path / "t.parquet"
    assert out.exists()
    con = duckdb.connect()
    try:
        rows = con.execute(f"SELECT count(*) FROM read_parquet('{out}')").fetchall()[0][0]
    finally:
        con.close()
    assert rows == 2


def test_csv_dir_to_parquet_counts(tmp_path: Path) -> None:
    """Every CSV in a directory gets a Parquet companion; count is returned."""
    _write_csv(tmp_path / "one.csv", "x\n1\n")
    _write_csv(tmp_path / "two.csv", "y\n2\n3\n")
    assert duck.csv_dir_to_parquet(tmp_path) == 2
    assert (tmp_path / "one.parquet").exists()
    assert (tmp_path / "two.parquet").exists()


def test_csv_dir_to_parquet_missing_dir(tmp_path: Path) -> None:
    assert duck.csv_dir_to_parquet(tmp_path / "nope") == 0


def test_analyze_registers_artifacts(tmp_path: Path) -> None:
    """analyze() registers nested CSV/Parquet artifacts with row/column shape."""
    _write_csv(tmp_path / "schema_snapshot" / "columns.csv", "t,c\na,b\n")
    _write_csv(tmp_path / "crosswalks" / "demo.csv", "k,v\n1,2\n3,4\n")
    infos = {i.name: i for i in duck.analyze(tmp_path)}
    assert "schema_snapshot_columns" in infos
    assert infos["schema_snapshot_columns"].rows == 1
    assert infos["schema_snapshot_columns"].columns == 2
    assert infos["crosswalks_demo"].rows == 2


def test_analyze_missing_root(tmp_path: Path) -> None:
    assert duck.analyze(tmp_path / "nope") == []
