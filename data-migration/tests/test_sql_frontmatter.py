"""Unit tests for scripts/check_sql_frontmatter.py.

The checker lives under scripts/ (not an installed package), so it is imported
here by path. These tests exercise the pure logic -- layer classification,
leading-comment extraction across both comment styles, and label detection --
without touching the repo's real SQL files.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
_REPO_ROOT = _SCRIPTS_DIR.parent
sys.path.insert(0, str(_SCRIPTS_DIR))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, _SCRIPTS_DIR / f"{name}.py")
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


fm = _load("check_sql_frontmatter")

FULL_BLOCK = """/*
 * Purpose:    load demos_app.demonstration
 * Inputs:     stg.demonstration_resolved
 * Outputs:    demos_app.demonstration
 * Invariants: held-back Approved rows must not fail the build
 * Refs:       reports/narrative/p1_demonstration_mapping_worksheet.md
 */
SET search_path TO demos_app;
"""

LIGHT_BLOCK = """/*
 * Purpose: legacy mdcd_demo_id -> DEMOS uuid id map
 * Refs:    docs/developer/reference-id-maps.adoc
 */
CREATE TABLE migration._id_map_mdcd_demo ();
"""


def test_required_labels_full_layer():
    path = _REPO_ROOT / "sql" / "20_app" / "30_demonstration.sql"
    assert fm.required_labels(path) == fm.FULL_LABELS


def test_required_labels_light_layer():
    path = _REPO_ROOT / "sql" / "05_id_maps" / "10_mdcd_demo.sql"
    assert fm.required_labels(path) == fm.LIGHT_LABELS


def test_required_labels_scripts_are_light():
    path = _REPO_ROOT / "scripts" / "generate_fk_candidates.sql"
    assert fm.required_labels(path) == fm.LIGHT_LABELS


def test_full_block_passes():
    assert fm.missing_from_text(FULL_BLOCK, fm.FULL_LABELS) == []


def test_full_block_missing_one_field():
    block = FULL_BLOCK.replace(" * Outputs:    demos_app.demonstration\n", "")
    assert fm.missing_from_text(block, fm.FULL_LABELS) == ["Outputs"]


def test_light_block_passes():
    assert fm.missing_from_text(LIGHT_BLOCK, fm.LIGHT_LABELS) == []


def test_light_block_missing_refs():
    block = LIGHT_BLOCK.replace(" * Refs:    docs/developer/reference-id-maps.adoc\n", "")
    assert fm.missing_from_text(block, fm.LIGHT_LABELS) == ["Refs"]


def test_dash_comment_style_is_recognized():
    block = "-- Purpose: id map\n-- Refs: docs/developer/reference-id-maps.adoc\nCREATE TABLE x ();"
    assert fm.missing_from_text(block, fm.LIGHT_LABELS) == []


def test_no_leading_comment_fails_all():
    block = "SET search_path TO demos_app;\nSELECT 1;"
    assert fm.missing_from_text(block, fm.FULL_LABELS) == list(fm.FULL_LABELS)


def test_label_must_be_in_leading_block_not_body():
    # A label that appears only after the leading comment block does not count.
    block = "/*\n * Purpose: x\n */\nSELECT 1; -- Refs: nope\n"
    assert "Refs" in fm.missing_from_text(block, fm.LIGHT_LABELS)


def test_every_in_scope_repo_file_has_frontmatter():
    offenders = {
        str(path.relative_to(_REPO_ROOT)): fm.missing_labels(path)
        for path in fm.in_scope_files()
        if fm.missing_labels(path)
    }
    assert offenders == {}, f"SQL files missing front-matter: {offenders}"


def test_block_comment_balance_detects_nested_open():
    # A `/*` in comment prose (e.g. a glob) opens a nested comment that never
    # closes -- Postgres then swallows the SQL below.
    assert fm.block_comment_unterminated("/*\n * see sql/10_stg/* files\n */\nSELECT 1;\n")
    assert not fm.block_comment_unterminated("/*\n * see the sql/10_stg files\n */\nSELECT 1;\n")
    # `/*` inside a string literal is harmless and must not be flagged.
    assert not fm.block_comment_unterminated("SELECT 'path/*glob*/here';\n")


def test_no_in_scope_file_has_unterminated_block_comment():
    offenders = [
        str(path.relative_to(_REPO_ROOT))
        for path in fm.in_scope_files()
        if fm.block_comment_unterminated(path.read_text())
    ]
    assert offenders == [], f"SQL files with nested/unterminated block comments: {offenders}"


def test_refs_value_folds_continuation_lines():
    block = "/*\n * Purpose: x\n * Refs:    sql/a.sql;\n *          sql/b.sql\n *\n * Prose.\n */\n"
    assert fm.refs_value(block) == "sql/a.sql; sql/b.sql"


def test_refs_value_stops_at_next_label():
    assert fm.refs_value(FULL_BLOCK) == "reports/narrative/p1_demonstration_mapping_worksheet.md"


def test_refs_value_absent_is_none():
    assert fm.refs_value("/*\n * Purpose: x\n */\n") is None


def test_ref_paths_keeps_only_repo_paths():
    block = (
        "/*\n * Purpose: x\n * Refs:    sql/20_app/30_demonstration.sql; "
        "Pending/approved decisions; the document-ocr extract-facts command\n */\n"
    )
    assert fm.ref_paths(block) == ["sql/20_app/30_demonstration.sql"]


def test_ref_paths_strips_anchors_node_ids_and_punctuation():
    block = (
        "/*\n * Purpose: x\n * Refs:    docs/developer/x.adoc#some-anchor, "
        "(tests/test_a.py::test_b), `scripts/c.sql`.\n */\n"
    )
    assert fm.ref_paths(block) == [
        "docs/developer/x.adoc",
        "tests/test_a.py",
        "scripts/c.sql",
    ]


def test_ref_paths_skips_placeholders():
    block = "/*\n * Purpose: x\n * Refs:    sql/10_stg/<NN>_thing.sql\n */\n"
    assert fm.ref_paths(block) == []


def test_dangling_refs_reports_only_missing():
    block = (
        "/*\n * Purpose: x\n * Refs:    docs/developer/reference-sql-conventions.adoc; "
        "sql/nope/999_ghost.sql\n */\n"
    )
    assert fm.dangling_refs(block, set()) == ["sql/nope/999_ghost.sql"]


def test_dangling_refs_honours_the_allow_list():
    block = "/*\n * Purpose: x\n * Refs:    sql/nope/999_ghost.sql\n */\n"
    assert fm.dangling_refs(block, {"sql/nope/999_ghost.sql"}) == []


def test_dangling_refs_resolves_against_the_monorepo_root():
    block = "/*\n * Purpose: x\n * Refs:    server/src/sql/permissions.sql\n */\n"
    assert fm.dangling_refs(block, set()) == []


def test_every_in_scope_repo_file_has_resolvable_refs():
    allowed = fm.load_absent_paths()
    offenders = {
        str(path.relative_to(_REPO_ROOT)): dangling
        for path in fm.in_scope_files()
        if (dangling := fm.dangling_refs(path.read_text(), allowed))
    }
    assert offenders == {}, f"SQL front-matter Refs pointing at nothing: {offenders}"
