"""Generate mermaid schema diagrams (as committed .adoc partials) from the
authoritative schema artifacts.

This is the inverse of the retired ``mmd_sql_compare`` scripts: instead of
treating a hand-authored mermaid file as the source of truth and checking the
DDL against it, this tool *generates* the diagrams from the artifacts the
pipeline already owns:

* Target ``demos_app`` schema -- from the Prisma DDL
  (``state/prisma_ddl/<sha>.sql``, the concatenated migration set) plus the
  captured FKs (``state/prisma_fks.json``). One ER diagram per table *class*
  (static constraints / type limiters / data tables / associative tables);
  ``*_history`` tables are excluded.
* Source MySQL schema -- a prefix-clustered *overview* (not a full ER diagram:
  the source has 500+ tables and no declared FKs) built from the schema
  snapshot (``reports/schema_snapshot/table_stats.csv``), with the pgloader
  drop list applied and group-level edges taken from ``reports/inputs/fk_overrides.yaml``
  + ``reports/generated/fk_candidates.csv`` where present.

Outputs are deterministic ``.adoc`` partials under ``docs/shared/generated/``
(no timestamps, stable ordering) so the docs build can ``include::`` them and
CI can ``git diff --exit-code`` to catch regen drift.

A separate ``--check-drift`` mode parses the legacy hand-authored
``DEMOS_Data_Model.mmd`` and reports table / relationship / classification
differences against the generated target model into
``reports/schema_drift_report.md``. It is warn-only (always exits 0) so the
hand diagram can be retired or kept honest without blocking the build.

Run from the repo root via ``make schema-diagrams`` / ``make schema-drift``
(in ``docs/``), which execute::

    cd .. && uv run python docs/tools/schema_diagrams_to_adoc.py
    cd .. && uv run python docs/tools/schema_diagrams_to_adoc.py --check-drift
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml

# Make the sibling ``schema_model`` importable whether this file is run as a
# script (cwd on path) or loaded by path from the test suite.
TOOLS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS_DIR))
from schema_model import (  # noqa: E402
    CLASS_ORDER,
    CLASS_SLUG,
    DEMOS_DATA_MODEL_MMD,
    FK,
    REPO_ROOT,
    Table,
    _read_csv_lower,
    build_target_model,
    load_source_tables,
)

DOCS_DIR = TOOLS_DIR.parent

# Reuse the canonical path constants so this tool stays in lockstep with the
# rest of the package layout.
sys.path.insert(0, str(REPO_ROOT))
from migration.lib import REPORTS_DIR  # noqa: E402

OUT_DIR = DOCS_DIR / "shared" / "generated"
DROP_LIST_FILE = REPO_ROOT / "pgloader" / "drop_list.txt"
FK_OVERRIDES_FILE = REPORTS_DIR / "inputs" / "fk_overrides.yaml"
FK_CANDIDATES_FILE = REPORTS_DIR / "generated" / "fk_candidates.csv"
DRIFT_REPORT_FILE = REPORTS_DIR / "schema_drift_report.md"

# The hand-authored model lives in the parent ../demos repo checkout (shared
# path constant); allow an env override and degrade gracefully when it is not
# present locally.
HAND_MMD_DEFAULT = DEMOS_DATA_MODEL_MMD
_WORKSPACE_ROOT = REPO_ROOT.parent


def _confined_path(raw: str, *, what: str) -> Path:
    """Resolve ``raw`` and refuse paths escaping the workspace (CWE-23 guard).

    The hand model lives in a sibling checkout (``../demos``), so the boundary
    is the workspace root, not the repo. A path resolving outside it (``/etc``,
    ``/tmp``, ``../..`` escapes) is rejected rather than read.
    """
    resolved = Path(raw).resolve()
    if not resolved.is_relative_to(_WORKSPACE_ROOT):
        raise SystemExit(f"refusing {what} outside {_WORKSPACE_ROOT}: {resolved}")
    return resolved

# Class -> mermaid classDef styling, matching the legacy hand model.
CLASS_STYLE: dict[str, str] = {
    "staticConstraint": "stroke:red,fill:pink",
    "typeLimiter": "stroke:navy,fill:lightskyblue",
    "dataTable": "stroke:green,fill:lightgreen",
    "associativeTable": "stroke:darkmagenta,fill:plum",
}


def log(msg: str) -> None:
    print(f"[schema-diagrams] {msg}", file=sys.stderr)


# --------------------------------------------------------------------------- #
# Cardinality
# --------------------------------------------------------------------------- #


def _child_is_unique(table: Table | None, child_cols: list[str]) -> bool:
    if table is None:
        return False
    cols = set(child_cols)
    if set(table.pk) == cols:
        return True
    return any(set(u) == cols for u in table.uniques)


def relationship_tokens(fk: FK, tables: dict[str, Table]) -> tuple[str, str]:
    """Return (parent_token, child_token) mermaid cardinality markers.

    Parent side is mandatory (``||``) unless every child FK column is
    nullable (``|o``); child side is one (``||``) when the FK columns are
    unique/PK on the child, else zero-or-many (``o{``).
    """
    child_tbl = tables.get(fk.child)
    nullable = False
    if child_tbl is not None:
        for cname in fk.child_cols:
            col = child_tbl.column(cname)
            if col is not None and col.nullable:
                nullable = True
                break
    parent_token = "|o" if nullable else "||"
    child_token = "||" if _child_is_unique(child_tbl, fk.child_cols) else "o{"
    return parent_token, child_token


# --------------------------------------------------------------------------- #
# Target diagram rendering
# --------------------------------------------------------------------------- #


def _attr_markers(table: Table, col: str, fk_cols: set[str]) -> str:
    markers: list[str] = []
    if col in table.pk:
        markers.append("PK")
    if col in fk_cols:
        markers.append("FK")
    unique_cols = {c for u in table.uniques for c in u}
    if col in unique_cols and "PK" not in markers:
        markers.append("UK")
    return ", ".join(markers)


def render_target_cluster(
    cls: str,
    tables: dict[str, Table],
    classes: dict[str, str],
    fks: list[FK],
    ddl_label: str,
) -> str:
    members = sorted(t for t, c in classes.items() if c == cls)
    fk_cols_by_table: dict[str, set[str]] = defaultdict(set)
    for fk in fks:
        fk_cols_by_table[fk.child].update(fk.child_cols)

    lines: list[str] = []
    lines.append(
        f"// Generated by docs/tools/schema_diagrams_to_adoc.py from "
        f"state/prisma_ddl/{ddl_label}.sql + state/prisma_fks.json -- do not edit."
    )
    lines.append("")
    lines.append("[mermaid]")
    lines.append("....")
    lines.append("erDiagram")
    for c in CLASS_ORDER:
        lines.append(f"  classDef {c} {CLASS_STYLE[c]}")
    lines.append("")
    for tname in members:
        tbl = tables[tname]
        lines.append(f"  {tname}:::{cls} {{")
        for col in tbl.columns:
            markers = _attr_markers(tbl, col.name, fk_cols_by_table[tname])
            suffix = f" {markers}" if markers else ""
            lines.append(f"    {col.type} {col.name}{suffix}")
        lines.append("  }")
        lines.append("")

    member_set = set(members)
    edges = [fk for fk in fks if fk.child in member_set]
    if edges:
        lines.append("  %% relationships owned by this cluster (child side)")
        for fk in edges:
            parent_token, child_token = relationship_tokens(fk, tables)
            label = ", ".join(fk.child_cols)
            lines.append(
                f"  {fk.parent} {parent_token}--{child_token} {fk.child} : \"{label}\""
            )
    lines.append("....")
    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Source overview rendering
# --------------------------------------------------------------------------- #


def load_drop_list() -> set[str]:
    if not DROP_LIST_FILE.exists():
        return set()
    out: set[str] = set()
    for line in DROP_LIST_FILE.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            out.add(line)
    return out


def source_prefix(name: str) -> str:
    """Group key for a source table name.

    ``*_rfrnc`` reference tables form one group; everything else groups on the
    first underscore-delimited token (``mdcd``, ``bdgt``, ``user``, ...).
    """
    if name.endswith("_rfrnc"):
        return "*_rfrnc"
    return name.split("_", 1)[0]


def _node_id(prefix: str) -> str:
    slug = re.sub(r"[^0-9A-Za-z]+", "_", prefix.replace("*", "star")).strip("_")
    return "g_" + slug


def load_source_edges(table_to_group: dict[str, str]) -> list[tuple[str, str]]:
    """Group-level edges from fk_overrides.yaml + fk_candidates.csv (if any)."""
    pairs: set[tuple[str, str]] = set()

    def add(from_t: str, to_t: str) -> None:
        ft = from_t.split(".", 1)[-1]
        tt = to_t.split(".", 1)[-1]
        gf, gt = table_to_group.get(ft), table_to_group.get(tt)
        if gf and gt and gf != gt:
            pairs.add((gf, gt))

    if FK_OVERRIDES_FILE.exists():
        data = yaml.safe_load(FK_OVERRIDES_FILE.read_text()) or {}
        for entry in data.get("overrides") or []:
            if isinstance(entry, dict) and entry.get("from_table") and entry.get("to_table"):
                add(str(entry["from_table"]), str(entry["to_table"]))

    for row in _read_csv_lower(FK_CANDIDATES_FILE):
        ft = row.get("from_table_qual") or row.get("from_table")
        tt = row.get("to_table")
        if ft and tt:
            add(str(ft), str(tt))

    return sorted(pairs)


def render_source_overview() -> str:
    drop = load_drop_list()
    tables = [t for t in load_source_tables() if t not in drop]
    counts: dict[str, int] = defaultdict(int)
    table_to_group: dict[str, str] = {}
    for t in tables:
        g = source_prefix(t)
        counts[g] += 1
        table_to_group[t] = g

    edges = load_source_edges(table_to_group)
    groups = sorted(counts)

    lines: list[str] = []
    lines.append(
        "// Generated by docs/tools/schema_diagrams_to_adoc.py from "
        "reports/schema_snapshot/table_stats.csv (drop list applied) -- do not edit."
    )
    lines.append("")
    if not tables:
        lines.append("NOTE: no source schema snapshot found "
                     "(`reports/schema_snapshot/table_stats.csv`). Run "
                     "`make schema_snapshot` against the source first.")
        lines.append("")
        return "\n".join(lines).rstrip() + "\n"
    lines.append("[mermaid]")
    lines.append("....")
    lines.append("flowchart LR")
    for g in groups:
        lines.append(f'  {_node_id(g)}["{g}_* ({counts[g]})"]'
                     if not g.startswith("*")
                     else f'  {_node_id(g)}["{g} ({counts[g]})"]')
    if edges:
        lines.append("")
        for gf, gt in edges:
            lines.append(f"  {_node_id(gf)} --> {_node_id(gt)}")
    lines.append("....")
    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Counts + readable list partials (consumed by the prose reference pages)
# --------------------------------------------------------------------------- #


def _extra_columns(table: Table) -> list[str]:
    """Columns of a constraint table beyond its primary key."""
    return [c.name for c in table.columns if c.name not in table.pk]


def _members(classes: dict[str, str], cls: str) -> list[str]:
    return sorted(t for t, c in classes.items() if c == cls)


def render_counts(
    tables: dict[str, Table], classes: dict[str, str], ddl_label: str
) -> str:
    """AsciiDoc attribute definitions for the table-class counts.

    Prose pages ``include::`` this partial and reference the attributes (e.g.
    ``{static-constraint-count}``) so cited numbers never drift from the DDL.
    """
    static = _members(classes, "staticConstraint")
    extra = [t for t in static if _extra_columns(tables[t])]
    counts = {
        "static-constraint-count": len(static),
        "static-constraint-extra-col-count": len(extra),
        "type-limiter-count": len(_members(classes, "typeLimiter")),
        "data-table-count": len(_members(classes, "dataTable")),
        "associative-table-count": len(_members(classes, "associativeTable")),
    }
    lines = [
        f"// Generated by docs/tools/schema_diagrams_to_adoc.py from "
        f"state/prisma_ddl/{ddl_label}.sql -- do not edit.",
        "",
    ]
    lines += [f":{k}: {v}" for k, v in counts.items()]
    return "\n".join(lines).rstrip() + "\n"


def render_static_constraint_list(
    tables: dict[str, Table], classes: dict[str, str], ddl_label: str
) -> str:
    """A readable table of every static-constraint table and its extra columns."""
    static = _members(classes, "staticConstraint")
    limiters = _members(classes, "typeLimiter")
    lines = [
        f"// Generated by docs/tools/schema_diagrams_to_adoc.py from "
        f"state/prisma_ddl/{ddl_label}.sql -- do not edit.",
        "",
        ".Static-constraint tables (`id text PRIMARY KEY`)",
        '[cols="2,3",options="header"]',
        "|===",
        "| Table | Columns beyond `id`",
        "",
    ]
    for t in static:
        extra = _extra_columns(tables[t])
        cols = ", ".join(f"`{c}`" for c in extra) if extra else "_(none)_"
        lines.append(f"| `{t}` | {cols}")
    lines += ["|===", ""]
    lines.append(
        "Type-limiter tables (each `id text PRIMARY KEY`, no other columns): "
        + ", ".join(f"`{t}`" for t in limiters)
        + "."
    )
    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Generation entry point
# --------------------------------------------------------------------------- #


def generate() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tables, classes, fks, ddl_label = build_target_model()
    for cls in CLASS_ORDER:
        partial = render_target_cluster(cls, tables, classes, fks, ddl_label)
        out = OUT_DIR / f"schema-target-{CLASS_SLUG[cls]}.adoc"
        out.write_text(partial)
        n = sum(1 for c in classes.values() if c == cls)
        log(f"wrote {out.relative_to(REPO_ROOT)} ({n} tables)")

    source = render_source_overview()
    out = OUT_DIR / "schema-source-overview.adoc"
    out.write_text(source)
    log(f"wrote {out.relative_to(REPO_ROOT)}")

    out = OUT_DIR / "schema-counts.adoc"
    out.write_text(render_counts(tables, classes, ddl_label))
    log(f"wrote {out.relative_to(REPO_ROOT)}")

    out = OUT_DIR / "schema-target-static-constraints-list.adoc"
    out.write_text(render_static_constraint_list(tables, classes, ddl_label))
    log(f"wrote {out.relative_to(REPO_ROOT)}")


# --------------------------------------------------------------------------- #
# Drift check against the legacy hand-authored model
# --------------------------------------------------------------------------- #

_HAND_TABLE_RE = re.compile(r'^\s*([A-Za-z_]\w*):::(\w+)\s*\{')
_HAND_REL_RE = re.compile(r'^\s*([A-Za-z_]\w*)\s+\S*[-.]{2}\S*\s+([A-Za-z_]\w*)\s*:')


def parse_hand_model(text: str) -> tuple[dict[str, str], set[frozenset[str]]]:
    """Parse the hand-authored erDiagram into (table->class, relationship pairs).

    Entity blocks are tracked explicitly rather than by counting braces: the
    crow's-foot cardinality tokens (``||--|{``, ``}|--||``) embed literal
    ``{``/``}`` that would otherwise corrupt a brace-depth counter.
    """
    classes: dict[str, str] = {}
    rels: set[frozenset[str]] = set()
    in_block = False
    for line in text.splitlines():
        if in_block:
            if line.strip() == "}":
                in_block = False
            continue
        tm = _HAND_TABLE_RE.match(line)
        if tm:
            if tm.group(2) != "legend":
                classes[tm.group(1)] = tm.group(2)
            in_block = True
            continue
        rm = _HAND_REL_RE.match(line)
        if rm and rm.group(1) != rm.group(2):
            rels.add(frozenset({rm.group(1), rm.group(2)}))
    return classes, rels


def check_drift(hand_path: Path) -> None:
    tables, classes, fks, _ = build_target_model()
    gen_tables = set(tables)
    gen_rels = {frozenset({fk.child, fk.parent}) for fk in fks}

    lines: list[str] = ["# Schema diagram drift report", ""]
    if not hand_path.exists():
        lines.append(
            f"Hand-authored model not found at `{hand_path}` "
            "(set `DEMOS_DATA_MODEL_MMD` to its path). Skipped comparison."
        )
        DRIFT_REPORT_FILE.write_text("\n".join(lines) + "\n")
        log(f"hand model missing at {hand_path}; wrote skip note")
        return

    hand_classes, hand_rels = parse_hand_model(hand_path.read_text())
    hand_tables = set(hand_classes)

    only_gen_t = sorted(gen_tables - hand_tables)
    only_hand_t = sorted(hand_tables - gen_tables)
    only_gen_r = sorted("/".join(sorted(p)) for p in (gen_rels - hand_rels))
    only_hand_r = sorted("/".join(sorted(p)) for p in (hand_rels - gen_rels))
    class_mismatch = sorted(
        (t, classes[t], hand_classes[t])
        for t in gen_tables & hand_tables
        if classes[t] != hand_classes[t]
    )

    lines.append(
        f"Compared generated target model against `{hand_path.name}`. "
        "Warn-only; this never fails the build.\n"
    )
    lines.append(f"- Generated tables: **{len(gen_tables)}**, hand tables: **{len(hand_tables)}**")
    lines.append(f"- Generated relationships: **{len(gen_rels)}**, hand: **{len(hand_rels)}**\n")

    def section(title: str, items: list) -> None:
        lines.append(f"## {title} ({len(items)})")
        if items:
            for it in items:
                lines.append(f"- `{it}`" if not isinstance(it, tuple)
                             else f"- `{it[0]}`: generated `{it[1]}` vs hand `{it[2]}`")
        else:
            lines.append("_none_")
        lines.append("")

    section("Tables only in generated", only_gen_t)
    section("Tables only in hand model", only_hand_t)
    section("Relationships only in generated", only_gen_r)
    section("Relationships only in hand model", only_hand_r)
    section("Classification mismatches", class_mismatch)

    DRIFT_REPORT_FILE.write_text("\n".join(lines).rstrip() + "\n")
    total = len(only_gen_t) + len(only_hand_t) + len(only_gen_r) + len(only_hand_r) + len(class_mismatch)
    log(f"wrote {DRIFT_REPORT_FILE.relative_to(REPO_ROOT)} ({total} differences)")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-drift",
        action="store_true",
        help="compare the generated target model against the hand-authored mmd (warn-only)",
    )
    parser.add_argument(
        "--hand-mmd",
        default=os.environ.get("DEMOS_DATA_MODEL_MMD", str(HAND_MMD_DEFAULT)),
        help="path to the legacy DEMOS_Data_Model.mmd for drift checking",
    )
    args = parser.parse_args(argv)
    if args.check_drift:
        # SECURITY: confine the operator/env-supplied model path (CWE-23 guard).
        check_drift(_confined_path(args.hand_mmd, what="hand model"))
    else:
        generate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
