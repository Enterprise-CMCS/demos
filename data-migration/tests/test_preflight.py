"""Failure-path coverage for P0 preflight (CODE_REVIEW test #4).

Preflight's entire job is to catch a broken toolchain before the freeze
banner goes up, so its value lives in the *failure* paths: each automated
check must flip ``ok`` False and the phase must ``die`` rather than march on
to ``freeze``. These tests stub every dependency so exactly one check fails
per test (and one all-pass case marks the gate), without touching a real
database, binary, or the network.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import preflight


class _FakeDuck:
    """Stand-in for a duckdb connection so P0.3 never hits the network."""

    def execute(self, _sql: str) -> _FakeDuck:
        return self

    def close(self) -> None:
        return None


def _arrange_all_pass(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Make every preflight check pass; individual tests then break exactly one."""
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    (tmp_path / "state").mkdir()
    monkeypatch.setattr(
        preflight.Env,
        "load",
        classmethod(
            lambda cls: lib.Env(
                pg_url="u",
                mysql_url="u",
                mysql_db="",
                pg_db="",
                pgloader_jar="",
                java_bin="",
            )
        ),
    )

    def _q(_env: object, sql: str, *_a: object, **_k: object) -> list[tuple[object, ...]]:
        return [(1,)] if "SELECT 1" in sql else [("100 MB",)]

    monkeypatch.setattr(preflight, "psql_query", _q)
    monkeypatch.setattr(preflight.shutil, "which", lambda name: f"/usr/bin/{name}")

    import duckdb

    monkeypatch.setattr(duckdb, "connect", lambda *_a, **_k: _FakeDuck())

    pin = tmp_path / "pin.sha256"
    pin.write_text("abc123def source-url\n", encoding="utf-8")
    cache = tmp_path / "cache"
    cache.mkdir()
    (cache / "abc123def.sql").write_text("-- pinned prisma ddl\n", encoding="utf-8")
    monkeypatch.setattr(preflight, "PRISMA_PIN_FILE", pin)
    monkeypatch.setattr(preflight, "PRISMA_CACHE_DIR", cache)

    monkeypatch.setattr(preflight, "run_prod_schema_guard", lambda **_k: None)


def _captured_err(capsys: pytest.CaptureFixture[str]) -> str:
    """Return preflight's stderr with Rich wrap-induced whitespace collapsed."""
    return " ".join(capsys.readouterr().err.split())


def test_all_checks_pass_marks_gate(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """When every automated check passes, the preflight gate is marked."""
    _arrange_all_pass(monkeypatch, tmp_path)
    preflight.run_preflight()
    assert lib.gate_path("preflight").exists()


def test_pg_unreachable_dies(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.1: a PG that fails ``SELECT 1`` flips ok and dies without marking."""
    _arrange_all_pass(monkeypatch, tmp_path)

    def _raise(_env: object, sql: str, *_a: object, **_k: object) -> list[tuple[object, ...]]:
        if "SELECT 1" in sql:
            raise RuntimeError("connection refused")
        return [("100 MB",)]

    monkeypatch.setattr(preflight, "psql_query", _raise)

    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "FAIL: PG not reachable" in err
    assert "preflight failed; do not proceed" in err
    assert not lib.gate_path("preflight").exists()


def test_duckdb_missing_dies(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.3: duckdb absent from PATH flips ok and dies."""
    _arrange_all_pass(monkeypatch, tmp_path)
    monkeypatch.setattr(
        preflight.shutil, "which", lambda name: None if name == "duckdb" else f"/usr/bin/{name}"
    )

    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "FAIL: duckdb not on PATH" in err
    assert "preflight failed; do not proceed" in err
    assert not lib.gate_path("preflight").exists()


def test_pgloader_missing_dies(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.4: no jar configured and no pgloader binary on PATH flips ok and dies."""
    _arrange_all_pass(monkeypatch, tmp_path)
    monkeypatch.setattr(
        preflight.shutil, "which", lambda name: None if name == "pgloader" else f"/usr/bin/{name}"
    )

    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "FAIL: pgloader not found on PATH" in err
    assert "preflight failed; do not proceed" in err
    assert not lib.gate_path("preflight").exists()


def test_pgloader_v4_jar_ok_without_binary(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """P0.4: a configured v4 jar + resolvable Java passes even with no v3 binary."""
    _arrange_all_pass(monkeypatch, tmp_path)
    jar = tmp_path / "pgloader.jar"
    jar.write_bytes(b"PK")
    monkeypatch.setattr(
        preflight.Env,
        "load",
        classmethod(
            lambda cls: lib.Env(
                pg_url="u",
                mysql_url="u",
                mysql_db="",
                pg_db="",
                pgloader_jar=str(jar),
                java_bin="java",
            )
        ),
    )
    # No v3 pgloader binary on PATH; java resolves fine.
    monkeypatch.setattr(
        preflight.shutil, "which", lambda name: None if name == "pgloader" else f"/usr/bin/{name}"
    )

    preflight.run_preflight()
    assert lib.gate_path("preflight").exists()


def test_prisma_pin_missing_dies(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.5: a missing pin file flips ok and dies."""
    _arrange_all_pass(monkeypatch, tmp_path)
    monkeypatch.setattr(preflight, "PRISMA_PIN_FILE", tmp_path / "absent.sha256")

    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "FAIL: pin file missing" in err
    assert "preflight failed; do not proceed" in err
    assert not lib.gate_path("preflight").exists()


def test_prisma_artifact_not_cached_dies(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.5: a pinned sha whose cached .sql is absent flips ok and dies."""
    _arrange_all_pass(monkeypatch, tmp_path)
    empty_cache = tmp_path / "empty_cache"
    empty_cache.mkdir()
    monkeypatch.setattr(preflight, "PRISMA_CACHE_DIR", empty_cache)

    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "FAIL: prisma ddl artifact not cached" in err
    assert "preflight failed; do not proceed" in err
    assert not lib.gate_path("preflight").exists()


def test_prod_schema_guard_runs_only_when_checks_pass(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """P0.6: the live prod-schema/emptiness guard runs iff every prior check passed."""
    _arrange_all_pass(monkeypatch, tmp_path)
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(preflight, "run_prod_schema_guard", lambda **k: calls.append(k))

    preflight.run_preflight()
    assert calls == [{"require_empty": True, "label": "preflight"}]

    # When an earlier check fails, the guard must be skipped entirely.
    calls.clear()
    monkeypatch.setattr(
        preflight.shutil, "which", lambda name: None if name == "pgloader" else f"/usr/bin/{name}"
    )
    with pytest.raises(SystemExit):
        preflight.run_preflight()
    err = _captured_err(capsys)
    assert "P0.6 prod-schema guard skipped (earlier checks failed)" in err
    assert calls == []
