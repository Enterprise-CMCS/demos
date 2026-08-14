"""Live-PG freshness gate for the amendment migration-flow trace.

Mirrors ``tests/sql/test_demonstration_flow_live.py``: runs the same end-to-end
pipeline the emitter (``docs/tools/table_flow_trace.py --table amendment``) runs
-- standup -> curated ``mysql_raw`` fixture -> crosswalks -> stg/app/parity --
against a throwaway Postgres, then asserts the freshly computed manifest is
byte-identical to the committed
``tests/sql/fixtures/amendment_flow/expected_manifest.json`` and that the
committed trace partial re-renders identically. A drift here means the SQL
changed but the committed docs/manifest were not regenerated (rerun
``make amendment-flow-trace``).

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

SPEC = tft.SPECS["amendment"]


@pytest.fixture(scope="module")
def live_manifest() -> Iterator[dict[str, Any]]:
    dsn = os.environ.get("PG_TEST_DSN")
    if not dsn:
        pytest.skip("PG_TEST_DSN not set; skipping amendment flow live harness")

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
        "amendment flow drifted from the committed manifest; "
        "rerun `make amendment-flow-trace` and commit the result."
    )


def test_live_trace_partial_matches_committed(live_manifest: dict[str, Any]) -> None:
    """The committed trace partial must re-render identically from a fresh run."""
    rendered = SPEC.render_trace(live_manifest)
    committed = SPEC.trace_path.read_text(encoding="utf-8")
    assert rendered == committed, (
        "committed trace partial is stale; rerun `make amendment-flow-trace`."
    )


def test_stage_count_invariants(live_manifest: dict[str, Any]) -> None:
    """Semantic invariants that must hold regardless of the committed snapshot."""
    counts = live_manifest["stage_counts"]
    loaded = counts["demos_app.amendment"]

    # IS-A: one application anchor per loaded amendment.
    assert counts["demos_app.application (Amendment)"] == loaded

    # Funnel monotonicity: source >= valid >= resolved >= loaded.
    assert (
        counts["mysql_raw.mdcd_demo_amndmt"]
        >= counts["stg._valid_amndmt_ids"]
        >= counts["stg.amendment_resolved"]
        >= loaded
    )

    # The id map mints exactly one UUID per PMDA-valid id.
    assert counts["migration._id_map_mdcd_demo_amndmt"] == counts["stg._valid_amndmt_ids"]

    # Every resolved row carries a crosswalked status in this fixture, so the
    # only reason a resolved amendment is not loaded is a parent demonstration
    # that did not load -- exactly what _parity_amendment_held counts.
    assert counts["migration._parity_amendment_held"] == (
        counts["stg.amendment_resolved"] - loaded
    )

    # Per-row dispositions account for every source row.
    dispositions = [r["disposition"] for r in live_manifest["rows"]]
    assert len(dispositions) == counts["mysql_raw.mdcd_demo_amndmt"]
    assert dispositions.count("loaded") == loaded
