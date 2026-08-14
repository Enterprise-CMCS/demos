"""Tests for migration.phases.build helpers that don't require a live DB."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from migration.phases import build


def test_load_seeded_tables_missing_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setattr(build, "PRISMA_SEEDED_TABLES_FILE", tmp_path / "absent.json")
    assert build._load_seeded_tables() == []


def test_load_seeded_tables_reads_capture(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    f = tmp_path / "prisma_seeded_tables.json"
    f.write_text(json.dumps(["state", "role", "application_status"]), encoding="utf-8")
    monkeypatch.setattr(build, "PRISMA_SEEDED_TABLES_FILE", f)
    assert build._load_seeded_tables() == ["state", "role", "application_status"]
