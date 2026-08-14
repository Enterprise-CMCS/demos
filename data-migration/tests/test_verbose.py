"""Unit coverage for verbose diagnostics and the always-on SQL failure context.

The verbose knob only changes log detail; it must never change exit behavior.
The SQL-failure context is always on (no flag) and must name the failing file.
"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import psycopg
import pytest

from migration import lib


def test_verbose_disabled_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    """No override and no VERBOSE env -> verbose is off."""
    monkeypatch.setattr(lib, "_verbose_override", None)
    monkeypatch.delenv("VERBOSE", raising=False)
    assert lib.verbose_enabled() is False


@pytest.mark.parametrize(
    ("value", "expected"),
    [("1", True), ("true", True), ("yes", True), ("0", False), ("false", False), ("", False)],
)
def test_verbose_env_parsing(monkeypatch: pytest.MonkeyPatch, value: str, expected: bool) -> None:
    """VERBOSE env is honored when no override is set."""
    monkeypatch.setattr(lib, "_verbose_override", None)
    monkeypatch.setenv("VERBOSE", value)
    assert lib.verbose_enabled() is expected


def test_set_verbose_override_wins(monkeypatch: pytest.MonkeyPatch) -> None:
    """The process override (the --verbose flag) beats the env var either way."""
    monkeypatch.setenv("VERBOSE", "0")
    monkeypatch.setattr(lib, "_verbose_override", None)
    lib.set_verbose(True)
    assert lib.verbose_enabled() is True
    lib.set_verbose(False)
    monkeypatch.setenv("VERBOSE", "1")
    assert lib.verbose_enabled() is False


def test_debug_log_emits_only_when_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    """debug_log routes to log only while verbose is enabled."""
    calls: list[str] = []
    monkeypatch.setattr(lib, "log", lambda m: calls.append(m))
    monkeypatch.setattr(lib, "_verbose_override", False)
    lib.debug_log("quiet")
    assert calls == []
    monkeypatch.setattr(lib, "_verbose_override", True)
    lib.debug_log("loud")
    assert calls == ["loud"]


def test_sql_error_detail_includes_file_and_diagnostics() -> None:
    """The message names the file and surfaces SQLSTATE/primary/DETAIL/CONTEXT."""
    diag = SimpleNamespace(
        severity="ERROR",
        sqlstate="42P01",
        message_primary='relation "x" does not exist',
        message_detail="some detail",
        message_hint=None,
        context="while creating view",
    )
    exc = SimpleNamespace(diag=diag)
    msg = lib._sql_error_detail(Path("sql/20_app/30_demo.sql"), exc)  # ty: ignore[invalid-argument-type]
    assert "30_demo.sql" in msg
    assert "42P01" in msg
    assert 'relation "x" does not exist' in msg
    assert "DETAIL: some detail" in msg
    assert "CONTEXT: while creating view" in msg
    assert "HINT" not in msg  # omitted when absent


def test_sql_error_detail_falls_back_without_diagnostics() -> None:
    """An error with an empty diag falls back to str(exc) but still names the file."""
    diag = SimpleNamespace(
        severity=None, sqlstate=None, message_primary=None,
        message_detail=None, message_hint=None, context=None,
    )
    exc = SimpleNamespace(diag=diag)
    msg = lib._sql_error_detail(Path("sql/x.sql"), exc)  # ty: ignore[invalid-argument-type]
    assert "x.sql" in msg


def test_execute_sql_file_dies_naming_the_file(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A psycopg error during apply hard-fails with the failing file in the message."""

    class _Conn:
        def execute(self, _sql: object) -> None:
            raise psycopg.Error("boom")

    f = tmp_path / "10_broken.sql"
    f.write_text("SELECT 1;", encoding="utf-8")
    with pytest.raises(SystemExit) as exc_info:
        lib._execute_sql_file(_Conn(), f)  # ty: ignore[invalid-argument-type]
    assert exc_info.value.code != 0
    assert "10_broken.sql" in " ".join(capsys.readouterr().err.split())
