"""Verify the pgloader drop list parses correctly into the EXCLUDING block."""

from __future__ import annotations

from pathlib import Path

from migration import lib


def test_read_drop_list_strips_comments_and_blanks(tmp_path: Path) -> None:
    """Comments (``#``) and blank lines must be dropped; entries are trimmed."""
    f = tmp_path / "drop.txt"
    f.write_text(
        "# header comment\n\nalpha\n  beta  \n# inline comment\ngamma\n",
        encoding="utf-8",
    )
    assert lib.read_drop_list(f) == ["alpha", "beta", "gamma"]


def test_read_drop_list_missing_file_dies(tmp_path: Path) -> None:
    """A missing drop-list path must hard-fail via :func:`die`."""
    import pytest

    with pytest.raises(SystemExit):
        lib.read_drop_list(tmp_path / "nope.txt")


def test_excluding_block_emits_quoted_csv(tmp_path: Path) -> None:
    """Non-empty drop list renders as pgloader's EXCLUDING clause with quoted names."""
    f = tmp_path / "drop.txt"
    f.write_text("a\nb\nc\n", encoding="utf-8")
    block = lib.excluding_block(f)
    assert block == "EXCLUDING TABLE NAMES MATCHING 'a', 'b', 'c'"


def test_excluding_block_empty_returns_empty(tmp_path: Path) -> None:
    """A drop list of only comments yields an empty EXCLUDING block."""
    f = tmp_path / "drop.txt"
    f.write_text("# only comments\n", encoding="utf-8")
    assert lib.excluding_block(f) == ""


def test_real_drop_list_parses() -> None:
    """Smoke: production drop_list.txt is well-formed (non-empty, no leading '#')."""
    names = lib.read_drop_list()
    assert names
    assert all(not n.startswith("#") and n.strip() == n for n in names)
