"""Tests for migration.phases.init_pg helpers that don't require a live DB."""

from __future__ import annotations

import json
from pathlib import Path

from migration.phases import init_pg


def test_discover_jsonb_schemas_only_promoted(tmp_path: Path) -> None:
    (tmp_path / "alpha.schema.json").write_text('{"type": "object"}', encoding="utf-8")
    (tmp_path / "beta.schema.json").write_text('{"type": "array"}', encoding="utf-8")
    # Drafts must be ignored until renamed to *.schema.json.
    (tmp_path / "gamma.draft.json").write_text('{"type": "string"}', encoding="utf-8")

    found = init_pg.discover_jsonb_schemas(tmp_path)

    assert [name for name, _ in found] == ["alpha", "beta"]
    assert json.loads(dict(found)["alpha"]) == {"type": "object"}


def test_discover_jsonb_schemas_empty_dir(tmp_path: Path) -> None:
    assert init_pg.discover_jsonb_schemas(tmp_path) == []


def test_repo_promoted_schemas_are_valid_json() -> None:
    """The promoted (non-draft) schemas in the repo parse and cover the wired set."""
    found = dict(init_pg.discover_jsonb_schemas())
    assert set(found) == {
        "application_validation",
        "budget_neutrality",
        "uipath_response",
        "uipath_token_list",
    }
    for body in found.values():
        json.loads(body)
