"""Unit coverage for the load_full phase's render/guard/gate logic.

``run_load_full`` renders ``pgloader/schema.load`` and shells out to pgloader.
The pgloader subprocess (and its live MySQL source) is integration-only, but
the render (env values + CAST/EXCLUDING blocks substituted into the command
file), the missing-template guard, the pgloader-runner guard, and the gate
marking are unit-testable with the subprocess stubbed. These assert the phase
does the right first writes -- not merely that it returns.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import load_full


def _fake_env() -> lib.Env:
    return lib.Env(
        pg_url="postgresql://pg-sentinel/db",
        mysql_url="mysql://mysql-sentinel/db",
        mysql_db="legacy_sentinel_db",
        pg_db="",
    )


def _stub_runtime(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Neutralize the live-only pieces so only render/guard/gate logic runs."""
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path)
    monkeypatch.setattr(load_full, "STATE_DIR", tmp_path)
    monkeypatch.setattr(load_full, "RUNS_DIR", tmp_path)
    monkeypatch.setattr(load_full.Env, "load", classmethod(lambda cls: _fake_env()))
    monkeypatch.setattr(load_full, "require_pgloader", lambda _env: None)
    monkeypatch.setattr(load_full, "require_schema", lambda _env, _schema: None)
    monkeypatch.setattr(load_full, "assert_pgloader_ok", lambda _log: None)


def test_run_load_full_renders_env_and_blocks_then_marks_gate(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """The happy path substitutes the env + CAST/EXCLUDING blocks, runs pgloader
    against the rendered file, and marks the gate."""
    _stub_runtime(monkeypatch, tmp_path)
    monkeypatch.setattr(load_full, "cast_block", lambda: "-- CAST_SENTINEL")
    monkeypatch.setattr(load_full, "excluding_block", lambda: "-- EXCLUDING_SENTINEL")

    argv_rendered: list[Path] = []
    run_argv: list[str] = []
    run_log: list[Path] = []

    def fake_pgloader_argv(rendered: Path, env: lib.Env | None = None) -> list[str]:
        argv_rendered.append(rendered)
        return ["pgloader-stub", str(rendered)]

    def fake_run_teed(argv: list[str], log_path: Path, *, on_line: object = None) -> int:
        run_argv.extend(argv)
        run_log.append(log_path)
        return 0

    monkeypatch.setattr(load_full, "pgloader_argv", fake_pgloader_argv)
    monkeypatch.setattr(load_full, "run_teed", fake_run_teed)

    load_full.run_load_full()

    rendered = tmp_path / "schema.rendered.load"
    assert rendered.exists(), "the rendered command file must be written"
    text = rendered.read_text(encoding="utf-8")
    assert "mysql://mysql-sentinel/db" in text, "MYSQL_URL must be substituted"
    assert "postgresql://pg-sentinel/db" in text, "PG_URL must be substituted"
    assert "legacy_sentinel_db" in text, "MYSQL_DB must be substituted"
    assert "-- CAST_SENTINEL" in text, "CAST_BLOCK must be substituted"
    assert "-- EXCLUDING_SENTINEL" in text, "EXCLUDING_BLOCK must be substituted"
    assert "{{" not in text, "no unrendered {{MARKER}} may remain"

    assert argv_rendered == [rendered], "pgloader must run the rendered file"
    assert str(rendered) in run_argv
    assert run_log[0].parent == tmp_path, "pgloader log must land under REPORTS_DIR"

    assert lib.gate_path("load_full").exists(), "the gate must be marked on success"


def test_run_load_full_dies_on_missing_template(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A missing schema.load template hard-fails before any load or gate."""
    _stub_runtime(monkeypatch, tmp_path)
    empty = tmp_path / "pgloader_empty"
    empty.mkdir()
    monkeypatch.setattr(load_full, "PGLOADER_DIR", empty)

    ran = {"n": 0}
    monkeypatch.setattr(
        load_full, "run_teed", lambda *_a, **_k: ran.__setitem__("n", ran["n"] + 1)
    )

    with pytest.raises(SystemExit):
        load_full.run_load_full()

    assert ran["n"] == 0, "pgloader must not run when the template is missing"
    assert not (tmp_path / "schema.rendered.load").exists()
    assert not lib.gate_path("load_full").exists()


def test_run_load_full_aborts_when_pgloader_runner_missing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A failing pgloader-runner guard aborts before any render or gate."""
    _stub_runtime(monkeypatch, tmp_path)
    monkeypatch.setattr(load_full, "require_pgloader", lambda _env: lib.die("no pgloader"))

    ran = {"n": 0}
    monkeypatch.setattr(
        load_full, "run_teed", lambda *_a, **_k: ran.__setitem__("n", ran["n"] + 1)
    )

    with pytest.raises(SystemExit):
        load_full.run_load_full()

    assert ran["n"] == 0
    assert not (tmp_path / "schema.rendered.load").exists()
    assert not lib.gate_path("load_full").exists()
