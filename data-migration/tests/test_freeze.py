"""Unit coverage for the freeze phase's cutover writes (CODE_REVIEW test #3).

``freeze`` records the authoritative freeze instant: it writes
``state/freeze_instant.txt`` and appends the row to ``mysql_raw._delta_log``
that every downstream delta keys off. These are the most consequential
writes of the cutover, so assert they happen (and only when confirmed),
not merely that the function returns.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import freeze


def _fake_env() -> lib.Env:
    return lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")


def test_run_freeze_writes_instant_and_delta_log(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A confirmed freeze writes the instant file, the matching _delta_log row, and marks."""
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path)
    monkeypatch.setattr(freeze, "STATE_DIR", tmp_path)
    lib.mark_gate("preflight")  # @phase("freeze", requires="preflight")

    monkeypatch.setattr(freeze, "confirm", lambda _prompt: True)
    monkeypatch.setattr(freeze.Env, "load", classmethod(lambda cls: _fake_env()))

    captured: dict[str, str] = {}
    monkeypatch.setattr(
        freeze, "psql_command", lambda _env, sql: captured.__setitem__("sql", sql)
    )

    freeze.run_freeze()

    instant_file = tmp_path / "freeze_instant.txt"
    assert instant_file.exists()
    instant = instant_file.read_text(encoding="utf-8").strip()
    assert instant, "freeze_instant.txt must hold a non-empty timestamp"

    assert "INSERT INTO mysql_raw._delta_log (freeze_instant)" in captured["sql"]
    # The same instant written to disk must be the one logged to _delta_log.
    assert f"'{instant}'::timestamptz" in captured["sql"]

    assert lib.gate_path("freeze").exists(), "freeze gate must be marked on success"


def test_run_freeze_aborts_when_not_confirmed(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """An unconfirmed freeze must die before any write and must not mark the gate."""
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path)
    monkeypatch.setattr(freeze, "STATE_DIR", tmp_path)
    lib.mark_gate("preflight")

    monkeypatch.setattr(freeze, "confirm", lambda _prompt: False)
    monkeypatch.setattr(freeze.Env, "load", classmethod(lambda cls: _fake_env()))

    writes = {"n": 0}
    monkeypatch.setattr(
        freeze, "psql_command", lambda _env, _sql: writes.__setitem__("n", writes["n"] + 1)
    )

    with pytest.raises(SystemExit):
        freeze.run_freeze()

    assert "freeze not confirmed" in " ".join(capsys.readouterr().err.split())
    assert writes["n"] == 0, "no _delta_log write may happen on an unconfirmed freeze"
    assert not (tmp_path / "freeze_instant.txt").exists()
    assert not lib.gate_path("freeze").exists()
