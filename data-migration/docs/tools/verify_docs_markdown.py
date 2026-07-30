"""Assert the wiki has not started drifting back into Markdown.

Run from the repo root via ``make verify-docs-markdown`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_docs_markdown.py

``docs/`` is an Asciidoctor wiki. Markdown pages placed under it are invisible
to ``make html``, so they are never rendered, never linked from ``toc.adoc``,
and never covered by ``make verify``. Nine of them accumulated under
``docs/specs/`` and ``docs/superpowers/`` and drifted for weeks while remaining
the cited source of truth for ~30 SQL front-matter blocks. This check exists so
that cannot recur silently.

Four rules:

1. No tracked Markdown file anywhere under ``docs/``. Design notes belong in a
   wiki page; working records belong in ``reports/`` or ``runbooks/``, where
   ``md_to_adoc.py`` can render them into the wiki as a live partial.
2. No ``xref:`` or ``link:`` whose target is a ``.md`` file. Asciidoctor emits
   these as-is, so they 404 in the built HTML. ``verify_schema_refs.py`` skips
   non-``.adoc`` xref targets, so nothing else catches this.
3. No Markdown ATX heading (``## Foo``). Asciidoctor accepts these, which is
   precisely how a half-converted page passes the build looking correct.
4. No Markdown fenced code block or inline ``[label](target)`` link. Both are
   the usual residue of a ``kramdoc`` pass that was never finished by hand.

Rules 2 to 4 skip delimited blocks, so a ``#`` comment or a fence inside a
``[source,bash]`` listing is left alone.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]
REPO_ROOT = DOCS.parent

_BLOCK_DELIM = ("----", "....", "====", "****", "|===", "++++")
_ATX_RE = re.compile(r"^#{1,6} \S")
_FENCE_RE = re.compile(r"^\s*```")
_MD_LINK_RE = re.compile(r"(?<!\\)\[[^\]\n]*\]\((?!\s)[^)\n]+\)")
_MD_TARGET_RE = re.compile(r"\b(?:xref|link):([^\[\]\s]+\.md)(?:#[^\[\]\s]*)?\[")


def tracked_docs_files() -> list[str]:
    """Every git-tracked path under ``docs/``, repo-relative."""
    out = subprocess.run(
        ["git", "ls-files", "-z", "--", "docs"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [p for p in out.stdout.split("\0") if p]


def adoc_pages() -> list[Path]:
    """Every tracked ``.adoc`` file under ``docs/``."""
    return [REPO_ROOT / p for p in tracked_docs_files() if p.endswith(".adoc")]


def scan_page(path: Path, problems: list[str]) -> None:
    """Append a problem for each Markdown residue found outside a block."""
    rel = path.relative_to(REPO_ROOT)
    in_block = False
    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.rstrip()
        if stripped and any(stripped.startswith(d) for d in _BLOCK_DELIM):
            in_block = not in_block
            continue
        for target in _MD_TARGET_RE.findall(line):
            problems.append(f"{rel}:{lineno}: links to a Markdown file -> {target}")
        if in_block:
            continue
        if _ATX_RE.match(line):
            problems.append(f"{rel}:{lineno}: Markdown heading -> {stripped[:60]}")
        if _FENCE_RE.match(line):
            problems.append(f"{rel}:{lineno}: Markdown code fence; use [source,LANG] and ----")
        for found in _MD_LINK_RE.findall(line):
            problems.append(f"{rel}:{lineno}: Markdown link -> {found[:60]}")


def main() -> int:
    """Report Markdown files under ``docs/`` and Markdown residue in pages."""
    problems: list[str] = []

    for rel in tracked_docs_files():
        if rel.endswith(".md"):
            problems.append(f"{rel}: Markdown under docs/ is never built; make it a wiki page")

    for page in adoc_pages():
        scan_page(page, problems)

    if problems:
        print(f"verify-docs-markdown: {len(problems)} problem(s):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print(f"verify-docs-markdown: OK ({len(adoc_pages())} pages, no Markdown under docs/)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
