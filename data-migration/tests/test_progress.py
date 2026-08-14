"""Unit coverage for the progress helpers in lib (progress_for, run_teed).

The bars are UI; the load-bearing guarantees tested here are: (1) when bars
are disabled the legacy ``>>> <label>`` log lines are preserved, so CI and
redirected output are unchanged, and (2) ``run_teed`` writes the child's
output byte-for-byte (``assert_pgloader_ok`` parses that file).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

from migration import lib


def test_progress_for_disabled_logs_legacy_lines(monkeypatch: pytest.MonkeyPatch) -> None:
    """A disabled bar yields a null handle whose step emits ``>>> <label>``."""
    monkeypatch.setattr(lib, "_progress_enabled", lambda: False)
    calls: list[str] = []
    monkeypatch.setattr(lib, "log", lambda msg: calls.append(msg))
    with lib.progress_for(5, "apply x") as p:
        assert p.active is False
        p.step("file_a.sql")
        p.step("file_b.sql")
    assert calls == [">>> file_a.sql", ">>> file_b.sql"]


def test_progress_for_below_threshold_is_null(monkeypatch: pytest.MonkeyPatch) -> None:
    """Even when enabled, a one-item loop renders no bar."""
    monkeypatch.setattr(lib, "_progress_enabled", lambda: True)
    with lib.progress_for(1, "x") as p:
        assert p.active is False


def test_progress_for_enabled_advances(monkeypatch: pytest.MonkeyPatch) -> None:
    """An enabled bar advances one item per step up to the total."""
    monkeypatch.setattr(lib, "_progress_enabled", lambda: True)
    with lib.progress_for(3, "parity") as p:
        assert p.active is True
        p.step("a")
        p.step("b")
        p.step("c")
        assert isinstance(p, lib._LiveProgress)
        task = p._progress.tasks[0]
        assert task.total == 3
        assert task.completed == 3


def test_run_teed_writes_bytes_verbatim(tmp_path: Path) -> None:
    """The log file must equal the child output exactly, incl. a partial last line."""
    log_path = tmp_path / "out.log"
    payload = "line1\nline2\npartial-no-newline"
    code = lib.run_teed(
        [sys.executable, "-c", f"import sys; sys.stdout.write({payload!r})"],
        log_path,
    )
    assert code == 0
    assert log_path.read_bytes() == payload.encode()


def test_run_teed_merges_stderr(tmp_path: Path) -> None:
    """stderr is merged into the same byte stream as stdout."""
    log_path = tmp_path / "out.log"
    lib.run_teed(
        [sys.executable, "-c", "import sys; sys.stdout.write('o'); sys.stderr.write('e')"],
        log_path,
    )
    assert log_path.read_bytes() == b"oe"


def test_run_teed_on_line_receives_lines(tmp_path: Path) -> None:
    """on_line gets each decoded line with the trailing newline stripped."""
    seen: list[str] = []
    lib.run_teed(
        [sys.executable, "-c", "print('a'); print('b')"],
        tmp_path / "o.log",
        on_line=seen.append,
    )
    assert seen == ["a", "b"]


def test_run_teed_nonzero_exit_dies(tmp_path: Path) -> None:
    """A non-zero child exit hard-fails, but the captured bytes are still written."""
    log_path = tmp_path / "out.log"
    with pytest.raises(SystemExit):
        lib.run_teed(
            [sys.executable, "-c", "import sys; sys.stdout.write('boom\\n'); sys.exit(2)"],
            log_path,
        )
    assert log_path.read_bytes() == b"boom\n"
