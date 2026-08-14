"""Offline structural checks on the committed demonstration flow trace (no DB).

The live freshness gate (``tests/sql/test_demonstration_flow_live.py``) proves
the committed manifest matches a fresh end-to-end run, but it self-skips without
``PG_TEST_DSN``. These tests run in the default (no-DB) tier and assert the
committed ``expected_manifest.json`` is internally consistent and that the
committed trace partial re-renders identically from it, so a hand-edit or a
half-regenerated pair is caught even when Docker is unavailable.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "tests" / "sql" / "fixtures" / "demo_flow" / "expected_manifest.json"
TRACE_PATH = REPO_ROOT / "docs" / "shared" / "generated" / "live" / "demonstration-flow-trace.adoc"

sys.path.insert(0, str(REPO_ROOT / "docs" / "tools"))
import table_flow_trace as tft  # noqa: E402  # ty: ignore[unresolved-import]

MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
COUNTS = MANIFEST["stage_counts"]
ROWS = MANIFEST["rows"]

VALID_DISPOSITIONS = {
    "loaded",
    "held_back_approved_field",
    "held_back_state",
    "excluded_soft_delete",
    "filtered_bad_project_number",
}


def test_manifest_top_level_shape() -> None:
    assert MANIFEST["table"] == "demonstration"
    assert MANIFEST["source_anchor"] == "mysql_raw.mdcd_demo"
    assert "table_flow_trace.py" in MANIFEST["generated_by"]
    assert MANIFEST["fixture"].endswith("seed_mdcd_demo.sql")


def test_isa_mirrors_loaded_count() -> None:
    loaded = COUNTS["demos_app.demonstration"]
    assert COUNTS["demos_app.application (Demonstration)"] == loaded


def test_provenance_parity_is_zero() -> None:
    assert COUNTS["migration._parity_demonstration_id_provenance"] == 0


def test_funnel_is_monotonic() -> None:
    assert (
        COUNTS["mysql_raw.mdcd_demo"]
        >= COUNTS["stg._valid_demo_ids"]
        >= COUNTS["stg.demonstration_resolved"]
        >= COUNTS["demos_app.demonstration"]
    )
    assert COUNTS["migration._id_map_mdcd_demo"] == COUNTS["stg._valid_demo_ids"]


def test_rows_account_for_every_source_row() -> None:
    assert len(ROWS) == COUNTS["mysql_raw.mdcd_demo"]
    loaded = [r for r in ROWS if r["disposition"] == "loaded"]
    assert len(loaded) == COUNTS["demos_app.demonstration"]


def test_disposition_vocabulary() -> None:
    for r in ROWS:
        assert r["disposition"] in VALID_DISPOSITIONS, r


def test_loaded_rows_have_uuid_and_chip() -> None:
    for r in ROWS:
        if r["disposition"] == "loaded":
            assert r["uuid_token"].startswith("DEMONSTRATION_UUID_")
            assert r["status_id"]
            assert r["current_phase_id"]
            assert r["chip_source"] in {"preserved", "minted"}
            assert r["chip_id"]
        else:
            assert "uuid_token" not in r
            assert r["reason"]


def test_uuid_tokens_unique_and_ordered_by_medicaid_id() -> None:
    loaded = [r for r in ROWS if r["disposition"] == "loaded"]
    tokens = [r["uuid_token"] for r in loaded]
    assert len(set(tokens)) == len(tokens)
    # tokens are assigned in medicaid_id order, so sorting by id reproduces them.
    by_id = sorted(loaded, key=lambda r: r["medicaid_id"])
    assert [r["uuid_token"] for r in by_id] == sorted(tokens)


def test_minted_chips_are_masked_preserved_is_concrete() -> None:
    minted = [r for r in ROWS if r.get("chip_source") == "minted"]
    preserved = [r for r in ROWS if r.get("chip_source") == "preserved"]
    assert minted, "fixture should exercise at least one minted chip"
    for r in minted:
        assert "\u2026" in r["chip_id"]  # masked sequence number
    for r in preserved:
        assert "\u2026" not in r["chip_id"]


def test_committed_trace_partial_renders_from_committed_manifest() -> None:
    """Offline drift guard tying the trace partial to the manifest."""
    rendered = tft.SPECS["demonstration"].render_trace(MANIFEST)
    committed = TRACE_PATH.read_text(encoding="utf-8")
    assert rendered == committed, (
        "committed trace partial is out of sync with expected_manifest.json; "
        "rerun `make demonstration-flow-trace`."
    )
