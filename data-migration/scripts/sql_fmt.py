#!/usr/bin/env python3
"""Format the repo's SQL with pgFormatter (pg_format), or check formatting.

pg_format owns all SQL layout and case in this repo; sqlfluff is lint-only
(see docs/developer/reference-sql-conventions.adoc). This wrapper pins the
canonical flags in one place so the Makefile, the pre-commit hook, and a manual
run can never disagree, restricts the file set to hand-written SQL (the
pgloader ``*.load`` DSL and generated ``state/`` are excluded by construction),
and asserts every formatted file is round-trip stable before trusting it.

Usage:
  python scripts/sql_fmt.py --check [FILE ...]   # exit 1 if any file would change
  python scripts/sql_fmt.py --write [FILE ...]   # rewrite files in place

With no FILE arguments the full in-scope set is formatted. FILE arguments
(passed by the pre-commit hook) are filtered down to the in-scope set.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Canonical pg_format flags: 2-space indent (house style); keyword-case
# uppercase (pg_format default 2); type-case lowercase (default 1);
# function-case unchanged (default 0); no space between a function name and its
# open paren. --extra-function lists left/right so the string functions render
# as left()/right() instead of the misleading keyword form `LEFT (...)`.
# Changing these reshapes every file -- do it deliberately.
_EXTRA_FUNCTIONS = REPO_ROOT / "scripts" / "pg_format_functions.txt"
PG_FORMAT_CMD = [
    "pg_format",
    "-s",
    "2",
    "--no-space-function",
    "--extra-function",
    str(_EXTRA_FUNCTIONS),
]

# In-scope globs, relative to REPO_ROOT.
SCOPE_GLOBS = ("sql/**/*.sql", "scripts/*.sql", "tests/sql/fixtures/**/*.sql")

# Files pg_format cannot safely format. generate_fk_candidates.sql uses
# `LIKE '...' ESCAPE '\'`; the lone-backslash escape string confuses
# pg_format's tokenizer, which then mangles the adjacent LIKE pattern literal
# (drops the backslash, inserts spaces). The mangled output is itself
# round-trip stable, so only a token-level diff catches it. Quarantined from
# formatting; still linted and front-matter-checked.
EXCLUDE = frozenset({REPO_ROOT / "scripts" / "generate_fk_candidates.sql"})


def in_scope_files() -> list[Path]:
    """Every hand-written SQL file pg_format should own, sorted and de-duped."""
    files: set[Path] = set()
    for pattern in SCOPE_GLOBS:
        files.update(REPO_ROOT.glob(pattern))
    return sorted(files - EXCLUDE)


def _format_text(text: str) -> str:
    result = subprocess.run(
        [*PG_FORMAT_CMD, "-"],
        input=text,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def _ensure_pg_format() -> None:
    try:
        subprocess.run(["pg_format", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        sys.exit(
            "pg_format not found. Install pgFormatter:\n"
            "  brew install pgformatter                 (macOS)\n"
            "  https://github.com/darold/pgFormatter    (other platforms)"
        )


def _selected(paths: list[str]) -> list[Path]:
    if not paths:
        return in_scope_files()
    scope = set(in_scope_files())
    return [p for raw in paths if (p := Path(raw).resolve()) in scope]


def main(argv: list[str]) -> int:
    mode = "check"
    paths: list[str] = []
    for arg in argv:
        if arg in ("--check", "--write"):
            mode = arg[2:]
        elif arg.startswith("-"):
            sys.exit(f"unknown flag: {arg}")
        else:
            paths.append(arg)

    _ensure_pg_format()
    targets = _selected(paths)

    would_change: list[Path] = []
    unstable: list[Path] = []
    for path in targets:
        original = path.read_text()
        formatted = _format_text(original)
        # Round-trip safety: a second pass must be a no-op. If pg_format is not
        # a fixed point on this file we must not trust (or write) the rewrite.
        if _format_text(formatted) != formatted:
            unstable.append(path)
            continue
        if formatted != original:
            would_change.append(path)
            if mode == "write":
                path.write_text(formatted)

    if unstable:
        print("pg_format is not round-trip stable on:", file=sys.stderr)
        for path in unstable:
            print(f"  {path.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 2
    if mode == "check" and would_change:
        print("These SQL files are not formatted (run `make sql-fmt`):", file=sys.stderr)
        for path in would_change:
            print(f"  {path.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1
    if mode == "write" and would_change:
        print(f"reformatted {len(would_change)} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
