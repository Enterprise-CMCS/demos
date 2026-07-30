"""Assert every built page is reachable from both navigation surfaces.

Run from the repo root via ``make verify-docnav`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_docnav.py

The docs set has two independent navigation surfaces, and both are
hand-maintained:

* ``docs/tools/docnav.py`` ``ORDER`` -- the linear reading order that renders
  the prev/next footer on each page.
* ``docs/toc.adoc`` -- the flat grouped index.

A page absent from ``ORDER`` renders with no footer, so a reader walking the
chain never arrives at it. A page absent from ``toc.adoc`` is unreachable from
the index. Neither omission breaks the Asciidoctor build, so both rot
silently: this check is what makes them fail ``make verify`` instead.

It also asserts each committed footer matches what ``docnav.py`` would render
today, so inserting a page into ``ORDER`` without running ``make docnav``
fails rather than leaving its neighbours pointing past it.

The set of built pages is parsed out of the ``html`` recipe in
``docs/Makefile`` rather than hardcoded here, so adding a book to the build
automatically brings it under the check.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from docnav import DOCNAV_RE, ORDER, block_for

DOCS = Path(__file__).resolve().parents[1]
MAKEFILE = DOCS / "Makefile"
TOC = DOCS / "toc.adoc"

# `-D build <page>.adoc <page>.adoc` (the root pages) and
# `-D build/<dir> <dir>/*.adoc` (one per audience book).
_ROOT_PAGES_RE = re.compile(r"-D build ((?:[\w.-]+\.adoc\s*)+)")
_BOOK_DIR_RE = re.compile(r"-D build/([\w-]+) \1/\*\.adoc")

_XREF_RE = re.compile(r"xref:([\w./-]+\.adoc)")

# toc.adoc is built, but it *is* the index: it carries no docnav footer and
# does not xref itself.
NOT_IN_READING_ORDER = {"toc.adoc"}


def built_pages() -> tuple[list[str], list[str]]:
    """Return ``(pages, problems)`` for the page set the html target renders."""
    if not MAKEFILE.exists():
        return [], [f"missing {MAKEFILE.relative_to(DOCS.parent)}"]
    recipe = MAKEFILE.read_text(encoding="utf-8")

    pages: list[str] = []
    root_match = _ROOT_PAGES_RE.search(recipe)
    if root_match is None:
        return [], ["could not find the root-page asciidoctor call in the html recipe"]
    pages += root_match.group(1).split()

    book_dirs = _BOOK_DIR_RE.findall(recipe)
    if not book_dirs:
        return [], ["could not find any per-book asciidoctor call in the html recipe"]
    for book in book_dirs:
        pages += sorted(f"{book}/{p.name}" for p in (DOCS / book).glob("*.adoc"))
    return pages, []


def main() -> int:
    """Report pages missing from ``ORDER`` or ``toc.adoc``, and dead entries."""
    pages, problems = built_pages()
    if problems:
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        print("verify-docnav: FAIL", file=sys.stderr)
        return 1

    toc_targets = {t.split("/")[-1] for t in _XREF_RE.findall(TOC.read_text(encoding="utf-8"))}
    expected = [p for p in pages if p not in NOT_IN_READING_ORDER]

    for page in expected:
        if page not in ORDER:
            problems.append(
                f"{page} is built but missing from docnav.py ORDER "
                "(it would render with no prev/next footer)"
            )
        if page.split("/")[-1] not in toc_targets:
            problems.append(f"{page} is built but not xref'd from toc.adoc")

    for rel in ORDER:
        path = DOCS / rel
        if not path.exists():
            problems.append(f"docnav.py ORDER lists {rel}, which does not exist")
            continue
        found = DOCNAV_RE.search(path.read_text(encoding="utf-8"))
        if found is None:
            problems.append(f"{rel} carries no docnav footer; run `make docnav`")
        elif found.group(0).strip() != block_for(rel).strip():
            problems.append(f"{rel} docnav footer is stale; run `make docnav`")

    for rel in sorted({rel for rel in ORDER if ORDER.count(rel) > 1}):
        problems.append(f"docnav.py ORDER lists {rel} more than once")

    if problems:
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        print(f"verify-docnav: FAIL ({len(problems)})", file=sys.stderr)
        return 1
    print(f"verify-docnav: OK ({len(expected)} built pages in ORDER and toc.adoc)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
