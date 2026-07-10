"""Role B: DuckDB-backed offline analysis over the pipeline's CSV/Parquet artifacts.

DuckDB's server-less, file-oriented OLAP is the right tool for querying the
deterministic CSVs the pipeline already emits (schema snapshot, reference
data, crosswalks, parity outputs) -- no Postgres required. This module adds a
Parquet companion to the review-friendly CSVs and an in-memory analysis
entrypoint that registers those artifacts as views. Nothing here is on the
cutover-critical gate path; it never connects to a live database.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from migration.lib import REPORTS_DIR, log, rel


def _q(s: str | Path) -> str:
    """Single-quote-escape a path for inlining into DuckDB SQL."""
    return str(s).replace("'", "''")


def to_parquet(csv_path: Path, parquet_path: Path | None = None) -> Path:
    """Write a Parquet copy of ``csv_path`` (columns read as text for fidelity).

    Returns the written Parquet path (``<csv>.parquet`` by default). Reading
    all columns as text keeps the conversion lossless and deterministic for
    diff-oriented artifacts; downstream analysis casts as needed.
    """
    import duckdb

    csv_path = Path(csv_path)
    out = Path(parquet_path) if parquet_path else csv_path.with_suffix(".parquet")
    con = duckdb.connect()
    try:
        con.execute(
            f"COPY (SELECT * FROM read_csv_auto('{_q(csv_path)}', all_varchar=true)) "
            f"TO '{_q(out)}' (FORMAT parquet)"
        )
    finally:
        con.close()
    return out


def csv_dir_to_parquet(directory: Path) -> int:
    """Best-effort: emit a Parquet copy of every ``*.csv`` in ``directory``.

    Returns the count converted. A per-file failure is logged and skipped so a
    single odd CSV never aborts a snapshot/reference dump.
    """
    directory = Path(directory)
    if not directory.is_dir():
        return 0
    count = 0
    for csv_path in sorted(directory.glob("*.csv")):
        try:
            out = to_parquet(csv_path)
        except Exception as e:
            log(f"WARNING: parquet conversion of {rel(csv_path)} failed, skipping: {e}")
            continue
        count += 1
        log(f"wrote {rel(out)}")
    return count


@dataclass(frozen=True)
class ArtifactInfo:
    """One registered artifact: its view name, source path, and shape."""

    name: str
    path: str
    rows: int
    columns: int


def _view_name(path: Path, root: Path) -> str:
    """A SQL-safe view name from an artifact's path relative to ``root``."""
    rel_path = path.relative_to(root).with_suffix("")
    return "_".join(part for part in rel_path.parts).replace("-", "_").replace(".", "_")


def analyze(root: Path = REPORTS_DIR) -> list[ArtifactInfo]:
    """Register every CSV/Parquet under ``root`` as an in-memory DuckDB view.

    Returns one :class:`ArtifactInfo` per artifact (view name, path, row and
    column counts). This is the entrypoint for ad-hoc offline analysis: hold
    the returned connection-less inventory, or extend with project queries
    that join the artifacts -- all without a running Postgres.
    """
    import duckdb

    root = Path(root)
    infos: list[ArtifactInfo] = []
    if not root.is_dir():
        log(f"analyze: {rel(root)} not present")
        return infos

    paths = sorted(p for p in root.rglob("*") if p.suffix in (".csv", ".parquet"))
    con = duckdb.connect()
    try:
        for p in paths:
            name = _view_name(p, root)
            reader = "read_parquet" if p.suffix == ".parquet" else "read_csv_auto"
            try:
                con.execute(
                    f'CREATE OR REPLACE VIEW "{name}" AS '
                    f"SELECT * FROM {reader}('{_q(p)}')"
                )
                count_rows = con.execute(f'SELECT count(*) FROM "{name}"').fetchall()
                rows = int(count_rows[0][0]) if count_rows else 0
                cols = len(con.execute(f'SELECT * FROM "{name}" LIMIT 0').description or [])
            except Exception as e:
                log(f"WARNING: could not register {rel(p)}: {e}")
                continue
            infos.append(ArtifactInfo(name=name, path=rel(p), rows=rows, columns=cols))
    finally:
        con.close()
    for i in infos:
        log(f"  {i.name}: {i.rows} rows x {i.columns} cols ({i.path})")
    log(f"analyze: registered {len(infos)} artifact(s) under {rel(root)}")
    return infos
