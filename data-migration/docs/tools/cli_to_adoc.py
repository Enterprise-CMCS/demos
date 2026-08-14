"""Walk the migrate Typer app and emit operator/reference-cli.adoc.

Run from the repo root via `make cli-ref` (in docs/), which executes:

    cd .. && uv run python docs/tools/cli_to_adoc.py > docs/operator/reference-cli.adoc

The generated file is committed; CI fails if `git diff --exit-code` reports
drift after running this script.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# Sanitisation: keep generated docs portable across operator workstations.
# Any captured help output is rewritten so absolute paths become generic
# placeholders -- never the running user's `/Users/...` or `/home/...`.
_HOME = str(Path.home())
_REPO_RE = re.compile(re.escape(str(REPO_ROOT)))
_HOME_RE = re.compile(re.escape(_HOME)) if _HOME and _HOME != "/" else None
_USER_RE = re.compile(r"/(Users|home)/[^/\s\"'`]+")


def _sanitize(text: str) -> str:
    """Strip workstation-specific paths from captured help text.

    Rewrites the absolute repo path, the current user's home, and any
    remaining ``/Users/<name>`` or ``/home/<name>`` prefixes to generic
    placeholders so generated docs are portable across operators.
    """
    text = _REPO_RE.sub("path/to/repo", text)
    if _HOME_RE is not None:
        text = _HOME_RE.sub("~", text)
    text = _USER_RE.sub("/path/to", text)
    return text


# Importing the Typer app gives a stable, ordered list of registered commands
# (a richer surface than `migrate --help` parsing). We then shell out for the
# per-command help text so the rendered output matches what an operator sees
# at a real terminal.
sys.path.insert(0, str(REPO_ROOT))
from migration.cli import app as typer_app  # noqa: E402
from migration.lib import PHASES  # noqa: E402

PHASE_DESCRIPTIONS: dict[str, str] = {
    "preflight": "P0  Pre-flight checks (5 green checks or HOLD).",
    "freeze": "P1  Capture freeze instant; old app set read-only.",
    "delta": "P2  Final pgloader delta into mysql_raw.",
    "build_stg": "P3a Build stg from mysql_raw + crosswalks + id maps.",
    "build_app": "P3b Build demos_app from stg in one transaction.",
    "constraints": "P5  Validate FKs; add constraint triggers + indexes.",
    "parity": "P6  Pure-Postgres parity report (mysql_raw vs demos_app); gate marked only on GREEN.",
    "flip": "P7  Go-live verification: DEMOS healthz with retries + operator confirms PMDA is read-only.",
    "smoke": "P8  Manual smoke checklist for top-N user journeys.",
    "decom": "P10 Revoke MySQL access; final backup; post-mortem.",
}


def _help_text(command_name: str) -> str | None:
    """Capture `uv run migrate <name> --help` output.

    Returns sanitised help text on success. Returns None if capture
    failed (typically because the `migration` package isn't installed
    in the active environment) so the caller can render a stable
    placeholder note instead of leaking a Python traceback.
    """
    if command_name == "ROOT":
        argv = ["uv", "run", "migrate", "--help"]
    else:
        argv = ["uv", "run", "migrate", command_name, "--help"]
    env = {**os.environ, "NO_COLOR": "1", "TERM": "dumb", "COLUMNS": "100"}
    proc = subprocess.run(
        argv,
        check=False,
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        env=env,
    )
    stdout = proc.stdout.strip()
    stderr = proc.stderr.strip()
    if proc.returncode != 0 or not stdout or "Traceback" in stderr:
        return None
    return _sanitize(stdout)


def _command_names() -> list[str]:
    """Return registered Typer command names in declaration order."""
    return [
        cmd.name or cmd.callback.__name__
        for cmd in typer_app.registered_commands
        if cmd.callback is not None
    ]


def _short_help(name: str) -> str:
    """Return the first line of the docstring for command ``name`` (or empty)."""
    for cmd in typer_app.registered_commands:
        if (cmd.name or (cmd.callback and cmd.callback.__name__)) == name:
            doc = (cmd.callback.__doc__ or "").strip().splitlines()
            return doc[0] if doc else ""
    return ""


def main() -> None:
    """Render the AsciiDoc CLI reference and write it to stdout."""
    out: list[str] = []
    out.append("// AUTO-GENERATED FROM migration/cli.py via docs/tools/cli_to_adoc.py.")
    out.append("// Do not edit by hand. Run `make cli-ref` to regenerate.")
    out.append("")
    out.append("= CLI reference: `migrate`")
    out.append(":toc: macro")
    out.append(":source-highlighter: rouge")
    out.append("")
    out.append("toc::[]")
    out.append("")
    out.append("All commands run via `uv run migrate <name>`.")
    out.append("`./scripts/cutover.sh <name>` is a thin shim that forwards to the same.")
    out.append("")
    out.append("== Phase order")
    out.append("")
    out.append(
        "Cutover phases run in this canonical order (the order used by "
        "`migrate resume` and rendered by `migrate status`):"
    )
    out.append("")
    out.append('[cols="1,1,4"]')
    out.append("|===")
    out.append("| # | Phase | Description")
    out.append("")
    for i, phase in enumerate(PHASES):
        desc = PHASE_DESCRIPTIONS.get(phase, "")
        out.append(f"| {i} | `{phase}` | {desc}")
    out.append("|===")
    out.append("")

    def _emit_help(label: str, text: str | None) -> None:
        if text is None:
            out.append("[NOTE]")
            out.append("====")
            out.append(
                f"Live `--help` text was not captured for `{label}` at "
                "generation time. Run `make cli-ref` from `docs/` in an "
                "environment where the `migration` package is installed "
                "(e.g. after `uv sync --extra dev`) to populate this "
                "block, or run `uv run migrate "
                f"{'' if label == 'migrate' else label.split(' ', 1)[1] + ' '}--help` "
                "directly to see current options."
            )
            out.append("====")
        else:
            out.append("[source]")
            out.append("----")
            out.append(text)
            out.append("----")
        out.append("")

    out.append("== Top-level help")
    out.append("")
    _emit_help("migrate", _help_text("ROOT"))

    out.append("== Commands")
    out.append("")
    for name in _command_names():
        # `--accept-pending` style flags appear in the rendered help; we
        # don't model them here -- the help block is the source of truth.
        anchor = name.replace("-", "_")
        out.append(f"[[cmd_{anchor}]]")
        out.append(f"=== `migrate {name}`")
        out.append("")
        short = _short_help(name)
        if short:
            out.append(short)
            out.append("")
        _emit_help(f"migrate {name}", _help_text(name))

    sys.stdout.write("\n".join(out).rstrip() + "\n")


if __name__ == "__main__":
    main()
