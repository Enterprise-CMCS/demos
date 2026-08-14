"""Render the live Markdown working files into committed AsciiDoc partials.

Run from the repo root via ``make live-partials`` (in ``docs/``):

    cd .. && uv run python docs/tools/md_to_adoc.py

Several reference/how-to pages embed a "live file" that is authored and
maintained as Markdown elsewhere in the repo (``reports/*.md``,
``runbooks/*.md``) so it stays readable on GitHub and editable by SMEs.
Including the raw Markdown into an AsciiDoc page does not render it
(GitHub tables and ``#`` headings are not AsciiDoc), so this generator
converts each live file into an AsciiDoc partial under
``docs/shared/generated/live/`` that the pages ``include::``. The
partials are committed; only authors regenerating them need ``kramdoc``.

Conversion uses ``kramdoc`` (kramdown-asciidoc), the Asciidoctor-native
Markdown converter. The leading Markdown ``#`` title is stripped from
each partial so the including page's own section heading names the block
and headings nest cleanly (the page applies ``leveloffset`` as needed).
"""

from __future__ import annotations

import shutil
import subprocess
import sys

from schema_model import DOCS_DIR, REPO_ROOT

OUT_DIR = DOCS_DIR / "shared" / "generated" / "live"

# Live Markdown source (repo-relative) -> generated partial filename.
# Comms templates (runbooks/comms/*.md) are intentionally left as verbatim
# source blocks in reference-comms-templates.adoc and are not converted.
MAPPINGS: dict[str, str] = {
    "reports/narrative/drop_list.md": "drop-list.adoc",
    "reports/narrative/pending_approved_decisions.md": "pending-approved-decisions.adoc",
    "reports/narrative/history_strategy.md": "history-strategy.adoc",
    "runbooks/rollback.md": "rollback.adoc",
    "runbooks/cutover.md": "cutover.adoc",
    "runbooks/revalidate-jsonb.md": "revalidate-jsonb.adoc",
}


def _resolve_kramdoc() -> tuple[list[str], str | None]:
    """Return ``(argv_prefix, cwd)`` for invoking kramdoc.

    Tries, in order:
    1. A direct ``kramdoc`` on PATH (gems installed globally).
    2. ``mise exec -- bundle exec kramdoc`` (mise activates the Ruby from
       ``docs/mise.toml``; the common case when gems are installed via
       ``bundle install`` with ``BUNDLE_PATH`` and mise manages Ruby).
    3. ``bundle exec kramdoc`` (fallback without mise).
    """
    if shutil.which("kramdoc") is not None:
        return (["kramdoc"], None)
    if shutil.which("mise") is not None:
        return (["mise", "exec", "--", "bundle", "exec", "kramdoc"], str(DOCS_DIR))
    return (["bundle", "exec", "kramdoc"], str(DOCS_DIR))


def _convert(src_rel: str) -> str:
    src = REPO_ROOT / src_rel
    if not src.exists():
        raise SystemExit(f"md_to_adoc: missing source file {src_rel}")
    kramdoc_argv, kramdoc_cwd = _resolve_kramdoc()
    proc = subprocess.run(
        [*kramdoc_argv, "--format=GFM", "--wrap=preserve", "-o", "-", str(src)],
        capture_output=True,
        text=True,
        cwd=kramdoc_cwd,
    )
    if proc.returncode != 0:
        raise SystemExit(f"md_to_adoc: kramdoc failed on {src_rel}:\n{proc.stderr}")
    return proc.stdout


def _strip_title(adoc: str) -> str:
    """Drop the leading ``= Title`` (former Markdown H1) and following blanks."""
    lines = adoc.splitlines()
    if lines and lines[0].startswith("= "):
        lines = lines[1:]
        while lines and not lines[0].strip():
            lines.pop(0)
    return "\n".join(lines).rstrip() + "\n"


def _banner(src_rel: str) -> str:
    return (
        f"// Generated from {src_rel} by docs/tools/md_to_adoc.py -- do not edit.\n"
        "// Run `make live-partials` (in docs/) to regenerate.\n\n"
    )


def main() -> int:
    kramdoc_argv, kramdoc_cwd = _resolve_kramdoc()
    # Verify the resolved kramdoc is actually invocable before proceeding.
    check = subprocess.run(
        [*kramdoc_argv, "--version"],
        capture_output=True,
        text=True,
        cwd=kramdoc_cwd,
    )
    if check.returncode != 0:
        raise SystemExit(
            "md_to_adoc: `kramdoc` not found on PATH and `bundle exec kramdoc` "
            "failed. Install kramdown-asciidoc (`gem install kramdown-asciidoc`) "
            "or run `make install` in docs/."
        )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_rel, out_name in MAPPINGS.items():
        body = _strip_title(_convert(src_rel))
        (OUT_DIR / out_name).write_text(_banner(src_rel) + body, encoding="utf-8")
        print(f"[live-partials] wrote {(OUT_DIR / out_name).relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
