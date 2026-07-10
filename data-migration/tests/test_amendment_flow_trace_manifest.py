"""Offline structural checks on the committed amendment flow trace (no DB).

The live freshness gate (``tests/sql/test_amendment_flow_live.py``) proves the
committed manifest matches a fresh end-to-end run, but it self-skips without
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
MANIFEST_PATH = (
    REPO_ROOT / "tests" / "sql" / "fixtures" / "amendment_flow" / "expected_manifest.json"
)
TRACE_PATH = REPO_ROOT / "docs" / "shared" / "generated" / "live" / "amendment-flow-trace.adoc"

sys.path.insert(0, str(REPO_ROOT / "docs" / "tools"))
import table_flow_trace as tft  # noqa: E402  # ty: ignore[unresolved-import]

MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
COUNTS = MANIFEST["stage_counts"]
ROWS = MANIFEST["rows"]

VALID_DISPOSITIONS = {
    "loaded",
    "held_back_parent",
    "excluded_soft_delete",
    "filtered_invalid",
}


def test_manifest_top_level_shape() -> None:
    assert MANIFEST["table"] == "amendment"
    assert MANIFEST["source_anchor"] == "mysql_raw.mdcd_demo_amndmt"
    assert "table_flow_trace.py" in MANIFEST["generated_by"]
    assert MANIFEST["fixture"].endswith("seed_mdcd_demo_amndmt.sql")


def test_isa_mirrors_loaded_count() -> None:
    loaded = COUNTS["demos_app.amendment"]
    assert COUNTS["demos_app.application (Amendment)"] == loaded


def test_funnel_is_monotonic() -> None:
    assert (
        COUNTS["mysql_raw.mdcd_demo_amndmt"]
        >= COUNTS["stg._valid_amndmt_ids"]
        >= COUNTS["stg.amendment_resolved"]
        >= COUNTS["demos_app.amendment"]
    )
    assert COUNTS["migration._id_map_mdcd_demo_amndmt"] == COUNTS["stg._valid_amndmt_ids"]


def test_held_equals_resolved_minus_loaded() -> None:
    assert COUNTS["migration._parity_amendment_held"] == (
        COUNTS["stg.amendment_resolved"] - COUNTS["demos_app.amendment"]
    )


def test_rows_account_for_every_source_row() -> None:
    assert len(ROWS) == COUNTS["mysql_raw.mdcd_demo_amndmt"]
    loaded = [r for r in ROWS if r["disposition"] == "loaded"]
    assert len(loaded) == COUNTS["demos_app.amendment"]


def test_disposition_vocabulary() -> None:
    for r in ROWS:
        assert r["disposition"] in VALID_DISPOSITIONS, r


def test_loaded_rows_have_uuid_status_and_parent() -> None:
    for r in ROWS:
        if r["disposition"] == "loaded":
            assert r["uuid_token"].startswith("AMENDMENT_UUID_")
            assert r["status_id"]
            assert r["current_phase_id"]
            assert r["parent_medicaid_id"]  # loaded => parent demonstration loaded
        else:
            assert "uuid_token" not in r
            assert r["reason"]


def test_uuid_tokens_unique_and_ordered_by_amndmt_id() -> None:
    loaded = [r for r in ROWS if r["disposition"] == "loaded"]
    tokens = [r["uuid_token"] for r in loaded]
    assert len(set(tokens)) == len(tokens)
    # tokens are assigned in mdcd_demo_amndmt_id order.
    by_id = sorted(loaded, key=lambda r: r["amndmt_id"])
    assert [r["uuid_token"] for r in by_id] == sorted(tokens)


def test_signature_dropped_branch_is_exercised() -> None:
    """A loaded amendment with an OGD/DD signature code -> NULL signature_level_id."""
    dropped = [
        r for r in ROWS
        if r["disposition"] == "loaded" and r.get("signature_level_id") is None
    ]
    assert dropped, "fixture should exercise a dropped (NULL) amendment signature"
    assert COUNTS["migration._parity_amendment_signature_dropped"] >= 1


def test_held_back_parent_reasons_present() -> None:
    held = [r for r in ROWS if r["disposition"] == "held_back_parent"]
    assert held, "fixture should exercise at least one held-back amendment"
    for r in held:
        assert r["reason"]


def test_committed_trace_partial_renders_from_committed_manifest() -> None:
    """Offline drift guard tying the trace partial to the manifest."""
    rendered = tft.SPECS["amendment"].render_trace(MANIFEST)
    committed = TRACE_PATH.read_text(encoding="utf-8")
    assert rendered == committed, (
        "committed trace partial is out of sync with expected_manifest.json; "
        "rerun `make amendment-flow-trace`."
    )
