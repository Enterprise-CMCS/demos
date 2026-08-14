"""Verify the committed schema-count attributes match the live target model.

Run from the repo root via ``make verify-counts`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_counts.py

The prose constraint-table pages cite counts via attributes defined in the
generated ``docs/shared/generated/schema-counts.adoc`` partial. This check
re-derives those counts from the Prisma DDL and asserts the committed values
agree, so a stale (hand-edited or un-regenerated) counts partial fails
``make all`` rather than silently misleading a reader.
"""

from __future__ import annotations

import re
import sys

from schema_model import DOCS_DIR, build_target_model

COUNTS_FILE = DOCS_DIR / "shared" / "generated" / "schema-counts.adoc"
_ATTR_RE = re.compile(r"^:([a-z0-9-]+):\s*(.+?)\s*$")


def expected_counts() -> dict[str, int]:
    tables, classes, _fks, _label = build_target_model()

    def members(cls: str) -> list[str]:
        return [t for t, c in classes.items() if c == cls]

    static = members("staticConstraint")
    extra = [t for t in static if any(c.name not in tables[t].pk for c in tables[t].columns)]
    return {
        "static-constraint-count": len(static),
        "static-constraint-extra-col-count": len(extra),
        "type-limiter-count": len(members("typeLimiter")),
        "data-table-count": len(members("dataTable")),
        "associative-table-count": len(members("associativeTable")),
    }


def committed_counts() -> dict[str, int]:
    out: dict[str, int] = {}
    if not COUNTS_FILE.exists():
        return out
    for line in COUNTS_FILE.read_text().splitlines():
        m = _ATTR_RE.match(line)
        if m and m.group(2).isdigit():
            out[m.group(1)] = int(m.group(2))
    return out


def main() -> int:
    expected = expected_counts()
    committed = committed_counts()

    problems: list[str] = []
    if not committed:
        problems.append(
            f"{COUNTS_FILE.relative_to(DOCS_DIR.parent)} is missing or empty; "
            "run `make schema-diagrams`"
        )
    for key, want in expected.items():
        got = committed.get(key)
        if got != want:
            problems.append(f"{key}: committed {got!r} != model {want}")

    if problems:
        print(f"verify-counts: {len(problems)} mismatch(es):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        print("  fix: run `make schema-diagrams` and commit the partial.", file=sys.stderr)
        return 1
    print(f"verify-counts: OK ({len(expected)} counts match the model)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
