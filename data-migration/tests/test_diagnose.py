"""Unit coverage for the read-only `migrate diagnose` aggregator."""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import diagnose, load_fidelity, parity


def _stub_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        diagnose.Env,
        "load",
        classmethod(lambda cls: lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")),
    )


def test_diagnose_best_effort_survives_failing_probes(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A probe that raises (incl. the always-on SQL die) must not abort diagnose.

    The aggregate report is still written and the run exits 0, with each broken
    probe recorded as "probe unavailable".
    """
    monkeypatch.setattr(diagnose, "RUNS_DIR", tmp_path)
    _stub_env(monkeypatch)

    def _die(_env: object) -> parity.ParityReport:
        raise SystemExit(1)  # mimics the always-on SQL-failure die on a missing schema

    def _boom(strict: bool = False) -> None:
        raise RuntimeError("no live MySQL")

    monkeypatch.setattr(parity, "build_parity_report", _die)
    monkeypatch.setattr(load_fidelity, "run_load_fidelity", _boom)

    diagnose.run_diagnose()  # must not raise

    reports = list(tmp_path.glob("diagnose_*.md"))
    assert len(reports) == 1
    body = reports[0].read_text(encoding="utf-8")
    assert body.count("probe unavailable") == 2
    assert "no live MySQL" in body


def test_diagnose_aggregates_parity_report(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """The parity rollup and per-check statuses land in the diagnose report."""
    monkeypatch.setattr(diagnose, "RUNS_DIR", tmp_path)
    _stub_env(monkeypatch)

    rep = parity.ParityReport(
        generated_at="x",
        checks=[
            parity.CheckResult(name="c1", status="GREEN"),
            parity.CheckResult(name="c2", status="RED"),
        ],
    )
    monkeypatch.setattr(parity, "build_parity_report", lambda _env: rep)
    monkeypatch.setattr(load_fidelity, "run_load_fidelity", lambda strict=False: None)

    diagnose.run_diagnose()

    body = next(tmp_path.glob("diagnose_*.md")).read_text(encoding="utf-8")
    assert "OVERALL: RED" in body
    assert "c1: **GREEN**" in body
    assert "c2: **RED**" in body
    assert "ran; see the latest" in body


def test_diagnose_surfaces_die_reason(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A probe that ``die()``s must surface its FATAL reason, not just the exit code.

    Regression: diagnose previously rendered ``probe unavailable: 1`` (the bare
    SystemExit code). It should carry the real failure message logged by die().
    """
    monkeypatch.setattr(diagnose, "RUNS_DIR", tmp_path)
    _stub_env(monkeypatch)

    def _die_probe(_env: object) -> parity.ParityReport:
        lib.die(
            "SQL failed in sql/99_parity/10_x.sql; ERROR 42P01: "
            'relation "demos_app.foo" does not exist'
        )

    monkeypatch.setattr(parity, "build_parity_report", _die_probe)
    monkeypatch.setattr(load_fidelity, "run_load_fidelity", lambda strict=False: None)

    diagnose.run_diagnose()

    body = next(tmp_path.glob("diagnose_*.md")).read_text(encoding="utf-8")
    assert "probe unavailable:" in body
    assert "SQL failed in sql/99_parity/10_x.sql" in body
    assert "42P01" in body
    assert "probe unavailable: 1" not in body


def test_diagnose_marks_no_gates(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Diagnose is read-only: it must never mark a gate."""
    monkeypatch.setattr(diagnose, "RUNS_DIR", tmp_path)
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    (tmp_path / "state").mkdir()
    _stub_env(monkeypatch)

    rep = parity.ParityReport(
        generated_at="x", checks=[parity.CheckResult(name="c1", status="GREEN")]
    )
    monkeypatch.setattr(parity, "build_parity_report", lambda _env: rep)
    monkeypatch.setattr(load_fidelity, "run_load_fidelity", lambda strict=False: None)

    diagnose.run_diagnose()
    assert not lib.gate_path("parity").exists()
