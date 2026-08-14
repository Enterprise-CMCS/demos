"""Unit coverage for migration.phases.load_delta."""

from __future__ import annotations

from pathlib import Path

import pytest

from migration.phases import load_delta


def test_validate_freeze_instant_accepts_iso_utc() -> None:
    """A well-formed ``YYYY-MM-DDTHH:MM:SSZ`` instant is returned unchanged."""
    s = "2026-05-06T14:30:00Z"
    assert load_delta._validate_freeze_instant(s) == s


@pytest.mark.parametrize(
    "bad",
    [
        "",
        "2026-05-06 14:30:00",
        "2026-05-06T14:30:00+00:00",
        "2026-05-06T14:30:00",
        "now()",
        "'); DROP TABLE mysql_raw._delta_log; --",
    ],
)
def test_validate_freeze_instant_rejects_garbage(
    bad: str, capsys: pytest.CaptureFixture[str]
) -> None:
    """Anything that doesn't match the exact ISO-UTC shape must hard-fail."""
    with pytest.raises(SystemExit):
        load_delta._validate_freeze_instant(bad)
    assert "does not match" in " ".join(capsys.readouterr().err.split())


def test_read_delta_tables_strips_blanks_and_comments(tmp_path: Path) -> None:
    """Manifest reader drops blank rows and ``#``-prefixed table names."""
    tsv = tmp_path / "delta_tables.tsv"
    tsv.write_text(
        "table_name\tupdated_col\n"
        "users\tupdated_at\n"
        "# commented\tupdated_at\n"
        "\t\n"
        "orders\tlast_modified\n",
        encoding="utf-8",
    )
    assert load_delta._read_delta_tables(tsv) == ["users", "orders"]


def test_read_delta_tables_missing_returns_empty(tmp_path: Path) -> None:
    """A missing manifest file yields an empty table list (no-op delta)."""
    assert load_delta._read_delta_tables(tmp_path / "does-not-exist.tsv") == []


def test_build_tables_block_empty() -> None:
    """An empty manifest produces an empty INCLUDING block."""
    assert load_delta._build_tables_block([]) == ""


def test_build_tables_block_emits_matching_clause() -> None:
    """Non-empty manifest renders as pgloader's INCLUDING-ONLY clause."""
    out = load_delta._build_tables_block(["users", "orders", "items"])
    assert out == "INCLUDING ONLY TABLE NAMES MATCHING 'users', 'orders', 'items'"
