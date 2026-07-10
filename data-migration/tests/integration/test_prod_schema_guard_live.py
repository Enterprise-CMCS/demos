"""Live prod-schema-guard tests: DuckDB postgres_scanner PG<->PG dual-attach.

Seeds a tiny ``demos_app`` into the target and reference Postgres, then drives
``prod_schema_guard._collect_diffs`` against the real clusters. Skips unless
both ``PG_TEST_DSN`` and ``REFERENCE_PG_URL`` are set (see docker-compose.test.yml).
"""

from __future__ import annotations

import os
from typing import Any

import pytest

from migration.phases import prod_schema_guard as guard

pytestmark = pytest.mark.integration


def _build_demos_app(conn: Any) -> None:
    """(Re)create a minimal demos_app: one seeded lookup + one empty data table."""
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.state (id int PRIMARY KEY, code text NOT NULL)")
    conn.execute("INSERT INTO demos_app.state (id, code) VALUES (1, 'CA'), (2, 'NY')")
    conn.execute(
        "CREATE TABLE demos_app.demonstration ("
        "id int PRIMARY KEY, state_id int REFERENCES demos_app.state(id))"
    )


def test_guard_clean_when_identical(target_pg: Any, reference_pg: Any) -> None:
    """Identical schema + seeds + empty data table -> no drift."""
    _build_demos_app(target_pg)
    _build_demos_app(reference_pg)

    diffs = guard._collect_diffs(
        os.environ["PG_TEST_DSN"],
        os.environ["REFERENCE_PG_URL"],
        seeded=["state"],
        require_empty=True,
    )
    assert guard.summarize_guard(diffs) == []


def test_guard_detects_column_drift(target_pg: Any, reference_pg: Any) -> None:
    """A column present only in the target is reported as drift."""
    _build_demos_app(target_pg)
    _build_demos_app(reference_pg)
    target_pg.execute("ALTER TABLE demos_app.demonstration ADD COLUMN extra text")

    diffs = guard._collect_diffs(
        os.environ["PG_TEST_DSN"],
        os.environ["REFERENCE_PG_URL"],
        seeded=["state"],
        require_empty=True,
    )
    issues = guard.summarize_guard(diffs)
    assert any("column drift" in i for i in issues)


def test_guard_detects_seed_drift(target_pg: Any, reference_pg: Any) -> None:
    """A differing seeded row is reported as seeded-reference drift."""
    _build_demos_app(target_pg)
    _build_demos_app(reference_pg)
    target_pg.execute("UPDATE demos_app.state SET code = 'TX' WHERE id = 2")

    diffs = guard._collect_diffs(
        os.environ["PG_TEST_DSN"],
        os.environ["REFERENCE_PG_URL"],
        seeded=["state"],
        require_empty=True,
    )
    issues = guard.summarize_guard(diffs)
    assert any("seeded-reference drift" in i for i in issues)


def test_guard_detects_nonempty_target(target_pg: Any, reference_pg: Any) -> None:
    """A non-seeded data table with rows in the target fails the emptiness check."""
    _build_demos_app(target_pg)
    _build_demos_app(reference_pg)
    target_pg.execute("INSERT INTO demos_app.demonstration (id, state_id) VALUES (1, 1)")

    diffs = guard._collect_diffs(
        os.environ["PG_TEST_DSN"],
        os.environ["REFERENCE_PG_URL"],
        seeded=["state"],
        require_empty=True,
    )
    issues = guard.summarize_guard(diffs)
    assert any("not empty" in i for i in issues)
