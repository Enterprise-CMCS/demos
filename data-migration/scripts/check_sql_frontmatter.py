#!/usr/bin/env python3
"""Check that every hand-written SQL file carries a structured front-matter block.

Translucency rests on a predictable header in every file (see
docs/developer/reference-sql-conventions.adoc). Authored transform layers must
declare the full set of fields; mechanical bootstrap/seed/id-map files carry a
lighter Purpose+Refs subset. This checker parses only the leading comment block
of each file and asserts the required labels are present -- it does not police
the prose beneath them.

The one exception is `Refs:`, whose whole value is repo paths. Those are
resolved against the tree, so a header cannot keep pointing at a file that was
renamed or deleted. Paths that are deliberately absent live in
docs/tools/doc_absent_paths.txt, shared with docs/tools/verify_schema_refs.py.

Usage:
  python scripts/check_sql_frontmatter.py [FILE ...]   # exit 1 on any offender

With no FILE arguments the full in-scope set is checked. FILE arguments (passed
by the pre-commit hook) are filtered down to the in-scope set.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Refs may cite the sibling DEMOS application (server/, client/), which lives
# one level up in the monorepo.
MONOREPO_ROOT = REPO_ROOT.parent

ABSENT_PATHS_FILE = REPO_ROOT / "docs" / "tools" / "doc_absent_paths.txt"

SCOPE_GLOBS = ("sql/**/*.sql", "scripts/*.sql", "tests/sql/fixtures/**/*.sql")

FULL_LABELS = ("Purpose", "Inputs", "Outputs", "Invariants", "Refs")
LIGHT_LABELS = ("Purpose", "Refs")

# sql/ subdirectories that carry authored transform intelligence (vs the
# mechanical bootstrap/seed/id-map layers, which get the light subset).
FULL_LAYERS = frozenset({
    "04_crosswalks",
    "10_stg",
    "20_app",
    "21_app_associative",
    "23_app_derived",
    "31_constraint_triggers",
    "99_parity",
})

# A Refs token is only treated as a path if it starts with one of these. Prose
# containing a slash ("Pending/approved", "fail-closed w/ NULL") is left alone.
REF_PATH_PREFIXES = (
    "sql/", "reports/", "state/", "pgloader/", "migration/", "docs/",
    "scripts/", "runbooks/", "tests/", "server/", "client/", "lambdas/",
)

# Adornments a citation may carry after the path proper: an AsciiDoc anchor,
# a pytest node id, or a line number.
_REF_SUFFIX = re.compile(r"(?:#|::|:\d).*$")
_REF_PLACEHOLDER = re.compile(r"[<>*?]")
_REF_SPLIT = re.compile(r"[;,]|\s+")


def in_scope_files() -> list[Path]:
    """Every hand-written SQL file that must carry front-matter."""
    files: set[Path] = set()
    for pattern in SCOPE_GLOBS:
        files.update(REPO_ROOT.glob(pattern))
    return sorted(files)


def required_labels(path: Path) -> tuple[str, ...]:
    """The labels a given file must declare, by its pipeline layer."""
    rel = path.resolve().relative_to(REPO_ROOT)
    parts = rel.parts
    if parts[0] == "sql" and len(parts) >= 3 and parts[1] in FULL_LAYERS:
        return FULL_LABELS
    return LIGHT_LABELS


def leading_comment(text: str) -> str:
    """The file's leading comment block (`/* ... */` or a run of `--` lines)."""
    stripped = text.lstrip()
    if stripped.startswith("/*"):
        end = stripped.find("*/")
        return stripped[: end if end != -1 else len(stripped)]
    if stripped.startswith("--"):
        lines: list[str] = []
        for line in stripped.splitlines():
            if line.lstrip().startswith("--"):
                lines.append(line)
            else:
                break
        return "\n".join(lines)
    return ""


def missing_from_text(text: str, labels: tuple[str, ...]) -> list[str]:
    """Labels absent from the leading comment block of the given SQL text."""
    header = leading_comment(text)
    return [
        label
        for label in labels
        if not re.search(rf"^\s*(?:--|\*)?\s*{label}\s*:", header, re.MULTILINE)
    ]


def missing_labels(path: Path) -> list[str]:
    """Required labels absent from a file's front-matter block."""
    return missing_from_text(path.read_text(), required_labels(path))


def load_absent_paths() -> set[str]:
    """Repo-relative paths that are deliberately not in the tree."""
    if not ABSENT_PATHS_FILE.exists():
        return set()
    return {
        stripped
        for line in ABSENT_PATHS_FILE.read_text().splitlines()
        if (stripped := line.split("#", 1)[0].strip())
    }


def _uncomment(line: str) -> str:
    """A header line with its comment marker (`--`, `/*`, `*`) removed."""
    return re.sub(r"^\s*(?:--|/\*|\*)\s?", "", line).rstrip()


