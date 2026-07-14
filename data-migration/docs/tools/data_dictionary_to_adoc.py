"""Generate docs/shared/generated/data-dictionary.adoc from the pinned Prisma DDL.

Run from the repo root (or via ``make data-dictionary`` in ``docs/``):

    uv run python docs/tools/data_dictionary_to_adoc.py

The structural facts (columns, types, nullability, defaults, primary keys,
foreign keys, unique indexes, CHECK constraints, ``*_history`` audit shape)
are parsed straight from the Prisma DDL artifact that ``migrate ddl`` applies
and ``reports/prisma_ddl.sha256`` pins, plus ``sql/01_ddl_supplements/`` for
the migration-private tables (``migration.jsonb_schemas`` and
``migration.bn_workbook_detail``). The page therefore cannot drift from the
schema the build actually installs.

The artifact is the *concatenated Prisma migration history* (19 migrations in
two dialects: quoted Prisma form and unquoted schema-qualified form), not a
resolved schema dump. The parser replays the statements in file order so that
``ADD COLUMN``, ``ALTER COLUMN ... SET NOT NULL`` / ``DROP DEFAULT``,
``ADD CONSTRAINT`` (FK / PK / CHECK / UNIQUE), ``DROP CONSTRAINT`` and
``CREATE UNIQUE INDEX`` migrations are folded onto the initial ``CREATE TABLE``
blocks, yielding the true final schema.

Table intros come from the shared ``table_purpose.PURPOSE`` dict; table
classification (data / associative / static-constraint / type-limiter) comes
from the hand-authored DEMOS data model
(``../demos/data/docs/DEMOS_Data_Model.mmd``; override with the
``DEMOS_DATA_MODEL_MMD`` env var). The output is an AsciiDoc *partial* (no H1,
no toc) included by ``docs/developer/reference-data-dictionary.adoc``.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

from schema_model import (
    DEMOS_DATA_MODEL_MMD,
    MERMAID_CLASS_TO_DIR,
    DDLColumn,
    DDLForeignKey,
    DDLTable,
    replay_ddl,
)
from table_purpose import (
    PURPOSE,
    STATIC_CONSTRAINT_PURPOSE,
    TYPE_LIMITER_PURPOSE,
)

# Local names for the shared rich replay model (the single migration-replay
# parser lives in schema_model, so this dictionary, the column map, the
# derivability audit and the verifiers cannot drift from one another).
Column = DDLColumn
ForeignKey = DDLForeignKey
Table = DDLTable

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = REPO_ROOT / "docs"
PIN_FILE = REPO_ROOT / "reports" / "prisma_ddl.sha256"
PRISMA_CACHE_DIR = REPO_ROOT / "state" / "prisma_ddl"
SUPPLEMENTS_DIR = REPO_ROOT / "sql" / "01_ddl_supplements"
DEMOS_MMD_FILE = Path(os.environ.get("DEMOS_DATA_MODEL_MMD", str(DEMOS_DATA_MODEL_MMD)))
OUTPUT = DOCS_DIR / "shared" / "generated" / "data-dictionary.adoc"

# Entity-block header in the DEMOS data model: ``name:::mermaidClass {``.
_MMD_BLOCK_RE = re.compile(r"^\s*([A-Za-z_]\w*):::(\w+)\s*\{", re.MULTILINE)

DEMO_SCHEMA = "demos_app"
MIGRATION_SCHEMA = "migration"


# --------------------------------------------------------------------------- #
# DDL parsing -- delegated to schema_model's shared migration-replay engine
# (imported above as Column / ForeignKey / Table / replay_ddl).
# --------------------------------------------------------------------------- #


def _resolve_artifact() -> Path:
    pin = PIN_FILE.read_text(encoding="utf-8").strip().split()[0]
    artifact = PRISMA_CACHE_DIR / f"{pin}.sql"
    if not artifact.exists():
        sys.exit(f"data-dictionary: pinned Prisma artifact not cached at {artifact}")
    return artifact


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #


def _load_mmd_classes() -> dict[str, set[str]]:
    """Table-class buckets parsed from the single DEMOS data model file.

    Each entity block is ``name:::mermaidClass { ... }``; the mermaid class is
    mapped to the same class-directory keys the classifier expects. Blocks with
    any other class (e.g. the diagram ``legend``) are ignored.
    """
    buckets: dict[str, set[str]] = {}
    if not DEMOS_MMD_FILE.exists():
        return buckets
    text = DEMOS_MMD_FILE.read_text(encoding="utf-8")
    for match in _MMD_BLOCK_RE.finditer(text):
        cls_dir = MERMAID_CLASS_TO_DIR.get(match.group(2))
        if cls_dir:
            buckets.setdefault(cls_dir, set()).add(match.group(1))
    return buckets


def _classify(tables: dict[str, Table]) -> dict[str, str]:
    """Return table_name -> class label using the DEMOS data model + heuristics."""
    mmd_classes = _load_mmd_classes()
    out: dict[str, str] = {}
    for name, tbl in tables.items():
        if tbl.has_history:
            out[name] = "history"
            continue
        if name in mmd_classes.get("static_constraints", set()):
            out[name] = "Static constraint"
            continue
        if name in mmd_classes.get("type_limiters", set()):
            out[name] = "Type limiter"
            continue
        if name in mmd_classes.get("associative_tables", set()):
            out[name] = "Associative table"
            continue
        if name in mmd_classes.get("data_tables", set()):
            out[name] = "Data table"
            continue
        # Heuristic fallback for tables not yet in the mmd model.
        if name.endswith("_limit"):
            out[name] = "Type limiter"
        elif tbl.schema == MIGRATION_SCHEMA:
            out[name] = "Migration-private"
        elif len(tbl.columns) <= 2 and tbl.pk == ["id"] and not tbl.fks:
            # Trivial single-id lookup not yet modelled in mmd (e.g. new
            # *_status / *_type tables from a recent migration).
            out[name] = "Static constraint"
        else:
            out[name] = "Data table"
    return out


# --------------------------------------------------------------------------- #
# AsciiDoc emission
# --------------------------------------------------------------------------- #


def _col_list(cols: list[str]) -> str:
    return ", ".join(f"`{c}`" for c in cols)


def _fmt_fk(fk: ForeignKey) -> str:
    left = f"`{fk.local[0]}`" if len(fk.local) == 1 else f"({_col_list(fk.local)})"
    right = f"`{fk.ref_table}`({_col_list(fk.ref_cols)})"
    suffix = " (DEFERRABLE)" if fk.deferrable else ""
    return f"{left} -> {right}{suffix}"


def _fmt_default(d: str) -> str:
    d = d.strip()
    if d.lower() == "current_timestamp":
        return "CURRENT_TIMESTAMP"
    return f"`{d}`"


def _key_cell(col: Column) -> str:
    parts: list[str] = []
    if col.pk:
        parts.append("PK")
    if col.in_unique:
        parts.append("UK")
    if col.in_fk:
        parts.append("FK")
    if col.default is not None:
        parts.append(f"DEFAULT {_fmt_default(col.default)}")
    return ", ".join(parts) if parts else ""


def _emit_table(tbl: Table, history_names: set[str]) -> list[str]:
    out: list[str] = []
    out.append(f"=== `{tbl.qualified}`")
    blurb = PURPOSE.get(tbl.name)
    if blurb:
        out.append("")
        out.append(blurb)
        out.append("")
    else:
        out.append("")
    out.append("")
    out.append('[cols="2,2,1,3",role=sortable]')
    out.append("|===")
    out.append("| Column | Type | Null | Default / Key")
    for col in tbl.columns:
        null = "N" if col.not_null else "Y"
        out.append(f"| `{col.name}` | `{col.type}` | {null} | {_key_cell(col)}")
    out.append("|===")
    out.append("")
    if tbl.fks:
        out.append("*Foreign keys:*")
        for fk in tbl.fks:
            out.append(f"** {_fmt_fk(fk)}")
        out.append("")
    composite_unique = [u for u in tbl.uniques if len(u[1]) > 1]
    if composite_unique:
        out.append("*Composite unique indexes:*")
        for idx_name, cols in composite_unique:
            out.append(f"** ({_col_list(cols)}) (`{idx_name}`)")
        out.append("")
    if tbl.checks:
        out.append("*CHECK constraints:*")
        for cname, expr in tbl.checks:
            out.append(f"** `{cname}`: `{expr}`")
        out.append("")
    if tbl.pk and len(tbl.pk) > 1:
        out.append(f"*Composite primary key:* ({_col_list(tbl.pk)})")
        out.append("")
    hist = f"{tbl.name}_history"
    if hist in history_names:
        out.append(
            f"*History shadow:* `{hist}` (`revision_id`, `revision_type`, "
            "`modified_at` + the parent columns mirroring nullability)."
        )
    else:
        out.append("*History shadow:* none.")
    out.append("")
    return out


def _emit_lookup_summary(label: str, rows: list[tuple[str, Table]]) -> list[str]:
    out: list[str] = [f"== {label}", ""]
    purpose = STATIC_CONSTRAINT_PURPOSE if "Static" in label else TYPE_LIMITER_PURPOSE
    out.append(purpose)
    out.append(
        "See xref:../sme/reference-static-constraint-tables.adoc[the SME "
        "static-constraint reference] for the seeded values."
    )
    out.append("")
    out.append('[cols="2,1,2"]')
    out.append("|===")
    out.append("| Table | Class | Columns")
    for name, tbl in rows:
        out.append(f"| `{name}` | {label} | {len(tbl.columns)}")
    out.append("|===")
    out.append("")
    return out


SECTIONS: list[tuple[str, list[str]]] = [
    ("Identity", ["person", "users"]),
    ("Application core", ["application", "demonstration", "amendment", "extension", "application_date", "application_note", "application_phase"]),
    ("Tag system", ["tag_name", "tag", "demonstration_type_tag_assignment", "application_tag_assignment", "application_tag_suggestion", "application_tag_suggestion_extract"]),
    ("Deliverables", ["deliverable", "deliverable_action", "deliverable_action_configuration", "deliverable_extension", "deliverable_active_extension", "deliverable_demonstration_type", "deliverable_type_document_type"]),
    ("Documents", ["document", "document_pending_upload", "document_infected"]),
    ("Comments", ["private_comment", "public_comment"]),
    ("Budget neutrality", ["budget_neutrality_workbook"]),
    ("UiPath", ["uipath_result", "uipath_value"]),
    ("RBAC", ["role_permission", "role_person_type", "system_role_assignment", "demonstration_role_assignment", "primary_demonstration_role_assignment", "person_state"]),
    ("Phase associative", ["phase_phase_status", "phase_date_type", "phase_note_type", "phase_document_type"]),
    ("Reference system", ["reference", "reference_agreement", "reference_agreement_acceptance", "reference_configuration", "reference_demonstration_type", "reference_tag_assignment"]),
    ("On-demand reports", ["on_demand_report"]),
    ("Sessions", ["user_session"]),
]


def _emit(tables: dict[str, Table], classes: dict[str, str]) -> str:
    history_names = {n for n, t in tables.items() if t.has_history}
    data_names: set[str] = set()
    for section, members in SECTIONS:
        data_names.update(members)

    # Any data/associative/migration-private table not in a SECTIONS list gets
    # an "Other tables" section so nothing is silently dropped.
    other: list[str] = []
    for name, tbl in tables.items():
        if tbl.has_history:
            continue
        cls = classes.get(name, "")
        if cls in ("Static constraint", "Type limiter", "Migration-private", "history"):
            continue
        if name in data_names:
            continue
        other.append(name)

    lines: list[str] = [
        "// Generated from the pinned Prisma DDL by docs/tools/data_dictionary_to_adoc.py -- do not edit.",
        "// Run `make data-dictionary` (in docs/) to regenerate.",
        "",
    ]

    for section, members in SECTIONS:
        present = [n for n in members if n in tables]
        if not present:
            continue
        lines.append(f"== {section}")
        lines.append("")
        for name in present:
            lines.extend(_emit_table(tables[name], history_names))
        lines.append("")

    if other:
        other.sort()
        lines.append("== Other tables")
        lines.append("")
        for name in other:
            lines.extend(_emit_table(tables[name], history_names))
        lines.append("")

    # Migration-private section.
    mig = [n for n, t in tables.items() if t.schema == MIGRATION_SCHEMA and not t.has_history]
    if mig:
        lines.append("== Migration-private tables")
        lines.append("")
        lines.append(
            "Owned by this repo (not the Prisma artifact). Live in the "
            "`migration` schema and survive `demos_app` rebuilds."
        )
        lines.append("")
        for name in sorted(mig):
            lines.extend(_emit_table(tables[name], history_names))
        lines.append("")

    # Lookup summaries.
    static = sorted(
        (n, t) for n, t in tables.items() if classes.get(n) == "Static constraint" and not t.has_history
    )
    if static:
        lines.extend(_emit_lookup_summary("Static-constraint tables", static))
    limiters = sorted(
        (n, t) for n, t in tables.items() if classes.get(n) == "Type limiter" and not t.has_history
    )
    if limiters:
        lines.extend(_emit_lookup_summary("Type-limiter tables", limiters))

    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #


def main() -> int:
    artifact = _resolve_artifact()
    text = artifact.read_text(encoding="utf-8")

    # Replay the concatenated migration history in file order so ADD COLUMN,
    # ALTER COLUMN, ADD/DROP CONSTRAINT and CREATE UNIQUE INDEX fold onto the
    # initial CREATE TABLE blocks, yielding the true final schema.
    tables: dict[str, Table] = replay_ddl(text)

    # Supplements: migration-private tables authored in this repo.
    for sup in sorted(SUPPLEMENTS_DIR.glob("*.sql")):
        replay_ddl(sup.read_text(encoding="utf-8"), tables)

    classes = _classify(tables)
    out = _emit(tables, classes)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(out, encoding="utf-8")
    rel = OUTPUT.relative_to(REPO_ROOT)
    print(f"data-dictionary: wrote {rel} ({len(tables)} tables parsed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
