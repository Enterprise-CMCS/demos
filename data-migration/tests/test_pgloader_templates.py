"""Guard: rendered pgloader command files must parse under pgloader v4 (JVM).

pgloader v4's Clojure parser rejects C-style ``/* */`` block comments and
``#`` comments, and mis-splits statements on a ``;`` inside a ``--`` line
comment. ``lib.strip_pgloader_comments`` removes every comment from the file
pgloader actually parses; these tests pin that behaviour and prove the two
authored templates render comment-free.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib

_SUBSTITUTIONS = {
    "MYSQL_URL": "mysql://u:p@h:3306/db",
    "PG_URL": "postgresql://u:p@h:5432/db",
    "MYSQL_DB": "db",
    "CAST_BLOCK": "CAST type tinyint to boolean",
    "EXCLUDING_BLOCK": "EXCLUDING TABLE NAMES MATCHING 'x'",
    "FREEZE_INSTANT": "2026-01-01T00:00:00Z",
    "TABLES_BLOCK": "INCLUDING ONLY TABLE NAMES MATCHING 'y'",
}

_TEMPLATES = [lib.PGLOADER_DIR / "schema.load", lib.PGLOADER_DIR / "delta.tmpl.load"]


def test_strip_removes_block_comments() -> None:
    """``/* */`` blocks (even multi-line) are removed entirely."""
    out = lib.strip_pgloader_comments("/* a\n * b\n */\nLOAD DATABASE;\n")
    assert "/*" not in out
    assert "*/" not in out
    assert "LOAD DATABASE;" in out


def test_strip_removes_line_comments_with_semicolons() -> None:
    """Whole-line ``--`` comments go (their ``;`` would break v4's parser)."""
    out = lib.strip_pgloader_comments("-- reads env; from .env\nLOAD DATABASE;\n")
    assert "reads env" not in out
    assert "LOAD DATABASE;" in out


def test_strip_removes_hash_comments() -> None:
    """Whole-line ``#`` comments (rejected by v4) are removed."""
    out = lib.strip_pgloader_comments("# note\nLOAD DATABASE;\n")
    assert "# note" not in out


def test_strip_preserves_inline_double_dash_in_urls() -> None:
    """An inline ``--`` inside a command line (e.g. a password) is preserved."""
    line = "     FROM mysql://user:pa--ss@h:3306/db"  # pragma: allowlist secret
    out = lib.strip_pgloader_comments(line + "\n")
    assert "pa--ss" in out


@pytest.mark.parametrize("template", _TEMPLATES, ids=lambda p: p.name)
def test_rendered_template_is_comment_free(template: Path, tmp_path: Path) -> None:
    """Each authored template renders to a file free of v4-hostile comments."""
    out = tmp_path / (template.name + ".rendered")
    lib.render_template(template, out, _SUBSTITUTIONS)
    text = out.read_text(encoding="utf-8")
    assert "/*" not in text
    assert "*/" not in text
    for lineno, line in enumerate(text.splitlines(), 1):
        stripped = line.lstrip()
        assert not stripped.startswith("--"), f"{template.name}:{lineno} has a -- comment"
        assert not stripped.startswith("#"), f"{template.name}:{lineno} has a # comment"