def refs_value(text: str) -> str | None:
    """The `Refs:` value from a file's front-matter, or None if it has no Refs.

    Continuation lines are folded in; the value ends at the first blank line or
    the next `Label:` line.
    """
    collected: list[str] | None = None
    for line in map(_uncomment, leading_comment(text).splitlines()):
        if collected is None:
            if m := re.match(r"\s*Refs\s*:(.*)$", line):
                collected = [m.group(1).strip()]
            continue
        if not line.strip() or re.match(r"\s*[A-Z][A-Za-z ]{2,20}\s*:", line):
            break
        collected.append(line.strip())
    return " ".join(collected).strip() if collected is not None else None


def ref_paths(text: str) -> list[str]:
    """Repo paths cited in a file's `Refs:` front-matter field."""
    value = refs_value(text)
    if value is None:
        return []
    paths = []
    for raw in _REF_SPLIT.split(value):
        tok = _REF_SUFFIX.sub("", raw.strip().strip(".,;()[]`'\"")).rstrip(".")
        if tok.startswith(REF_PATH_PREFIXES) and not _REF_PLACEHOLDER.search(tok):
            paths.append(tok)
    return paths


def dangling_refs(text: str, allowed: set[str]) -> list[str]:
    """Cited paths that resolve nowhere, in file order and without repeats."""
    seen: set[str] = set()
    out: list[str] = []
    for ref in ref_paths(text):
        if ref in allowed or ref in seen:
            continue
        seen.add(ref)
        if not (REPO_ROOT / ref).exists() and not (MONOREPO_ROOT / ref).exists():
            out.append(ref)
    return out


def block_comment_unterminated(text: str) -> bool:
    """True if C-style block comments do not close at depth 0.

    Postgres *nests* ``/* ... */`` comments, so a stray ``/*`` in comment prose
    -- e.g. a glob like ``sql/10_stg/*`` -- opens a nested comment that silently
    swallows the SQL below. String literals and dollar-quoted bodies are
    skipped so a ``/*`` inside them does not count.
    """
    i, n, depth = 0, len(text), 0
    while i < n:
        two = text[i : i + 2]
        if depth:
            if two == "/*":
                depth += 1
                i += 2
            elif two == "*/":
                depth -= 1
                i += 2
            else:
                i += 1
            continue
        if two == "--":
            nl = text.find("\n", i)
            i = n if nl < 0 else nl + 1
        elif two == "/*":
            depth += 1
            i += 2
        elif text[i] == "'":
            j = i + 1
            while j < n:
                if text[j : j + 2] == "''":
                    j += 2
                    continue
                if text[j] == "'":
                    break
                j += 1
            i = j + 1
        elif m := re.match(r"\$[A-Za-z_]*\$", text[i:]):
            tag = m.group(0)
            j = text.find(tag, i + len(tag))
            i = n if j < 0 else j + len(tag)
        else:
            i += 1
    return depth != 0


def _selected(paths: list[str]) -> list[Path]:
    if not paths:
        return in_scope_files()
    scope = set(in_scope_files())
    return [p for raw in paths if (p := Path(raw).resolve()) in scope]


def main(argv: list[str]) -> int:
    offenders: list[tuple[Path, list[str]]] = []
    comment_offenders: list[Path] = []
    ref_offenders: list[tuple[Path, list[str]]] = []
    allowed = load_absent_paths()
    for path in _selected(argv):
        text = path.read_text()
        missing = missing_from_text(text, required_labels(path))
        if missing:
            offenders.append((path, missing))
        if block_comment_unterminated(text):
            comment_offenders.append(path)
        if dangling := dangling_refs(text, allowed):
            ref_offenders.append((path, dangling))

    if offenders:
        print("SQL files missing front-matter fields:", file=sys.stderr)
        for path, missing in offenders:
            print(f"  {path.relative_to(REPO_ROOT)}: missing {', '.join(missing)}", file=sys.stderr)
    if comment_offenders:
        print(
            "SQL files with an unterminated/nested block comment "
            "(a `/*` in comment prose -- e.g. a `dir/*` glob -- swallows the SQL below):",
            file=sys.stderr,
        )
        for path in comment_offenders:
            print(f"  {path.relative_to(REPO_ROOT)}", file=sys.stderr)
    if ref_offenders:
        print(
            "SQL files whose front-matter Refs point at paths that do not exist "
            "(fix the citation, or allow-list it in docs/tools/doc_absent_paths.txt "
            "if the file is deliberately absent):",
            file=sys.stderr,
        )
        for path, dangling in ref_offenders:
            print(f"  {path.relative_to(REPO_ROOT)}: {', '.join(dangling)}", file=sys.stderr)

    if offenders or comment_offenders or ref_offenders:
        print(
            "\nSee docs/developer/reference-sql-conventions.adoc for the template.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
