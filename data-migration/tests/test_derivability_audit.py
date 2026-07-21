"""Unit tests for the pure helpers in scripts/derivability_audit.py.

The audit lives under scripts/ (not an installed package), so it is imported
here by path. These cover the fail-closed verdict join (the forcing function
that keeps reports/inputs/derivability_verdicts.yaml in lockstep with the live gap
set) and the deterministic AsciiDoc fragment rendering.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(_SCRIPTS_DIR))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "docs" / "tools"))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, _SCRIPTS_DIR / f"{name}.py")
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


da = _load("derivability_audit")


def _gaps() -> list[dict[str, str]]:
    return [
        {"target_table": "users", "target_column": "person_type_id", "target_type": "text"},
        {"target_table": "users", "target_column": "cognito_subject", "target_type": "uuid"},
        {"target_table": "private_comment", "target_column": "deliverable_id", "target_type": "uuid"},
    ]


def _verdicts() -> dict[str, dict]:
    return {
        "users.person_type_id": {"derivable": True, "via": "Nth", "path": "role chain"},
        "users.cognito_subject": {
            "derivable": False,
            "via": "no",
            "path": "net-new identity",
            "evidence": "AWS Cognito identity backfilled at first login.",
        },
        "private_comment.deliverable_id": {
            "derivable": False,
            "via": "no",
            "path": "attaches to a demonstration",
            "evidence": "Comment is keyed to mdcd_demo_id, not a deliverable.",
        },
    }


def test_validate_verdicts_passes_when_sets_match() -> None:
    gap_keys = {f"{g['target_table']}.{g['target_column']}" for g in _gaps()}
    da.validate_verdicts(gap_keys, _verdicts())  # no raise


def test_validate_verdicts_fails_on_missing_verdict() -> None:
    gap_keys = {"users.person_type_id", "users.new_gap"}
    with pytest.raises(SystemExit) as exc:
        da.validate_verdicts(gap_keys, {"users.person_type_id": {"derivable": True}})
    assert "users.new_gap" in str(exc.value)


def test_validate_verdicts_fails_on_orphan_verdict() -> None:
    gap_keys = {"users.person_type_id"}
    verdicts = {"users.person_type_id": {"derivable": True}, "users.gone": {"derivable": False}}
    with pytest.raises(SystemExit) as exc:
        da.validate_verdicts(gap_keys, verdicts)
    assert "users.gone" in str(exc.value)


def test_emit_verdict_marks_derivable_and_is_deterministic() -> None:
    out1 = da.emit_verdict(_gaps(), _verdicts())
    out2 = da.emit_verdict(_gaps(), _verdicts())
    assert out1 == out2
    assert "| `users.person_type_id` | `text` | yes -- Nth | role chain" in out1
    assert "| `users.cognito_subject` | `uuid` | no | net-new identity" in out1
    assert out1.count("|===") == 2  # one table: open + close delimiter


def test_emit_evidence_groups_identical_text_and_skips_derivable() -> None:
    gaps = [
        *_gaps(),
        {"target_table": "public_comment", "target_column": "deliverable_id", "target_type": "uuid"},
    ]
    verdicts = _verdicts()
    verdicts["public_comment.deliverable_id"] = {
        "derivable": False,
        "via": "no",
        "path": "attaches to a demonstration",
        "evidence": "Comment is keyed to mdcd_demo_id, not a deliverable.",
    }
    out = da.emit_evidence(gaps, verdicts)
    # The two deliverable_id columns share evidence -> one combined block.
    assert "*`private_comment.deliverable_id`, `public_comment.deliverable_id`*" in out
    # Derivable gap never appears in the evidence section.
    assert "person_type_id" not in out
    assert out.count("(NOT NULL `uuid`)") == 2


def test_emit_classification_orders_and_counts() -> None:
    counts = {"mapped": 25, "GAP_in_scope": 13, "GAP_table_pending": 229}
    out = da.emit_classification(counts)
    assert "| `mapped` | 25 |" in out
    assert "| `GAP_in_scope` | 13 |" in out
    # missing classifications render as 0
    assert "| `default` | 0 |" in out
    assert out.index("`mapped`") < out.index("`GAP_in_scope`")


def test_emit_proposals_renders_full_histogram() -> None:
    out = da.emit_proposals({"high": 27, "medium": 2, "low": 3, "none": 61})
    for line in ("| `high` | 27 |", "| `medium` | 2 |", "| `low` | 3 |", "| `none` | 61 |"):
        assert line in out


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
