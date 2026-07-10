"""Read-only triage: aggregate the non-gating probes into one report.

Runs parity in report-only mode and the load-fidelity probe, each best-effort,
and writes ``reports/runs/diagnose_<stamp>.md``. It marks no gates and exits 0 even
when a probe's prerequisites are missing, so an operator can take a full health
snapshot mid-build without tripping a gate or hard-failing. It is the read-only
counterpart to the gating ``parity`` phase, not a substitute for it.

Note: "read-only" means it marks no gates and mutates no business data. The
parity probe does (idempotently) re-create its ``migration`` reporting views,
exactly as ``run_parity`` does today.
"""

from __future__ import annotations

import sys
from pathlib import Path

from migration.lib import RUNS_DIR, Env, console, file_stamp, log, rel, ts
from migration.phases import load_fidelity, parity


def _probe_reason(captured: str, exc: BaseException) -> str:
    """The most useful one-line reason a probe was unavailable.

    Prefers the message logged by :func:`migration.lib.die` (everything after
    the ``FATAL`` marker, with wrapping whitespace collapsed) so a bare
    ``SystemExit`` code is replaced by the real failure. Falls back to the
    exception type/code when the probe failed without a FATAL line.
    """
    marker = captured.rfind("FATAL")
    if marker != -1:
        reason = " ".join(captured[marker + len("FATAL") :].split())
        if reason:
            return reason
    if isinstance(exc, SystemExit):
        return f"hard-failed (exit {exc.code})"
    return f"{type(exc).__name__}: {exc}"


def run_diagnose() -> None:
    """Aggregate the non-gating probes into ``reports/runs/diagnose_<stamp>.md``.

    Each probe is wrapped so a missing DB or unreachable live source is recorded
    as "probe unavailable" rather than aborting the aggregate -- including the
    always-on SQL-failure ``die`` (``SystemExit``) a probe may raise when its
    prerequisite schema is not built yet. The probe's console output is captured
    so the recorded reason carries the real FATAL message, then re-emitted to
    stderr so the operator still sees it live.
    """
    env = Env.load()
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    lines: list[str] = [
        "# Diagnose report (read-only; marks no gates)",
        "",
        f"Generated: {ts()}",
        "",
        "## Parity (report-only)",
        "",
    ]
    with console.capture() as cap:
        try:
            report = parity.build_parity_report(env)
            probe_error: BaseException | None = None
        except (Exception, SystemExit) as exc:  # best-effort: a missing schema must not abort
            probe_error = exc
    sys.stderr.write(cap.get())
    if probe_error is None:
        lines.append(f"**OVERALL: {report.overall}**")
        lines.append("")
        lines.extend(f"- {c.name}: **{c.status}**" for c in report.checks)
    else:
        lines.append(f"probe unavailable: {_probe_reason(cap.get(), probe_error)}")
    lines.append("")

    lines.extend(["## Load fidelity", ""])
    with console.capture() as cap:
        try:
            load_fidelity.run_load_fidelity(strict=False)
            probe_error = None
        except (Exception, SystemExit) as exc:  # needs a live MySQL + DuckDB
            probe_error = exc
    sys.stderr.write(cap.get())
    if probe_error is None:
        lines.append("ran; see the latest reports/runs/load_fidelity_*.md")
    else:
        lines.append(f"probe unavailable: {_probe_reason(cap.get(), probe_error)}")
    lines.append("")

    out: Path = RUNS_DIR / f"diagnose_{file_stamp()}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log(f"wrote {rel(out)} (read-only; no gates marked)")
