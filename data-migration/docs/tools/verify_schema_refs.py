"""Verify that the documentation's references to code/schema still resolve.

Run from the repo root via ``make verify-schema-refs`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_schema_refs.py

Three checks, all reading the same authoritative model as the generators:

1. ``xref:`` targets resolve to a real ``.adoc`` file (relative to the page).
2. Backticked repo-path references (``sql/...``, ``reports/...``, ...) exist
   on disk. Placeholders (``<sha>``, globs) are skipped.
3. Qualified ``demos_app.<table>[.<column>]`` references exist in the target
   schema, and -- on the data-layer pages only -- every bare snake_case
   identifier in inline monospace is a known schema name or an entry in the
   committed vocabulary allow-list (``docs/tools/doc_vocab.txt``).

Exits non-zero (failing ``make all``) when any reference does not resolve.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from schema_model import (
    DOCS_DIR,
    REPO_ROOT,
    load_source_columns,
    load_target_model,
)

VOCAB_FILE = Path(__file__).resolve().parent / "doc_vocab.txt"
ABSENT_PATHS_FILE = Path(__file__).resolve().parent / "doc_absent_paths.txt"
CROSSWALK_DIR = REPO_ROOT / "reports" / "crosswalks"
SOURCE_TARGET_COLUMNS = REPO_ROOT / "reports" / "source_target_columns.csv"

# Pages where bare (unqualified) identifiers are treated as schema claims.
DATA_LAYER_GLOBS = [
    "sme/*.adoc",
    "developer/reference-data-dictionary.adoc",
    "developer/reference-source-target-columns.adoc",
    "developer/reference-prisma-ddl.adoc",
    "developer/reference-jsonb-schema-registry.adoc",
    "developer/reference-id-maps.adoc",
    "shared/schema-overview.adoc",
    "shared/architecture-overview.adoc",
]

REPO_PATH_PREFIXES = (
    "sql/", "reports/", "state/", "pgloader/",
    "migration/", "docs/", "scripts/", "runbooks/", "tests/",
)

_INLINE_RE = re.compile(r"`([^`]+)`")
_XREF_RE = re.compile(r"xref:([^\[\]\s]+)\[")
_DEMOS_QUAL_RE = re.compile(r"\bdemos_app\.([a-z_]\w*)(?:\.([a-z_]\w*))?")
_BARE_IDENT_RE = re.compile(r"^[a-z][a-z0-9_]+$")
_PLACEHOLDER = re.compile(r"[<>*?]")
_BLOCK_DELIM = ("----", "....", "====", "****")


def _is_vendored(p: Path) -> bool:
    """Skip hidden dirs (.bundle, .letta, ...), build output, and generated partials."""
    rel = p.relative_to(DOCS_DIR).as_posix()
    if any(part.startswith(".") for part in rel.split("/")):
        return True
    return rel.startswith("build/") or "shared/generated/" in rel or "/legacy/" in rel or rel.startswith("legacy/")


def all_docs() -> list[Path]:
    return sorted(p for p in DOCS_DIR.rglob("*.adoc") if not _is_vendored(p))


def is_tutorial(p: Path) -> bool:
    """Tutorials use deliberately invented example tables/files; skip name checks."""
    return p.name.startswith("tutorial-")


def data_layer_docs() -> set[Path]:
    out: set[Path] = set()
    for pat in DATA_LAYER_GLOBS:
        out.update(d for d in DOCS_DIR.glob(pat) if not is_tutorial(d))
    return out


def filter_unignored(paths: set[str]) -> set[str]:
    """Drop paths git ignores (runtime artifacts like ``state/*.ok``)."""
    if not paths:
        return set()
    ordered = sorted(paths)
    proc = subprocess.run(
        ["git", "check-ignore", "--stdin"],
        input="\n".join(ordered),
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    ignored = {line.strip() for line in proc.stdout.splitlines() if line.strip()}
    return {p for p in ordered if p not in ignored}


def iter_inline_tokens(text: str):
    """Yield inline-monospace tokens that sit outside delimited blocks."""
    in_block = False
    for line in text.splitlines():
        if line.rstrip() and any(line.startswith(d) for d in _BLOCK_DELIM):
            in_block = not in_block
            continue
        if in_block:
            continue
        for m in _INLINE_RE.finditer(line):
            yield m.group(1)


def _load_list(path: Path) -> set[str]:
    if not path.exists():
        return set()
    out: set[str] = set()
    for line in path.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            out.add(line)
    return out


def load_vocab() -> set[str]:
    return _load_list(VOCAB_FILE)


def load_absent_paths() -> set[str]:
    return _load_list(ABSENT_PATHS_FILE)


def crosswalk_names() -> set[str]:
    names: set[str] = set()
    if CROSSWALK_DIR.exists():
        names.update(p.stem for p in CROSSWALK_DIR.glob("*.csv"))
        names.update(p.stem.replace(".proposed", "") for p in CROSSWALK_DIR.glob("proposed/*.csv"))
    return names


def check_xrefs(docs: list[Path], problems: list[str]) -> None:
    for doc in docs:
        for target in _XREF_RE.findall(doc.read_text()):
            path_part = target.split("#", 1)[0]
            if not path_part or not path_part.endswith(".adoc"):
                continue
            resolved = (doc.parent / path_part).resolve()
            if not resolved.exists():
                problems.append(f"{doc.relative_to(REPO_ROOT)}: dead xref -> {target}")


def check_paths(docs: list[Path], problems: list[str]) -> None:
    # Collect candidate missing paths first, then drop git-ignored ones (runtime
    # artifacts under state/ etc.) and explicitly allow-listed absent paths
    # (planned/superseded files the planning narrative discusses).
    allowed = load_absent_paths()
    missing: dict[str, list[Path]] = {}
    for doc in docs:
        if is_tutorial(doc):
            continue
        for tok in iter_inline_tokens(doc.read_text()):
            tok = tok.strip()
            if " " in tok or _PLACEHOLDER.search(tok):
                continue
            if not tok.startswith(REPO_PATH_PREFIXES) or tok in allowed:
                continue
            if (REPO_ROOT / tok).exists():
                continue
            missing.setdefault(tok, []).append(doc)
    for tok in sorted(filter_unignored(set(missing))):
        for doc in missing[tok]:
            problems.append(f"{doc.relative_to(REPO_ROOT)}: missing path -> `{tok}`")


def check_qualified(docs: list[Path], target_tables, problems: list[str]) -> None:
    # Table existence only: docs legitimately discuss non-existent *columns*
    # (e.g. "no demos_app.application.validation_data column exists").
    for doc in docs:
        if is_tutorial(doc):
            continue
        for m in _DEMOS_QUAL_RE.finditer(doc.read_text()):
            table = m.group(1)
            if table not in target_tables:
                problems.append(
                    f"{doc.relative_to(REPO_ROOT)}: unknown demos_app table -> `{table}`"
                )


def check_bare_names(dictionary: set[str], problems: list[str]) -> None:
    for doc in sorted(data_layer_docs()):
        for tok in iter_inline_tokens(doc.read_text()):
            if not _BARE_IDENT_RE.match(tok):
                continue
            if tok in dictionary:
                continue
            problems.append(
                f"{doc.relative_to(REPO_ROOT)}: unknown identifier -> `{tok}` "
                "(real name? add to docs/tools/doc_vocab.txt if intentional)"
            )


def main() -> int:
    model = load_target_model(include_history=True)
    target_tables = set(model.tables)
    all_target_cols = {c.name for tbl in model.tables.values() for c in tbl.columns}

    source_cols = load_source_columns()
    source_tables = set(source_cols)
    all_source_cols = {c for cols in source_cols.values() for c in cols}

    dictionary = (
        {t.lower() for t in target_tables}
        | {c.lower() for c in all_target_cols}
        | {t.lower() for t in source_tables}
        | {c.lower() for c in all_source_cols}
        | crosswalk_names()
        | load_vocab()
    )

    docs = all_docs()
    problems: list[str] = []
    check_xrefs(docs, problems)
    check_paths(docs, problems)
    check_qualified(docs, target_tables, problems)
    check_bare_names(dictionary, problems)

    if problems:
        print(f"verify-schema-refs: {len(problems)} unresolved reference(s):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print(f"verify-schema-refs: OK ({len(docs)} pages checked)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
