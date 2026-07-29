"""Item 1 (docs/specs/document-migration.md): the committed DEMOS seed snapshot
and offline composite-FK legality of the document crosswalks.

These run without a database: the SQL ``*_check.sql`` gates validate crosswalk
targets against the live ``demos_app`` seed at pipeline time; this is the fast,
no-DB counterpart that pins the mappings to the committed
``reports/prisma/seeded/`` snapshot (transcribed from the DEMOS baseline
migration -- see that dir's README).
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEEDED = ROOT / "reports" / "prisma" / "seeded"
CROSSWALKS = ROOT / "reports" / "crosswalks"


def _rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def _document_type_domain() -> set[str]:
    return {r["id"] for r in _rows(SEEDED / "document_type.csv")}


def _deliverable_type_document_type_pairs() -> set[tuple[str, str]]:
    return {
        (r["deliverable_type_id"], r["document_type_id"])
        for r in _rows(SEEDED / "deliverable_type_document_type.csv")
    }


def test_seed_snapshots_exist_and_parse() -> None:
    for name in (
        "document_type.csv",
        "deliverable_type_document_type.csv",
        "phase_document_type.csv",
    ):
        assert _rows(SEEDED / name), f"seed snapshot empty or missing: {name}"


def test_document_type_crosswalk_targets_are_seeded() -> None:
    """Every application document_type.csv target is a legal seed value."""
    domain = _document_type_domain()
    for r in _rows(CROSSWALKS / "document_type.csv"):
        target = (r["demos_text_id"] or "").strip()
        if target:
            assert target in domain, f"document_type target not seeded: {target!r}"


def test_deliverable_file_type_targets_are_seeded() -> None:
    """Every deliverable_file_type.csv target is a legal seed value (D6)."""
    domain = _document_type_domain()
    for r in _rows(CROSSWALKS / "deliverable_file_type.csv"):
        target = (r["demos_text_id"] or "").strip()
        if target:
            assert target in domain, f"deliverable_file_type target not seeded: {target!r}"


def test_deliverable_file_type_excludes_bn_code() -> None:
    """D3: BN code 1 is out of scope -- recorded for completeness, no target, not in_scope."""
    by_code = {r["legacy_int_cd"]: r for r in _rows(CROSSWALKS / "deliverable_file_type.csv")}
    assert "1" in by_code, "BN code 1 must be recorded (completeness) even though excluded"
    assert (by_code["1"]["demos_text_id"] or "").strip() == ""
    assert by_code["1"]["in_scope"].strip().lower() == "false"


def test_deliverable_file_type_collapse_pairs_are_legal() -> None:
    """D6 collapse targets are legal for their monitoring deliverable types, and
    the D2 General File default is legal for every deliverable type -- the
    composite-FK legality that is the purpose of item 1's snapshot."""
    pairs = _deliverable_type_document_type_pairs()
    assert ("Monitoring Report", "Monitoring Report") in pairs
    assert ("Monitoring Protocol", "Monitoring Protocol") in pairs
    for deliverable_type in {dt for dt, _ in pairs}:
        assert (deliverable_type, "General File") in pairs, (
            f"General File not legal for deliverable type {deliverable_type!r}"
        )
