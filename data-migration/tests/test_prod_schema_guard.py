"""Unit coverage for the prod-schema guard's pure decision/diff logic.

The DuckDB dual-attach collection needs two live Postgres clusters and is
exercised in the integration tier; here we test the run/skip/HOLD decisions,
the drift summary, and the seeded-table reader.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import prod_schema_guard as guard


def _env(pg_url: str = "", reference_pg_url: str = "") -> lib.Env:
    return lib.Env(
        pg_url=pg_url,
        reference_pg_url=reference_pg_url,
        mysql_url="mysql://u:p@h/db",
        mysql_db="",
        pg_db="",
    )


def test_should_run_when_reference_set() -> None:
    """A configured reference always runs the guard."""
    assert guard._should_run_guard(_env(reference_pg_url="postgresql://ref")) is True


def test_should_skip_local_target_without_reference() -> None:
    """Local/rehearsal target (pg_url set) without a reference -> skip, not die."""
    assert guard._should_run_guard(_env(pg_url="postgresql://local")) is False


def test_should_die_on_prod_target_without_reference() -> None:
    """Prod target (pg_url unset) without a reference -> HOLD (die)."""
    with pytest.raises(SystemExit):
        guard._should_run_guard(_env())


def test_summarize_clean_is_pass() -> None:
    """No diffs -> empty issue list (PASS)."""
    assert guard.summarize_guard(guard.GuardDiffs()) == []


def test_summarize_flags_each_category() -> None:
    """Each drift category contributes a message; (0,0) seed entries are ignored."""
    diffs = guard.GuardDiffs(
        columns_only_ref=[("application", "new_col", "text", "YES", "")],
        fks_only_tgt=[("fk_x", "deliverable", "FOREIGN KEY (a) REFERENCES b(id)")],
        seed_diffs={"application_status": (1, 0), "role": (0, 0)},
        nonempty_tgt_tables={"demonstration": 5},
    )
    issues = guard.summarize_guard(diffs)
    joined = " ".join(issues)
    assert "column drift" in joined
    assert "foreign-key drift" in joined
    assert "application_status" in joined
    assert "role" not in joined  # (0, 0) is not drift
    assert "not empty" in joined
    assert "demonstration" in joined


def test_read_seeded_tables_missing(tmp_path: Path) -> None:
    """Absent capture file -> empty list (seed-row parity is skipped)."""
    assert guard._read_seeded_tables(tmp_path / "nope.json") == []


def test_read_seeded_tables_parses_list(tmp_path: Path) -> None:
    """A JSON list of names round-trips to a list[str]."""
    p = tmp_path / "seeded.json"
    p.write_text('["application_status", "role", "phase"]', encoding="utf-8")
    assert guard._read_seeded_tables(p) == ["application_status", "role", "phase"]
