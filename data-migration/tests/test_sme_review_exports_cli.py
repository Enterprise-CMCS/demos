"""DB-free unit tests for scripts/sme_review_exports.py.

Covers the pure helpers (CSV emission, output-path stamping, arg parsing) that
need no database. The DB-backed query + end-to-end tiers live in
tests/sql/test_sme_review_exports.py. The exporter lives under scripts/ (not an
installed package), so it is imported by path.
"""

from __future__ import annotations

import csv
import importlib.util
import re
import sys
from pathlib import Path
from typing import Any

import pytest

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
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


def test_write_csv_headers_and_escaping(tmp_path: Path) -> None:
    """Header order follows the column list; commas/quotes/newlines are escaped."""
    out = tmp_path / "out.csv"
    rows = [
        {"a": 1, "b": "plain"},
        {"a": 2, "b": 'has, comma "and" quote\nnewline'},
    ]
    sre.write_csv(rows, out, ["a", "b"])
    with out.open(encoding="utf-8", newline="") as fh:
        parsed = list(csv.DictReader(fh))
    assert [r["a"] for r in parsed] == ["1", "2"]
    assert parsed[1]["b"] == 'has, comma "and" quote\nnewline'


def test_write_csv_writes_header_when_empty(tmp_path: Path) -> None:
    """An empty result still emits a header row (a valid, if empty, export)."""
    out = tmp_path / "empty.csv"
    sre.write_csv([], out, ["x", "y"])
    assert out.read_text(encoding="utf-8").splitlines()[0] == "x,y"


def test_stamped_path_uses_prefix_and_stamp(tmp_path: Path) -> None:
    """Output filename is <prefix>_<stamp>.csv under the chosen directory."""
    p = sre.stamped_path(tmp_path, "sme_review_othr_names")
    assert p.parent == tmp_path
    assert p.name.startswith("sme_review_othr_names_")
    assert p.suffix == ".csv"


def test_parse_args_defaults_to_both() -> None:
    """No subcommand defaults to running both exports."""
    args = sre.parse_args([])
    assert args.command == "both"


@pytest.mark.parametrize(
    "command", ["othr-names", "comments-snapshot", "authorities-snapshot", "both"]
)
def test_parse_args_accepts_each_subcommand(command: str) -> None:
    assert sre.parse_args([command]).command == command


def test_parse_args_rejects_unknown_subcommand() -> None:
    """argparse rejects an unknown subcommand with a non-zero exit."""
    with pytest.raises(SystemExit) as exc:
        sre.parse_args(["not-a-command"])
    assert exc.value.code != 0


# --- authorities snapshot (DB-free structure + drift guard) ---------------- #

_AUTHORITY_TIERS = {"instance", "reference", "library", "bene_link", "pgm_dtl"}


def test_authority_tables_manifest_shape() -> None:
    """Every entry declares the four manifest flags with sane tier semantics."""
    assert sre.AUTHORITY_TABLES, "authority table map must not be empty"
    for table, meta in sre.AUTHORITY_TABLES.items():
        assert set(meta) == {"tier", "is_history", "is_pending", "pgm_dtl_overlap"}
        assert meta["tier"] in _AUTHORITY_TIERS
        # history tables are the technical _hstry / _load mirrors
        assert meta["is_history"] == (table.endswith(("_hstry", "_load")))
        # pending mirrors carry the mdcd_pendg_ prefix and are pgm_dtl overlaps
        assert meta["is_pending"] == table.startswith("mdcd_pendg_")
        if meta["is_pending"]:
            assert meta["pgm_dtl_overlap"] is True
            assert meta["tier"] == "pgm_dtl"


def test_authority_manifest_columns_match_flags() -> None:
    """The manifest column set exposes the per-table flags plus row accounting."""
    assert sre.AUTHORITY_MANIFEST_COLUMNS == [
        "source_table",
        "tier",
        "is_history",
        "is_pending",
        "pgm_dtl_overlap",
        "present",
        "row_count",
        "deleted_row_count",
        "csv_file",
    ]


def test_authority_tables_cover_schema_snapshot() -> None:
    """Drift guard: the hardcoded map must equal the authority tables in the
    committed MySQL schema snapshot, so a new/renamed source table fails CI
    rather than being silently dropped from the SME snapshot."""
    stats = _SCRIPTS_DIR.parent / "reports" / "schema_snapshot" / "table_stats.csv"
    pattern = re.compile(r"wvr_authrty|expndtr_authrty|expndtr_cap|bene_grp_asctd")
    with stats.open(encoding="utf-8", newline="") as fh:
        snapshot_tables = {
            row["TABLE_NAME"] for row in csv.DictReader(fh) if pattern.search(row["TABLE_NAME"])
        }
    assert snapshot_tables == set(sre.AUTHORITY_TABLES), (
        "AUTHORITY_TABLES drifted from reports/schema_snapshot/table_stats.csv; "
        f"missing={snapshot_tables - set(sre.AUTHORITY_TABLES)} "
        f"stale={set(sre.AUTHORITY_TABLES) - snapshot_tables}"
    )
