"""Live-PG freshness gate for the demonstration migration-flow trace.

Runs the same end-to-end pipeline the emitter (``docs/tools/table_flow_trace.py``)
runs -- standup -> curated ``mysql_raw`` fixture -> crosswalks -> stg/app/history/
parity -- against a throwaway Postgres, then asserts the freshly computed
manifest is byte-identical to the committed
``tests/sql/fixtures/demo_flow/expected_manifest.json`` and that the committed
trace partial re-renders identically. A drift here means the SQL changed but the
committed docs/manifest were not regenerated (rerun ``make demonstration-flow-trace``).

Needs ``PG_TEST_DSN`` pointing at a ``supabase/postgres`` harness (it requires
pg_jsonschema, like ``test_app_layers_idempotency``); self-skips otherwise so the
default suite stays green without Docker.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    from collections.abc import Iterator

ROOT = Path(__file__).resolve().parents[2]
# docs/tools is not a package; make the emitter importable by path.
sys.path.insert(0, str(ROOT / "docs" / "tools"))

import table_flow_trace as tft  # noqa: E402  # ty: ignore[unresolved-import]

SPEC = tft.SPECS["demonstration"]


@pytest.fixture(scope="module")
def live_manifest() -> Iterator[dict[str, Any]]:
    dsn = os.environ.get("PG_TEST_DSN")
    if not dsn:
        pytest.skip("PG_TEST_DSN not set; skipping demonstration flow live harness")

    import psycopg

    try:
        conn = psycopg.connect(dsn, autocommit=True)
    except psycopg.Error as e:
        pytest.skip(f"PG_TEST_DSN set but unreachable: {e}")
    try:
        try:
            conn.execute("CREATE EXTENSION IF NOT EXISTS pg_jsonschema")
        except psycopg.Error as e:
            pytest.skip(f"pg_jsonschema unavailable on PG_TEST_DSN: {e}")
        yield tft.run_pipeline(conn, SPEC)
    finally:
        conn.close()


def test_live_manifest_matches_committed(live_manifest: dict[str, Any]) -> None:
    """A fresh end-to-end run must equal the committed expected_manifest.json."""
    committed = json.loads(SPEC.manifest_path.read_text(encoding="utf-8"))
    assert live_manifest == committed, (
        "demonstration flow drifted from the committed manifest; "
        "rerun `make demonstration-flow-trace` and commit the result."
    )


def test_live_trace_partial_matches_committed(live_manifest: dict[str, Any]) -> None:
    """The committed trace partial must re-render identically from a fresh run."""
    rendered = SPEC.render_trace(live_manifest)
    committed = SPEC.trace_path.read_text(encoding="utf-8")
    assert rendered == committed, (
        "committed trace partial is stale; rerun `make demonstration-flow-trace`."
    )


def test_stage_count_invariants(live_manifest: dict[str, Any]) -> None:
    """Semantic invariants that must hold regardless of the committed snapshot."""
    counts = live_manifest["stage_counts"]
    loaded = counts["demos_app.demonstration"]

    # IS-A: one application anchor per loaded demonstration.
    assert counts["demos_app.application (Demonstration)"] == loaded

    # Provenance bijection: every loaded id traces to a PMDA row (check 6 == 0).
    assert counts["migration._parity_demonstration_id_provenance"] == 0

    # Funnel monotonicity: source >= valid >= resolved >= loaded.
    assert (
        counts["mysql_raw.mdcd_demo"]
        >= counts["stg._valid_demo_ids"]
        >= counts["stg.demonstration_resolved"]
        >= loaded
    )

    # The id map mints exactly one UUID per PMDA-valid id.
    assert counts["migration._id_map_mdcd_demo"] == counts["stg._valid_demo_ids"]

    # Per-row dispositions account for every source row.
    dispositions = [r["disposition"] for r in live_manifest["rows"]]
    assert len(dispositions) == counts["mysql_raw.mdcd_demo"]
    assert dispositions.count("loaded") == loaded
