#!/usr/bin/env python3
"""Enumerate every DEMOS target column that lacks a direct source mapping.

Answers the question: "which target columns exist in the DEMOS tables that do
*not* come 1:1 from the mapped source table, and must therefore be derived
(from Nth tables / crosswalks), defaulted, or supplied by a human?"

It cross-references three artifacts the pipeline already owns:

* the pinned Prisma target DDL (``state/prisma_ddl/<sha>.sql``) -- every target
  table + column + nullability + DEFAULT clause;
* the source MySQL schema snapshot (``reports/schema_snapshot/columns.csv``);
* the SME column map (``reports/source_target_columns.csv``) -- which
  ``(demos_table, demos_column)`` pairs are already wired to a source column.

Every target column is bucketed into one classification (see ``Bucket``).

Outputs:

* ``reports/generated/derivability_audit.csv`` -- the machine-readable per-column
  enumeration;
* committed AsciiDoc fragments under ``docs/shared/generated/`` (the headline
  attributes, classification table, in-scope gap verdict, non-derivable
  evidence, table-bucket split, and proposal histogram) that the wiki page
  ``docs/shared/derivability-audit.adoc`` ``include::``s, so every number and
  table in the docs is generated rather than hand-transcribed;
* a summary to stdout.

The per-gap *verdict* (is the gap derivable, and how) is human judgement kept
in ``reports/inputs/derivability_verdicts.yaml`` and joined back into the generated
verdict table. The audit fails closed when that sidecar and the live gap set
disagree, so the prose cannot drift from the schema.

Run from the repo root (or ``make derivability`` in ``docs/``)::

    uv run python scripts/derivability_audit.py
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

import yaml
from rich import box
from rich.console import Console
from rich.table import Table

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "docs" / "tools"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from propose_mappings import iter_proposals  # noqa: E402
from schema_model import (  # noqa: E402
    is_history,
    load_source_columns,
    load_target_model,
)

COLUMN_MAP = REPO_ROOT / "reports" / "source_target_columns.csv"
OUT_CSV = REPO_ROOT / "reports" / "generated" / "derivability_audit.csv"
VERDICTS_FILE = REPO_ROOT / "reports" / "inputs" / "derivability_verdicts.yaml"
SEEDED_FILE = REPO_ROOT / "state" / "prisma_seeded_tables.json"
TABLE_MAP_FILE = REPO_ROOT / "reports" / "inputs" / "proposed_table_map.yaml"
FRAGMENT_DIR = REPO_ROOT / "docs" / "shared" / "generated"

# Static descriptive prose that pairs with the *generated* counts. The numbers
# are always live; only these human-readable meanings are fixed here.
CLASSIFICATION_ORDER = [
    "mapped",
    "default",
    "audit_timestamp",
    "nullable_unmapped",
    "GAP_in_scope",
    "GAP_table_pending",
]
CLASSIFICATION_MEANING = {
    "mapped": "1:1 wired to a source column in the column map",
    "default": "target supplies a `DEFAULT` -- no source needed",
    "audit_timestamp": "`created_at` / `updated_at`",
    "nullable_unmapped": "nullable & unmapped -- may be left NULL",
    "GAP_in_scope": "NOT NULL, no default, unmapped, in a *mapped* table",
    "GAP_table_pending": "same, but the whole table awaits SME mapping",
}
BUCKET_ORDER = ["mapped", "seeded", "net_new", "foldable"]
BUCKET_MEANING = {
    "mapped": "already wired",
    "seeded": "*no* -- Prisma owns these reference / limiter / tag / role domains",
    "net_new": "*no* -- empty at cutover, populated by the new app",
    "foldable": "*yes* -- a real PMDA -> DEMOS fold",
}

# Columns the target manages itself (defaults, triggers, SERIAL) -- never a
# source-derivation obligation even when NOT NULL.
HISTORY_SYSTEM_COLS = {"revision_id", "revision_type", "modified_at"}
AUDIT_COLS = {"created_at", "updated_at"}


def _plain(text: str) -> str:
    """Strip the asciidoc inline emphasis the ``*_MEANING`` strings carry so
    they render cleanly in the terminal."""
    return text.replace("*", "").replace("`", "")


def load_column_map() -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    """Parse the SME column map.

    Returns ``(mapped_cols, source_tables)`` where ``mapped_cols`` is
    ``{demos_table: {demos_column, ...}}`` for non-drop rows and
    ``source_tables`` is ``{demos_table: {mysql_table, ...}}``.
    """
    mapped: dict[str, set[str]] = {}
    sources: dict[str, set[str]] = {}
    with COLUMN_MAP.open(newline="") as f:
        for row in csv.DictReader(f):
            if (row.get("transform") or "").strip() == "drop":
                continue
            dt = (row.get("demos_table") or "").strip()
            dc = (row.get("demos_column") or "").strip()
            mt = (row.get("mysql_table") or "").strip()
            if dt and dc:
                mapped.setdefault(dt, set()).add(dc)
            if dt and mt:
                sources.setdefault(dt, set()).add(mt)
    return mapped, sources


def bucket_live_tables(live_tables: list[str], mapped: dict[str, set[str]]) -> dict[str, list[str]]:
    """Partition live target tables into mapped / seeded / net_new / foldable.

    Asserts the partition is total and disjoint so the split stays honest as the
    schema or the curated ``proposed_table_map.yaml`` changes.
    """
    seeded = set(json.loads(SEEDED_FILE.read_text()))
    tmap = yaml.safe_load(TABLE_MAP_FILE.read_text()) or {}
    net_new = set(tmap.get("net_new") or {})
    foldable = set(tmap.get("foldable") or {})

    buckets = {
        "mapped": sorted(t for t in live_tables if t in mapped),
        "seeded": sorted(t for t in live_tables if t in seeded and t not in mapped),
        "net_new": sorted(t for t in live_tables if t in net_new),
        "foldable": sorted(t for t in live_tables if t in foldable),
    }

    assigned: dict[str, int] = {}
    for members in buckets.values():
        for t in members:
            assigned[t] = assigned.get(t, 0) + 1
    dupes = sorted(t for t, n in assigned.items() if n > 1)
    missing = sorted(t for t in live_tables if t not in assigned)
    if dupes or missing:
        raise SystemExit(
            "proposed_table_map.yaml partition is not clean:\n"
            f"  in >1 bucket: {dupes}\n"
            f"  unassigned:   {missing}\n"
            "Add each unassigned table to net_new or foldable (or it is seeded/mapped)."
        )
    return buckets


def load_verdicts() -> dict[str, dict]:
    """Parse the human verdict sidecar keyed by ``<table>.<column>``."""
    if not VERDICTS_FILE.exists():
        raise SystemExit(f"missing verdict sidecar: {VERDICTS_FILE}")
    data = yaml.safe_load(VERDICTS_FILE.read_text()) or {}
    return {str(k): (v or {}) for k, v in data.items()}


def validate_verdicts(gap_keys: set[str], verdicts: dict[str, dict]) -> None:
    """Fail closed when the sidecar and the live in-scope gap set disagree.

    Mirrors the ``proposed_table_map.yaml`` partition assertion: every gap must
    carry a verdict, and no verdict may name a column that is no longer a gap.
    """
    missing = sorted(gap_keys - set(verdicts))
    orphan = sorted(set(verdicts) - gap_keys)
    if missing or orphan:
        raise SystemExit(
            f"{VERDICTS_FILE.relative_to(REPO_ROOT)} is out of sync with the live "
            "GAP_in_scope set:\n"
            f"  no verdict for: {missing}\n"
            f"  verdict for a non-gap column (remove it): {orphan}\n"
            "Update the sidecar to match scripts/derivability_audit.py output."
        )


def _banner(ddl_label: str) -> str:
    return (
        f"// Generated by scripts/derivability_audit.py from "
        f"state/prisma_ddl/{ddl_label}.sql -- do not edit.\n"
        "// Run `make derivability` (in docs/) to regenerate.\n\n"
    )


def _write_fragment(name: str, ddl_label: str, body: str) -> None:
    FRAGMENT_DIR.mkdir(parents=True, exist_ok=True)
    (FRAGMENT_DIR / name).write_text(_banner(ddl_label) + body.rstrip() + "\n", encoding="utf-8")


def emit_attrs(ddl_label: str, attrs: dict[str, object]) -> str:
    lines = [f":{k}: {v}" for k, v in attrs.items()]
    return "\n".join(lines) + "\n"


def emit_classification(counts: dict[str, int]) -> str:
    out = [
        ".Live (non-history) target columns by classification",
        '[cols="2,1,4",options="header"]',
        "|===",
        "| Classification | Count | Meaning",
        "",
    ]
    for cls in CLASSIFICATION_ORDER:
        out.append(f"| `{cls}` | {counts.get(cls, 0)} | {CLASSIFICATION_MEANING[cls]}")
    out.append("|===")
    return "\n".join(out) + "\n"


def emit_verdict(gaps: list[dict[str, str]], verdicts: dict[str, dict]) -> str:
    out = [
        ".In-scope gap verdict (live gaps joined with `reports/inputs/derivability_verdicts.yaml`)",
        '[cols="3,1,2,5",options="header"]',
        "|===",
        "| Target column | Type | Derivable? | Path / why",
        "",
    ]
    for r in gaps:
        key = f"{r['target_table']}.{r['target_column']}"
        v = verdicts[key]
        derivable = bool(v.get("derivable"))
        via = str(v.get("via", "")).strip()
        marker = f"yes -- {via}" if derivable else "no"
        path = str(v.get("path", "")).strip()
        out.append(f"| `{key}` | `{r['target_type']}` | {marker} | {path}")
    out.append("|===")
    return "\n".join(out) + "\n"


def emit_evidence(gaps: list[dict[str, str]], verdicts: dict[str, dict]) -> str:
    """Group non-derivable gaps by identical evidence text into labelled paragraphs."""
    types = {f"{r['target_table']}.{r['target_column']}": r["target_type"] for r in gaps}
    groups: dict[str, list[str]] = {}
    for r in gaps:
        key = f"{r['target_table']}.{r['target_column']}"
        v = verdicts[key]
        if v.get("derivable"):
            continue
        evidence = str(v.get("evidence", "")).strip()
        groups.setdefault(evidence, []).append(key)
    blocks: list[str] = []
    for evidence, keys in sorted(groups.items(), key=lambda kv: kv[1][0]):
        labels = ", ".join(f"`{k}`" for k in keys)
        coltype = types[keys[0]]
        blocks.append(f"*{labels}* (NOT NULL `{coltype}`). {evidence}")
    return "\n\n".join(blocks) + "\n"


def emit_buckets(buckets: dict[str, list[str]]) -> str:
    out = [
        ".Live target tables by bucket (asserted total + disjoint)",
        '[cols="2,1,5",options="header"]',
        "|===",
        "| Bucket | Count | Needs a source mapping?",
        "",
    ]
    for name in BUCKET_ORDER:
        out.append(f"| `{name}` | {len(buckets[name])} | {BUCKET_MEANING[name]}")
    out.append("|===")
    foldable = ", ".join(f"`{t}`" for t in buckets["foldable"])
    out.append("")
    out.append(f"The {len(buckets['foldable'])} `foldable` tables (proposal targets): {foldable}.")
    return "\n".join(out) + "\n"


def emit_proposals(by_conf: dict[str, int]) -> str:
    out = [
        ".`source_target_columns.proposed.csv` rows by confidence",
        '[cols="1,1,4",options="header"]',
        "|===",
        "| Confidence | Rows | What",
        "",
    ]
    meaning = {
        "high": "mechanical skeleton (PK -> `id_map`, audit dates, stem-matched `name`)",
        "medium": "sole-candidate `description` copies",
        "low": "date columns where the source date is ambiguous",
        "none": "deliberately blank `mysql_column` -- an SME decision, not a guess",
    }
    for c in ("high", "medium", "low", "none"):
        out.append(f"| `{c}` | {by_conf.get(c, 0)} | {meaning[c]}")
    out.append("|===")
    return "\n".join(out) + "\n"


def classify(
    *,
    table: str,
    col: str,
    nullable: bool,
    in_map: bool,
    has_default: bool,
    in_scope: bool,
) -> str:
    if in_map:
        return "mapped"
    if is_history(table) and col in HISTORY_SYSTEM_COLS:
        return "history_system"
    if has_default:
        return "default"
    if col in AUDIT_COLS:
        return "audit_timestamp"
    if nullable:
        return "nullable_unmapped"
    return "GAP_in_scope" if in_scope else "GAP_table_pending"


def main() -> int:
    model = load_target_model(include_history=True)
    source_cols = load_source_columns()
    mapped, sources = load_column_map()

    rows: list[dict[str, str]] = []
    for tname in sorted(model.tables):
        table = model.tables[tname]
        in_scope = tname in mapped
        for col in table.columns:
            in_map = col.name in mapped.get(tname, set())
            has_default = col.default is not None
            bucket = classify(
                table=tname,
                col=col.name,
                nullable=col.nullable,
                in_map=in_map,
                has_default=has_default,
                in_scope=in_scope,
            )
            rows.append(
                {
                    "target_table": tname,
                    "target_column": col.name,
                    "target_type": col.type,
                    "nullable": "yes" if col.nullable else "no",
                    "has_default": "yes" if has_default else "no",
                    "is_history": "yes" if is_history(tname) else "no",
                    "table_in_scope": "yes" if in_scope else "no",
                    "source_tables": ";".join(sorted(sources.get(tname, set()))),
                    "classification": bucket,
                }
            )

    with OUT_CSV.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    live = [r for r in rows if r["is_history"] == "no"]
    counts: dict[str, int] = {}
    for r in live:
        counts[r["classification"]] = counts.get(r["classification"], 0) + 1

    live_tables = [t for t in model.tables if not is_history(t)]
    gaps = sorted(
        (r for r in live if r["classification"] == "GAP_in_scope"),
        key=lambda r: (r["target_table"], r["target_column"]),
    )
    n_pending_tables = sum(1 for t in model.tables if not is_history(t) and t not in mapped)
    buckets = bucket_live_tables(live_tables, mapped)
    # The honest derivation residue: pending NOT-NULL columns that live in the
    # `foldable` tables (the only pending bucket that needs a *source-derived*
    # mapping; seeded/net_new tables never will). Lets the prose scope the
    # alarming `GAP_table_pending` headline to what actually needs work.
    foldable_set = set(buckets["foldable"])
    gap_foldable = sum(
        1
        for r in live
        if r["classification"] == "GAP_table_pending" and r["target_table"] in foldable_set
    )

    # ---- verdict sidecar (fail-closed join) ------------------------------ #
    gap_keys = {f"{r['target_table']}.{r['target_column']}" for r in gaps}
    verdicts = load_verdicts()
    validate_verdicts(gap_keys, verdicts)
    derivable_n = sum(1 for k in gap_keys if verdicts[k].get("derivable"))

    # ---- proposal histogram (shared with propose_mappings) --------------- #
    proposals = iter_proposals()
    by_conf: dict[str, int] = {}
    for p in proposals:
        by_conf[p["confidence"]] = by_conf.get(p["confidence"], 0) + 1
    prop_total = len(proposals) or 1
    prop_filled = sum(1 for p in proposals if p["mysql_column"])

    # ---- generated AsciiDoc fragments ------------------------------------ #
    attrs = {
        "derivability-ddl-label": model.ddl_label,
        "derivability-target-tables": len(model.tables),
        "derivability-live-tables": len(live_tables),
        "derivability-source-tables": len(source_cols),
        "derivability-gap-in-scope": counts.get("GAP_in_scope", 0),
        "derivability-gap-pending": counts.get("GAP_table_pending", 0),
        "derivability-pending-tables": n_pending_tables,
        "derivability-derivable": derivable_n,
        "derivability-nonderivable": len(gap_keys) - derivable_n,
        "derivability-mapped-tables": len(buckets["mapped"]),
        "derivability-seeded-tables": len(buckets["seeded"]),
        "derivability-netnew-tables": len(buckets["net_new"]),
        "derivability-foldable-tables": len(buckets["foldable"]),
        "derivability-gap-foldable": gap_foldable,
        "derivability-prop-rows": len(proposals),
        "derivability-prop-filled": prop_filled,
        "derivability-prop-filled-pct": round(100 * prop_filled / prop_total),
        "derivability-prop-none": by_conf.get("none", 0),
        "derivability-prop-none-pct": round(100 * by_conf.get("none", 0) / prop_total),
    }
    ddl_label = model.ddl_label
    _write_fragment("derivability-attrs.adoc", ddl_label, emit_attrs(ddl_label, attrs))
    _write_fragment("derivability-classification.adoc", ddl_label, emit_classification(counts))
    _write_fragment("derivability-verdict.adoc", ddl_label, emit_verdict(gaps, verdicts))
    _write_fragment("derivability-evidence.adoc", ddl_label, emit_evidence(gaps, verdicts))
    _write_fragment("derivability-buckets.adoc", ddl_label, emit_buckets(buckets))
    _write_fragment("derivability-proposals.adoc", ddl_label, emit_proposals(by_conf))

    # ---- stdout summary -------------------------------------------------- #
    console = Console()
    console.print(f"Target DDL: {model.ddl_label}")
    console.print(
        f"Target tables: {len(model.tables)} total, {len(live_tables)} live (non-history)"
    )
    console.print(f"Source tables in snapshot: {len(source_cols)}")
    console.print(f"Wrote {OUT_CSV.relative_to(REPO_ROOT)} ({len(rows)} rows incl. history)")
    console.print()

    cls_table = Table(
        title="Live (non-history) target columns by classification",
        title_justify="left",
        box=box.SIMPLE_HEAVY,
        header_style="bold cyan",
    )
    cls_table.add_column("Classification")
    cls_table.add_column("Count", justify="right")
    cls_table.add_column("Meaning")
    for cls in CLASSIFICATION_ORDER:
        cls_table.add_row(cls, str(counts.get(cls, 0)), _plain(CLASSIFICATION_MEANING[cls]))
    console.print(cls_table)
    console.print()

    gap_table = Table(
        title="GAP_in_scope -- target NOT NULL, no default, unmapped, in a mapped table",
        title_justify="left",
        box=box.SIMPLE_HEAVY,
        header_style="bold cyan",
    )
    gap_table.add_column("Target column", overflow="fold")
    gap_table.add_column("Type")
    gap_table.add_column("Source table(s)")
    gap_table.add_column("Verdict")
    if not gaps:
        gap_table.add_row("(none)", "", "", "")
    for r in gaps:
        key = f"{r['target_table']}.{r['target_column']}"
        verdict_row = verdicts[key]
        if verdict_row.get("derivable"):
            via = str(verdict_row.get("via", "")).strip()
            verdict = f"[green]yes[/green] -- {via}" if via else "[green]yes[/green]"
        else:
            verdict = "[red]NOT derivable[/red]"
        gap_table.add_row(key, r["target_type"], r["source_tables"] or "?", verdict)
    console.print(gap_table)
    console.print()

    n_foldable = len(buckets["foldable"])
    console.print(
        f"Target tables with no mapping rows yet: {n_pending_tables} "
        "[dim](raw count; overstates the work)[/dim]"
    )
    console.print(
        f"  Only [bold]{n_foldable} (foldable)[/bold] need a source-derived mapping; "
        f"{len(buckets['seeded'])} seeded + {len(buckets['net_new'])} net_new "
        "are out of scope for derivation"
    )
    console.print()

    bucket_table = Table(
        title="Live target tables by bucket (reproducible split)",
        title_justify="left",
        box=box.SIMPLE_HEAVY,
        header_style="bold cyan",
    )
    bucket_table.add_column("Bucket")
    bucket_table.add_column("Count", justify="right")
    bucket_table.add_column("Needs source mapping?")
    for name in BUCKET_ORDER:
        bucket_table.add_row(name, str(len(buckets[name])), _plain(BUCKET_MEANING[name]))
    bucket_table.add_section()
    bucket_table.add_row("total", str(sum(len(v) for v in buckets.values())), "")
    console.print(bucket_table)
    console.print()

    console.print("foldable (proposal targets -- see scripts/propose_mappings.py):")
    for t in buckets["foldable"]:
        console.print(f"  {t}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
