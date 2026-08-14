"""Verify every crosswalk's target id is a real seeded constraint-table row.

Run from the repo root via ``make verify-crosswalks`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_crosswalks.py

Each ``reports/crosswalks/*.csv`` maps a legacy value to a canonical DEMOS
text id. That id must be a row seeded into the corresponding static-constraint
table by the Prisma artifact. This guards the SME-facing crosswalk docs: if the
upstream schema renames or drops a seeded value, the crosswalk (and the prose
that cites it) is caught here instead of failing at ``build_app``.

The target table is resolved, in order, by:

1. an explicit override in ``crosswalk_targets.yaml``;
2. the ``crosswalk:<name>`` transform in ``reports/source_target_columns.csv``
   -> the mapped demos column -> its FK parent table;
3. the crosswalk file stem itself being a seeded table.

Exits non-zero (failing ``make all``) on any unknown id or unresolvable target.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import yaml
from schema_model import REPO_ROOT, load_target_model

CROSSWALK_DIR = REPO_ROOT / "reports" / "crosswalks"
SOURCE_TARGET_COLUMNS = REPO_ROOT / "reports" / "source_target_columns.csv"
OVERRIDES_FILE = Path(__file__).resolve().parent / "crosswalk_targets.yaml"

# Candidate columns that carry the resolved DEMOS text id, in priority order.
VALUE_COLUMNS = ("sme_confirmed_value", "proposed_demos_text_id", "demos_text_id")


def load_overrides() -> dict[str, str]:
    if not OVERRIDES_FILE.exists():
        return {}
    data = yaml.safe_load(OVERRIDES_FILE.read_text()) or {}
    overrides = data.get("overrides") or {}
    return {str(k): str(v) for k, v in overrides.items()}


def crosswalk_column_targets() -> dict[str, tuple[str, str]]:
    """Map ``crosswalk:<name>`` -> ``(demos_table, demos_column)``."""
    out: dict[str, tuple[str, str]] = {}
    if not SOURCE_TARGET_COLUMNS.exists():
        return out
    with SOURCE_TARGET_COLUMNS.open(newline="") as f:
        for row in csv.DictReader(f):
            transform = (row.get("transform") or "").strip()
            if not transform.startswith("crosswalk:"):
                continue
            name = transform.split(":", 1)[1].strip()
            table = (row.get("demos_table") or "").strip()
            col = (row.get("demos_column") or "").strip()
            if name and table and col:
                out.setdefault(name, (table, col))
    return out


def resolve_target(stem, overrides, col_targets, model) -> tuple[str | None, str]:
    """Return (target_table, how) or (None, reason)."""
    if stem in overrides:
        return overrides[stem], "override"
    if stem in col_targets:
        table, col = col_targets[stem]
        for fk in model.fks:
            if fk.child == table and col in fk.child_cols:
                return fk.parent, f"FK {table}.{col}"
        return None, f"no FK from {table}.{col}"
    if stem in model.seeds:
        return stem, "stem is a seeded table"
    return None, "no override / crosswalk mapping / matching table"


def value_column(fieldnames) -> str | None:
    for c in VALUE_COLUMNS:
        if c in (fieldnames or []):
            return c
    return None


def main() -> int:
    model = load_target_model(include_history=True)
    overrides = load_overrides()
    col_targets = crosswalk_column_targets()

    problems: list[str] = []
    checked = 0
    for csv_path in sorted(CROSSWALK_DIR.glob("*.csv")):
        stem = csv_path.stem
        rel = csv_path.relative_to(REPO_ROOT)
        table, how = resolve_target(stem, overrides, col_targets, model)
        if table is None:
            problems.append(f"{rel}: cannot resolve target table ({how})")
            continue
        if table not in model.seeds:
            problems.append(f"{rel}: target table `{table}` has no seeded rows")
            continue
        seeded = set(model.seeds[table])

        with csv_path.open(newline="") as f:
            reader = csv.DictReader(f)
            col = value_column(reader.fieldnames)
            if col is None:
                # Multi-column tuple crosswalks (e.g. system_role) have no
                # single demos_text_id column; they are validated by their own
                # *_check.sql, not this tool. Skip rather than fail.
                continue
            checked += 1
            for i, row in enumerate(reader, start=2):
                val = (row.get(col) or "").strip()
                if not val:
                    continue
                if val not in seeded:
                    problems.append(
                        f"{rel}:{i}: `{val}` is not a seeded `{table}` id (via {how})"
                    )

    if problems:
        print(f"verify-crosswalks: {len(problems)} problem(s):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print(f"verify-crosswalks: OK ({checked} crosswalk file(s) checked)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
