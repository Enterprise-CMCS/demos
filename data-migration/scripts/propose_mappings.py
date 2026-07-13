#!/usr/bin/env python3
"""Generate confidence-tagged skeleton column-mapping proposals.

For every ``foldable`` target table in ``reports/inputs/proposed_table_map.yaml`` this
emits one proposal row per target column to
``reports/inputs/source_target_columns.proposed.csv`` -- the same shape as the live
``source_target_columns.csv`` plus a ``confidence`` column.

The generator only fills ``mysql_column``/``transform`` for the **mechanical
skeleton** it can infer with high confidence from column names and types
(primary key -> ``id_map``, ``*_name`` -> ``copy``, ``creatd_dt`` -> ``cast``,
etc.). Every semantic column (status/type/role crosswalks, owner-user identity,
ambiguous dates, JSONB packing) is emitted with ``confidence = none`` and a
blank ``mysql_column`` -- a deliberate blank for the SME to fill, NOT a guess.
This mirrors ``reports/crosswalks/proposed/`` and keeps the forcing function
intact.

NOT wired into the pipeline. Run from the repo root::

    uv run python scripts/propose_mappings.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "docs" / "tools"))

from schema_model import COLUMNS_FILE, load_target_model  # noqa: E402

TABLE_MAP_FILE = REPO_ROOT / "reports" / "inputs" / "proposed_table_map.yaml"
OUT_CSV = REPO_ROOT / "reports" / "inputs" / "source_target_columns.proposed.csv"

FIELDS = ["mysql_table", "mysql_column", "demos_table", "demos_column",
          "transform", "confidence", "notes"]

# Audit columns the target fills itself; not an SME decision.
AUDIT = {"created_at": "creatd_dt", "updated_at": "updtd_dt"}


def load_source_schema() -> tuple[dict[str, set[str]], dict[str, list[str]]]:
    """Return ``({table: {col}}, {table: [pk_col, ...]})`` from the snapshot."""
    cols: dict[str, set[str]] = {}
    pks: dict[str, list[str]] = {}
    with COLUMNS_FILE.open(newline="") as f:
        for raw in csv.DictReader(f):
            row = {(k or "").lower(): v for k, v in raw.items()}
            t, c = row.get("table_name"), row.get("column_name")
            if not t or not c:
                continue
            cols.setdefault(t, set()).add(c)
            if "PRI" in (row.get("column_key") or ""):
                pks.setdefault(t, []).append(c)
    return cols, pks


def pick_unique(src_cols: set[str], primary: str, suffix: str) -> str | None:
    """Pick a source column for ``suffix`` only when it is unambiguous.

    Prefers the table-stem match (``<primary><suffix>``, e.g.
    ``mdcd_dlvrbl_name``); otherwise accepts a sole candidate; otherwise
    returns ``None`` so the caller leaves it blank rather than guessing
    (``mdcd_dlvrbl`` has six ``*_name`` columns -- picking one is an SME call).
    """
    exact = f"{primary}{suffix}"
    if exact in src_cols:
        return exact
    cands = [c for c in sorted(src_cols) if c.endswith(suffix)]
    return cands[0] if len(cands) == 1 else None


def propose(
    *,
    col_name: str,
    col_type: str,
    nullable: bool,
    primary: str,
    src_cols: set[str],
    src_pk: list[str],
) -> tuple[str, str, str, str]:
    """Return ``(mysql_column, transform, confidence, notes)`` for one target col."""
    # --- mechanical skeleton: high confidence ----------------------------- #
    if col_name == "id" and col_type == "uuid":
        pk = src_pk[0] if len(src_pk) == 1 else ""
        return pk, "id_map", "high" if pk else "medium", "minted UUID via migration._id_map_*"
    if col_name == "demonstration_id" and "mdcd_demo_id" in src_cols:
        return "mdcd_demo_id", "id_map", "high", "resolve via migration._id_map_demo"
    if col_name in AUDIT and AUDIT[col_name] in src_cols:
        note = "timestamp -> timestamptz"
        if col_name == "updated_at":
            note = "COALESCE(updtd_dt, creatd_dt); timestamp -> timestamptz"
        return AUDIT[col_name], "cast", "high", note
    if col_name == "name":
        c = pick_unique(src_cols, primary, "_name")
        if c:
            return c, "copy", "high", "direct copy after trim"
        return "", "copy", "none", "several/no *_name source columns -- SME to pick"
    if col_name == "description":
        c = pick_unique(src_cols, primary, "_desc")
        if c:
            return c, "copy", "medium", "direct copy after trim"
        return "", "copy", "none", "several/no *_desc source columns -- SME to pick"
    if col_name in ("effective_date", "expiration_date", "due_date") or col_name.endswith("_date"):
        return "", "cast", "low", "ambiguous source date column -- SME to pick (from_dt/to_dt/_strt_dt/_end_dt)"

    # --- semantic: deliberately blank, confidence none -------------------- #
    if col_type == "text" and col_name.endswith("_id"):
        return "", "crosswalk:?", "none", f"crosswalk to seeded {col_name[:-3]} domain -- SME decision"
    if col_type == "uuid" and col_name.endswith("_id"):
        return "", "id_map", "none", f"FK to {col_name[:-3]}; confirm source column + id_map -- SME"
    nn = "NOT NULL" if not nullable else "nullable"
    return "", "", "none", f"{nn}; no obvious source -- SME (derive/constant/drop?)"


def iter_proposals() -> list[dict[str, str]]:
    """Build the confidence-tagged proposal rows for every foldable table.

    Shared by :func:`main` (CSV writer) and the derivability audit (which only
    needs the ``confidence`` histogram), so both read one source of truth.
    """
    model = load_target_model(include_history=False)
    src_cols, src_pks = load_source_schema()
    tmap = yaml.safe_load(TABLE_MAP_FILE.read_text()) or {}
    foldable: dict[str, dict] = tmap.get("foldable") or {}

    rows: list[dict[str, str]] = []
    for tname in sorted(foldable):
        spec = foldable[tname]
        sources = spec.get("sources") or []
        primary = sources[0] if sources else ""
        pcols = src_cols.get(primary, set())
        ppk = src_pks.get(primary, [])
        table = model.tables.get(tname)
        if table is None:
            continue
        for col in table.columns:
            mc, transform, conf, note = propose(
                col_name=col.name,
                col_type=col.type,
                nullable=col.nullable,
                primary=primary,
                src_cols=pcols,
                src_pk=ppk,
            )
            if len(sources) > 1 and note and "SME" in note:
                note += f" [sources: {', '.join(sources)}]"
            rows.append({
                "mysql_table": primary,
                "mysql_column": mc,
                "demos_table": tname,
                "demos_column": col.name,
                "transform": transform,
                "confidence": conf,
                "notes": note,
            })
    return rows


def main() -> int:
    rows = iter_proposals()

    with OUT_CSV.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    by_conf: dict[str, int] = {}
    for r in rows:
        by_conf[r["confidence"]] = by_conf.get(r["confidence"], 0) + 1
    n_tables = len({r["demos_table"] for r in rows})
    print(f"Wrote {OUT_CSV.relative_to(REPO_ROOT)}: {len(rows)} proposal rows "
          f"across {n_tables} foldable tables")
    for c in ("high", "medium", "low", "none"):
        if c in by_conf:
            print(f"  confidence {c:7} {by_conf[c]:4}")
    print("\nReview: fill blank mysql_column / resolve transform for confidence=none rows,\n"
          "then transcribe confirmed rows into reports/source_target_columns.csv.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
