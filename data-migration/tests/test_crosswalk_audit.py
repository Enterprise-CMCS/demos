"""Unit coverage for the crosswalk audit's pure comparison + rendering layer.

The DuckDB MySQL-attach collection needs a live source and is exercised in the
integration tier (``tests/integration``). Everything here is DB-free: code/label
diffing, snapshot drift, structural existence, CSV parsing, the registry split,
report text, and deterministic fragment emission. The audit lives under
``scripts/`` (not an installed package), so it is imported by path.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
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


# --- _norm_code / _sort_key ------------------------------------------------ #


def test_norm_code_normalizes_types() -> None:
    assert ca._norm_code(1) == "1"
    assert ca._norm_code("1 ") == "1"
    assert ca._norm_code(1.0) == "1"
    assert ca._norm_code(True) == "1"
    assert ca._norm_code("AK") == "AK"
    assert ca._norm_code(None) is None
    assert ca._norm_code("") is None
    assert ca._norm_code("  ") is None


def test_sort_key_orders_numeric_before_text_and_by_value() -> None:
    codes = ["10", "2", "AK", "1"]
    assert sorted(codes, key=ca._sort_key) == ["1", "2", "10", "AK"]


# --- audit_code_crosswalk -------------------------------------------------- #


def _code_audit(**over):
    base = dict(
        name="crosswalk_demo_status",
        crosswalk={"1": "Pending", "2": "Approved"},
        live_fact_all={"1", "2"},
        live_fact_active={"1", "2"},
        live_rfrnc={"1": "Pending", "2": "Approved"},
        snapshot_rfrnc={"1": "Pending", "2": "Approved"},
        volumes={"1": (5, 4), "2": (10, 10)},
        has_dltd_ind=True,
    )
    base.update(over)
    return ca.audit_code_crosswalk(**base)


def test_clean_code_crosswalk_is_not_blocking() -> None:
    a = _code_audit()
    assert a.unmapped_all == []
    assert a.unmapped_active == []
    assert a.orphans == []
    assert a.label_drift == []
    assert a.blocking is False
    assert a.volumes == [("1", 5, 4), ("2", 10, 10)]


def test_unmapped_live_code_is_blocking() -> None:
    """A live code absent from the crosswalk is the load-blocking finding."""
    a = _code_audit(live_fact_all={"1", "2", "9"}, live_fact_active={"1", "2", "9"})
    assert a.unmapped_all == ["9"]
    assert a.unmapped_active == ["9"]
    assert a.blocking is True


def test_unmapped_only_in_deleted_rows_not_in_active() -> None:
    a = _code_audit(live_fact_all={"1", "2", "9"}, live_fact_active={"1", "2"})
    assert a.unmapped_all == ["9"]  # still blocking (mirrors *_check.sql, no dltd filter)
    assert a.unmapped_active == []
    assert a.blocking is True


def test_orphan_crosswalk_code_absent_from_live_rfrnc() -> None:
    a = _code_audit(live_rfrnc={"1": "Pending"})
    assert a.orphans == ["2"]
    assert a.blocking is False  # orphans never block


def test_label_drift_tolerates_case_and_whitespace() -> None:
    a = _code_audit(live_rfrnc={"1": " pending ", "2": "APPROVED"})
    assert a.label_drift == []


def test_label_drift_flags_real_rename() -> None:
    a = _code_audit(live_rfrnc={"1": "Pending", "2": "Accepted"})
    assert a.label_drift == [("2", "Approved", "Accepted")]


def test_snapshot_drift_added_removed_renamed() -> None:
    a = _code_audit(
        live_rfrnc={"1": "Pending", "3": "New"},
        snapshot_rfrnc={"1": "Pending Old", "2": "Approved"},
    )
    assert a.snapshot_added == ["3"]
    assert a.snapshot_removed == ["2"]
    assert a.snapshot_renamed == [("1", "Pending Old", "Pending")]


# --- audit_structural_crosswalk -------------------------------------------- #


def _structural_rows():
    return [
        ca.StructuralRow(table="mdcd_demo", columns=("proj_ofcr_user_id",), pending=False),
        ca.StructuralRow(table="mdcd_mc_pgm_dtl", columns=("from_dt", "to_dt"), pending=False),
        ca.StructuralRow(table="mdcd_gone_pgm_dtl", columns=("from_dt",), pending=True),
    ]


def test_structural_clean() -> None:
    a = ca.audit_structural_crosswalk(
        name="crosswalk_pgm_dtl_tag",
        rows=_structural_rows()[:2],
        live_tables={"mdcd_demo", "mdcd_mc_pgm_dtl"},
        live_columns={
            "mdcd_demo": {"proj_ofcr_user_id"},
            "mdcd_mc_pgm_dtl": {"from_dt", "to_dt"},
        },
        volumes={"mdcd_demo": (9, 6), "mdcd_mc_pgm_dtl": (3, 3)},
    )
    assert a.blocking is False
    assert a.volumes == [("mdcd_demo", 9, 6), ("mdcd_mc_pgm_dtl", 3, 3)]


def test_structural_missing_table_and_column_block() -> None:
    a = ca.audit_structural_crosswalk(
        name="crosswalk_pgm_dtl_tag",
        rows=_structural_rows(),
        live_tables={"mdcd_demo", "mdcd_mc_pgm_dtl"},
        live_columns={"mdcd_demo": {"other_col"}, "mdcd_mc_pgm_dtl": {"from_dt"}},
        volumes={},
    )
    assert a.missing_tables == ["mdcd_gone_pgm_dtl"]
    assert ("mdcd_demo", "proj_ofcr_user_id") in a.missing_columns
    assert ("mdcd_mc_pgm_dtl", "to_dt") in a.missing_columns
    assert a.pending_rows == ["mdcd_gone_pgm_dtl"]
    assert a.blocking is True


def test_structural_empty_column_value_skipped() -> None:
    """An empty column value (SME-pending date column) is not a missing column."""
    a = ca.audit_structural_crosswalk(
        name="crosswalk_pgm_dtl_tag",
        rows=[ca.StructuralRow(table="t", columns=("",), pending=True)],
        live_tables={"t"},
        live_columns={"t": set()},
        volumes={"t": (0, 0)},
    )
    assert a.missing_columns == []
    assert a.blocking is False


# --- CSV loaders ----------------------------------------------------------- #


def test_read_crosswalk_skips_blank_code(tmp_path: Path) -> None:
    p = tmp_path / "demo_status.csv"
    p.write_text(
        "legacy_int_cd,legacy_name,demos_text_id,notes\n"
        "1,Pending,Under Review,\n"
        ",Blank,Skip,deliberately blank\n"
        "2, Approved ,Approved,\n",
        encoding="utf-8",
    )
    out = ca.read_crosswalk(p, "legacy_int_cd", "legacy_name")
    assert out == {"1": "Pending", "2": "Approved"}


def test_read_rfrnc_csv_applies_subset(tmp_path: Path) -> None:
    p = tmp_path / "role_rfrnc.csv"
    p.write_text(
        "role_cd,role_name,creatd_dt\n1,Admin,x\n2,PO,x\n4,Analyst,x\n",
        encoding="utf-8",
    )
    full = ca.read_rfrnc_csv(p, "role_cd", "role_name", None)
    assert full == {"1": "Admin", "2": "PO", "4": "Analyst"}
    subset = ca.read_rfrnc_csv(p, "role_cd", "role_name", {"1", "4"})
    assert subset == {"1": "Admin", "4": "Analyst"}


def test_read_crosswalk_missing_column_dies(tmp_path: Path) -> None:
    p = tmp_path / "x.csv"
    p.write_text("a,b\n1,2\n", encoding="utf-8")
    with pytest.raises(SystemExit):
        ca.read_crosswalk(p, "legacy_int_cd", "legacy_name")


def test_read_structural_rows_detects_pending_and_skips_blank_table(tmp_path: Path) -> None:
    p = tmp_path / "pgm.csv"
    p.write_text(
        "source_table,tag_name,from_dt_col,to_dt_col,additional_attrs,notes\n"
        "mdcd_mc_pgm_dtl,Managed Care,from_dt,to_dt,,\n"
        "mdcd_bnfts_pgm_dtl,,from_dt,to_dt,,no canonical tag\n"
        ",,,,,blank table row\n",
        encoding="utf-8",
    )
    spec = ca.CrosswalkSpec(
        name="crosswalk_pgm_dtl_tag",
        csv="pgm.csv",
        kind="structural",
        source={
            "tables_from_column": "source_table",
            "columns_from": ["from_dt_col", "to_dt_col"],
            "pending_blank_column": "tag_name",
        },
    )
    monkey_csv = tmp_path / "pgm.csv"
    rows = _read_structural_with_root(ca, spec, monkey_csv.parent)
    assert [r.table for r in rows] == ["mdcd_mc_pgm_dtl", "mdcd_bnfts_pgm_dtl"]
    assert rows[0].pending is False
    assert rows[1].pending is True
    assert rows[0].columns == ("from_dt", "to_dt")


def _read_structural_with_root(module, spec, root: Path):
    """read_structural_rows joins spec.csv onto REPORTS_DIR; point it at tmp."""
    import unittest.mock as mock

    with mock.patch.object(module, "REPORTS_DIR", root):
        return module.read_structural_rows(spec)


# --- load_registry --------------------------------------------------------- #


def test_load_registry_classifies_kinds() -> None:
    """The real registry resolves all 13 crosswalks into code/structural kinds."""
    specs = ca.load_registry()
    by_name = {s.name: s for s in specs}
    assert by_name["crosswalk_demo_status"].kind == "code"
    assert by_name["crosswalk_demonstration_role"].kind == "structural"
    assert by_name["crosswalk_pgm_dtl_tag"].kind == "structural"
    assert by_name["crosswalk_system_role"].source.get("code_subset") == [1, 4]
    assert all(s.kind in ("code", "structural") for s in specs)


# --- _subset_clause / _safe_ident ----------------------------------------- #


def test_subset_clause_builds_in_list() -> None:
    assert ca._subset_clause("role_cd", [1, 4]) == " AND role_cd IN (1, 4)"
    assert ca._subset_clause("role_cd", None) == ""


def test_subset_clause_rejects_non_int() -> None:
    with pytest.raises(SystemExit):
        ca._subset_clause("role_cd", ["1; DROP"])


def test_safe_ident_rejects_injection() -> None:
    assert ca._safe_ident("mdcd_demo", "table") == "mdcd_demo"
    with pytest.raises(SystemExit):
        ca._safe_ident("a; DROP TABLE x", "table")


# --- render_report --------------------------------------------------------- #


def test_render_report_flags_blocking() -> None:
    blocking = _code_audit(live_fact_all={"1", "2", "9"}, live_fact_active={"1", "2", "9"})
    text = ca.render_report(
        [blocking], [], mysql_db="cma_pro", baseline="2026-06-09T00:00:00Z", skipped=[]
    )
    assert "OVERALL: ISSUES (1 blocking)" in text
    assert "## Blocking findings" in text
    assert "`9`" in text


def test_deferred_code_audit_renders_and_does_not_block() -> None:
    a = ca._deferred_code_audit("crosswalk_document_type")
    assert a.deferred is True
    assert a.blocking is False
    text = ca.render_report([a], [], mysql_db="cma_pro", baseline="b", skipped=[])
    assert "OVERALL: CLEAN" in text
    assert "deferred" in text.lower()


def test_render_report_clean() -> None:
    text = ca.render_report(
        [_code_audit()], [], mysql_db="cma_pro", baseline="b", skipped=[]
    )
    assert "OVERALL: CLEAN" in text
    assert "## Blocking findings" not in text


# --- emit_fragments -------------------------------------------------------- #


def test_emit_fragments_deterministic_and_status(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ca, "FRAGMENT_DIR", tmp_path)
    blocking = _code_audit(live_fact_all={"1", "2", "9"}, live_fact_active={"1", "2", "9"})
    ca.emit_fragments([blocking], [], mysql_db="cma_pro", baseline="b")
    attrs = (tmp_path / "crosswalk-audit-attrs.adoc").read_text()
    assert "Generated by scripts/crosswalk_audit.py" in attrs
    assert ":crosswalk-audit-status: ISSUES" in attrs
    assert ":crosswalk-audit-blocking: 1" in attrs
    summary = (tmp_path / "crosswalk-audit-summary.adoc").read_text()
    assert "crosswalk_demo_status" in summary
    assert "unmapped" in summary
    findings = (tmp_path / "crosswalk-audit-findings.adoc").read_text()
    assert "`9`" in findings
