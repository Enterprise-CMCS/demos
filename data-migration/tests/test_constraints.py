"""Tests for migration.phases.constraints FK re-apply logic."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from psycopg import sql as psql

from migration import lib
from migration.phases import constraints


@pytest.fixture
def prisma_fks_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Redirect PRISMA_FKS_FILE in lib + constraints to a tmp path."""
    p = tmp_path / "prisma_fks.json"
    monkeypatch.setattr(lib, "PRISMA_FKS_FILE", p)
    monkeypatch.setattr(constraints, "PRISMA_FKS_FILE", p)
    return p


def _rendered(stmt: psql.Composed | psql.SQL) -> str:
    """Best-effort SQL rendering used only for substring assertions in tests."""
    return stmt.as_string(None)


def test_load_captured_fks_missing_dies(
    prisma_fks_file: Path,
) -> None:
    """A missing prisma_fks.json must hard-fail with a targeted message."""
    with pytest.raises(SystemExit):
        constraints._load_captured_fks()


def test_load_captured_fks_malformed_dies(prisma_fks_file: Path) -> None:
    """A non-list prisma_fks.json must die rather than silently 'work'."""
    prisma_fks_file.write_text(json.dumps({"not": "a list"}), encoding="utf-8")
    with pytest.raises(SystemExit):
        constraints._load_captured_fks()


def test_load_captured_fks_round_trips(prisma_fks_file: Path) -> None:
    """Well-formed JSON parses into a list[dict] preserving keys."""
    data = [
        {
            "schema": "app",
            "table": "demonstration",
            "name": "fk001",
            "definition": "FOREIGN KEY (state_id) REFERENCES app.state(id)",
        }
    ]
    prisma_fks_file.write_text(json.dumps(data), encoding="utf-8")
    out = constraints._load_captured_fks()
    assert out == data


def test_readd_captured_fks_emits_not_valid(
    prisma_fks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Each captured FK is re-added with the verbatim def + NOT VALID."""
    captured: list[psql.Composed | psql.SQL] = []

    def fake_exec(_env, stmt):  # type: ignore[no-untyped-def]
        captured.append(stmt)

    monkeypatch.setattr(constraints, "psql_exec_composed", fake_exec)
    fks = [
        {
            "schema": "app",
            "table": "demonstration",
            "name": "fk001",
            "definition": "FOREIGN KEY (state_id) REFERENCES app.state(id) ON DELETE CASCADE",
        },
        {
            "schema": "app",
            "table": "deliverable",
            "name": "fk006",
            "definition": "FOREIGN KEY (demonstration_id) REFERENCES app.demonstration(id);",
        },
    ]
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    constraints._readd_captured_fks(env, fks)

    assert len(captured) == 2, "one ALTER per FK"
    fk001 = _rendered(captured[0])
    fk006 = _rendered(captured[1])
    assert '"app"."demonstration"' in fk001
    assert '"fk001"' in fk001
    assert "FOREIGN KEY (state_id) REFERENCES app.state(id) ON DELETE CASCADE NOT VALID" in fk001
    # Trailing ';' is stripped from the captured definition before NOT VALID is appended.
    assert "REFERENCES app.demonstration(id) NOT VALID" in fk006
    assert "; NOT VALID" not in fk006  # would mean the strip didn't happen


def test_readd_captured_fks_drops_before_add(
    prisma_fks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Each re-add must drop the constraint first so the phase is re-runnable."""
    captured: list[psql.Composed | psql.SQL] = []

    def fake_exec(_env, stmt):  # type: ignore[no-untyped-def]
        captured.append(stmt)

    monkeypatch.setattr(constraints, "psql_exec_composed", fake_exec)
    fks = [
        {
            "schema": "app",
            "table": "demonstration",
            "name": "fk001",
            "definition": "FOREIGN KEY (state_id) REFERENCES app.state(id)",
        }
    ]
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    constraints._readd_captured_fks(env, fks)

    assert len(captured) == 1, "one combined ALTER per FK"
    rendered = _rendered(captured[0])
    assert 'DROP CONSTRAINT IF EXISTS "fk001"' in rendered
    assert 'ADD CONSTRAINT "fk001"' in rendered
    assert rendered.index("DROP CONSTRAINT") < rendered.index("ADD CONSTRAINT")


def test_readd_captured_fks_rejects_unexpected_definition(
    prisma_fks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A definition that doesn't start with FOREIGN KEY must hard-fail."""

    def fake_exec(_env, _stmt):  # type: ignore[no-untyped-def]
        raise AssertionError("psql_exec_composed must not be called for bad input")

    monkeypatch.setattr(constraints, "psql_exec_composed", fake_exec)
    fks = [
        {
            "schema": "app",
            "table": "x",
            "name": "fk_bad",
            "definition": "DROP TABLE app.users",
        }
    ]
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    with pytest.raises(SystemExit):
        constraints._readd_captured_fks(env, fks)


def test_readd_captured_fks_quotes_embedded_double_quotes(
    prisma_fks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Identifier quoting (via psycopg.sql.Identifier) doubles embedded `"`."""
    captured: list[psql.Composed | psql.SQL] = []

    def fake_exec(_env, stmt):  # type: ignore[no-untyped-def]
        captured.append(stmt)

    monkeypatch.setattr(constraints, "psql_exec_composed", fake_exec)
    fks = [
        {
            "schema": "app",
            "table": 'wei"rd',
            "name": 'fk"001',
            "definition": "FOREIGN KEY (x) REFERENCES app.y(z)",
        }
    ]
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    constraints._readd_captured_fks(env, fks)
    rendered = _rendered(captured[0])
    assert '"wei""rd"' in rendered
    assert '"fk""001"' in rendered


def test_readd_captured_fks_empty_list_is_noop(
    prisma_fks_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An empty FK list must not call psql_exec_composed."""
    called = False

    def fake_exec(_env, _stmt):  # type: ignore[no-untyped-def]
        nonlocal called
        called = True

    monkeypatch.setattr(constraints, "psql_exec_composed", fake_exec)
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    constraints._readd_captured_fks(env, [])
    assert called is False
