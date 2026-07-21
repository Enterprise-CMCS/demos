"""Shared source-of-truth model for the DEMOS target schema.

This module owns the parsing of the authoritative schema artifacts the
pipeline already produces, so that both the diagram/partial *generators*
(``schema_diagrams_to_adoc.py``) and the documentation *verifiers*
(``verify_*.py``) read the same model instead of each re-implementing a
parser that can drift.

Inputs (all already owned by the pipeline):

* Target ``demos_app`` schema -- the pinned Prisma DDL
  (``state/prisma_ddl/<sha>.sql``) plus captured FKs
  (``state/prisma_fks.json``).
* Static-constraint / type-limiter seed *values* -- the ``INSERT INTO
  demos_app.<table> VALUES (...)`` blocks inside the same DDL.
* Source MySQL schema -- the committed schema snapshot CSVs under
  ``reports/schema_snapshot/``.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml

TOOLS_DIR = Path(__file__).resolve().parent
DOCS_DIR = TOOLS_DIR.parent
REPO_ROOT = DOCS_DIR.parent

# Reuse the canonical path constants so this module stays in lockstep with the
# rest of the package layout.
sys.path.insert(0, str(REPO_ROOT))
from migration.lib import (  # noqa: E402
    PRISMA_CACHE_DIR,
    PRISMA_FKS_FILE,
    PRISMA_PIN_FILE,
    SCHEMA_SNAPSHOT_DIR,
)

TABLE_CLASSES_FILE = TOOLS_DIR / "table_classes.yaml"
COLUMNS_FILE = SCHEMA_SNAPSHOT_DIR / "columns.csv"
TABLE_STATS_FILE = SCHEMA_SNAPSHOT_DIR / "table_stats.csv"

# Class ordering / titles / url slugs are shared between the diagram renderer
# and the list-partial generator. The mermaid-only ``classDef`` styling stays
# with the diagram renderer.
CLASS_ORDER: list[str] = ["staticConstraint", "typeLimiter", "dataTable", "associativeTable"]
CLASS_TITLE: dict[str, str] = {
    "staticConstraint": "Static constraint tables",
    "typeLimiter": "Type limiter tables",
    "dataTable": "Data tables",
    "associativeTable": "Associative tables",
}
CLASS_SLUG: dict[str, str] = {
    "staticConstraint": "static-constraints",
    "typeLimiter": "type-limiters",
    "dataTable": "data-tables",
    "associativeTable": "associative-tables",
}

# Default location of the hand-authored DEMOS data model: a single mermaid
# ``erDiagram`` file that lives in the parent ../demos repo checkout. The doc
# tools (schema diagrams + the two data-dictionary generators) read it for
# table classification and accept a ``DEMOS_DATA_MODEL_MMD`` env override at
# their entry points.
DEMOS_DATA_MODEL_MMD = REPO_ROOT.parent / "data" / "docs" / "DEMOS_Data_Model.mmd"

# Mermaid ``:::class`` name -> the class-directory label the data-dictionary
# generators group tables on. Blocks with any other class (e.g. the diagram
# ``legend``) are not tables and are ignored by the parsers.
MERMAID_CLASS_TO_DIR: dict[str, str] = {
    "staticConstraint": "static_constraints",
    "typeLimiter": "type_limiters",
    "dataTable": "data_tables",
    "associativeTable": "associative_tables",
}


# --------------------------------------------------------------------------- #
# Data model
# --------------------------------------------------------------------------- #


@dataclass
class Column:
    name: str
    type: str
    nullable: bool
    default: str | None = None


@dataclass
class Table:
    name: str
    columns: list[Column] = field(default_factory=list)
    pk: list[str] = field(default_factory=list)
    uniques: list[list[str]] = field(default_factory=list)

    def column(self, name: str) -> Column | None:
        for c in self.columns:
            if c.name == name:
                return c
        return None


@dataclass
class FK:
    child: str
    child_cols: list[str]
    parent: str
    parent_cols: list[str]


@dataclass
class TargetModel:
    """The parsed target ``demos_app`` schema and its seeded values."""

    tables: dict[str, Table]
    classes: dict[str, str]
    fks: list[FK]
    seeds: dict[str, list[str]]
    ddl_label: str


# --------------------------------------------------------------------------- #
# Prisma DDL parsing (target demos_app schema)
# --------------------------------------------------------------------------- #

_TYPE_ALIASES = {"double precision": "double"}
DEMO_SCHEMA = "demos_app"


def _split_quoted_cols(s: str) -> list[str]:
    return [c.strip().strip('"') for c in s.split(",") if c.strip()]


def is_history(name: str) -> bool:
    return name.endswith("_history")


# --------------------------------------------------------------------------- #
# Rich replay model
# --------------------------------------------------------------------------- #
#
# The pinned artifact is the *concatenated* Prisma migration history, not a
# resolved dump. A CREATE-TABLE-only parse silently drops every later
# ``ALTER TABLE ... ADD COLUMN`` / ``SET NOT NULL`` / ``SET|DROP DEFAULT`` and
# unquoted ``CREATE UNIQUE INDEX``. We replay the statements in file order onto
# this rich model -- shared with ``data_dictionary_to_adoc`` and
# ``source_target_columns_to_adoc`` -- then project it into the simple
# Column/Table the diagram + verifier consumers expect.


@dataclass
class DDLColumn:
    name: str
    type: str
    not_null: bool
    default: str | None = None
    pk: bool = False
    in_fk: bool = False
    in_unique: bool = False  # single-column unique index


@dataclass
class DDLForeignKey:
    name: str
    local: list[str]
    ref_table: str
    ref_cols: list[str]
    deferrable: bool = False


@dataclass
class DDLTable:
    name: str
    schema: str
    columns: list[DDLColumn] = field(default_factory=list)
    pk: list[str] = field(default_factory=list)
    fks: list[DDLForeignKey] = field(default_factory=list)
    uniques: list[tuple[str, list[str]]] = field(default_factory=list)  # (index_name, cols)
    checks: list[tuple[str, str]] = field(default_factory=list)  # (name, expr)

    @property
    def qualified(self) -> str:
        return f"{self.schema}.{self.name}"

    @property
    def has_history(self) -> bool:
        return self.name.endswith("_history")

    @property
    def parent_name(self) -> str:
        return self.name[: -len("_history")] if self.has_history else self.name


def _strip_quotes(tok: str) -> str:
    t = tok.strip()
    if len(t) >= 2 and t[0] == '"' and t[-1] == '"':
        return t[1:-1]
    return t


def _split_col_list(raw: str) -> list[str]:
    return [_strip_quotes(c.strip()) for c in raw.split(",") if c.strip()]


def _parse_type_and_mods(rest: str) -> tuple[str, bool, str | None, bool, bool]:
    """Return (type, not_null, default, is_pk_inline, is_unique_inline)."""
    rest = rest.strip()
    if rest.endswith(","):
        rest = rest[:-1].strip()
    tokens = rest.split()
    i = 0
    type_str: str
    if tokens and tokens[0].startswith('"'):
        type_str = _strip_quotes(tokens[0])
        i = 1
    elif tokens and tokens[0].lower() == "double" and len(tokens) > 1 and tokens[1].lower() == "precision":
        type_str = "double precision"
        i = 2
    elif tokens and tokens[0].lower() == "character" and len(tokens) > 1 and tokens[1].lower() == "varying":
        type_str = "character varying"
        i = 2
    else:
        type_str = tokens[0] if tokens else ""
        i = 1
    not_null = False
    default: str | None = None
    is_pk = False
    is_unique = False
    while i < len(tokens):
        tok = tokens[i]
        if tok.upper() == "NOT" and i + 1 < len(tokens) and tokens[i + 1].upper() == "NULL":
            not_null = True
            i += 2
        elif tok.upper() == "DEFAULT":
            default = " ".join(tokens[i + 1 :])
            i = len(tokens)
        elif tok.upper() == "PRIMARY" and i + 1 < len(tokens) and tokens[i + 1].upper() == "KEY":
            is_pk = True
            i += 2
        elif tok.upper() == "UNIQUE":
            is_unique = True
            i += 1
        else:
            i += 1
    return type_str, not_null, default, is_pk, is_unique


# Match a table reference in either dialect: "name"  or  schema.name
_TBL = r'(?:\"(\w+)\"|(\w+)\.(\w+))'


def _tbl_name(m: re.Match, gq: int = 1, gs: int = 2, gt: int = 3) -> tuple[str, str]:
    """Extract (name, schema) from a match, given the three TBL group numbers."""
    if m.group(gq):
        return m.group(gq), DEMO_SCHEMA
    return m.group(gt), m.group(gs)


_CREATE_RE = re.compile(r"^CREATE TABLE(?: IF NOT EXISTS)?\s+" + _TBL + r"\s*\(")
_DROP_RE = re.compile(r"^DROP TABLE(?: IF EXISTS)?\s+" + _TBL, re.IGNORECASE)
_PK_INLINE_RE = re.compile(r'^CONSTRAINT\s+"?(\w+)"?\s+PRIMARY KEY\s*\(([^)]*)\)', re.IGNORECASE)


def _apply_create(stmt: str, tables: dict[str, DDLTable]) -> None:
    """Parse a single CREATE TABLE statement (paren-balanced body)."""
    lines = stmt.splitlines()
    start = -1
    line = ""
    m = None
    for i, ln in enumerate(lines):
        m = _CREATE_RE.match(ln.strip())
        if m:
            start = i
            line = ln
            break
    if not m:
        return
    name, schema = _tbl_name(m)
    depth = line.count("(") - line.count(")")
    body_lines: list[str] = []
    d = depth
    for bl in lines[start + 1 :]:
        body_lines.append(bl)
        d += bl.count("(") - bl.count(")")
        if d <= 0:
            break
    tbl = DDLTable(name=name, schema=schema)
    for bl in body_lines:
        s = bl.strip()
        if not s:
            continue
        mpk = _PK_INLINE_RE.match(s)
        if mpk:
            tbl.pk = _split_col_list(mpk.group(2))
            continue
        if s.upper().startswith("CONSTRAINT"):
            continue
        cm = re.match(r'"([^"]+)"\s+(.*)', s) if s.startswith('"') else re.match(r"(\w+)\s+(.*)", s)
        if not cm:
            continue
        col_name, rest = cm.group(1), cm.group(2)
        ctype, not_null, default, is_pk, is_unique = _parse_type_and_mods(rest)
        col = DDLColumn(name=col_name, type=ctype, not_null=not_null, default=default)
        if is_pk:
            tbl.pk = [col_name]
            col.pk = True
        if is_unique:
            col.in_unique = True
        tbl.columns.append(col)
    tables[name] = tbl


def _apply_drop(s: str, tables: dict[str, DDLTable]) -> None:
    """Honor a ``DROP TABLE`` so a table created early in the migration history
    and dropped by a later migration does not survive as a phantom.

    The pinned artifact is the concatenated Prisma migration history, so the
    final schema is the replay residue. Without this, a dropped table (e.g.
    ``deliverable_demonstration_status_limit`` -> ``approved_application_status_limit``)
    would linger in the model and break the derivability partition. Dangling
    FKs that referenced the dropped table are pruned too.
    """
    m = _DROP_RE.match(s)
    if not m:
        return
    name, _ = _tbl_name(m)
    tables.pop(name, None)
    for tbl in tables.values():
        tbl.fks = [f for f in tbl.fks if f.ref_table != name]


def _apply_unique_index(s: str, tables: dict[str, DDLTable]) -> None:
    m = re.match(r'CREATE UNIQUE INDEX\s+"?(\w+)"?\s+ON\s+' + _TBL + r"\s*\(([^)]*)\)", s)
    if not m:
        return
    idx_name = m.group(1)
    tbl_name, _ = _tbl_name(m, gq=2, gs=3, gt=4)
    cols = _split_col_list(m.group(5))
    tbl = tables.get(tbl_name)
    if not tbl:
        return
    tbl.uniques = [u for u in tbl.uniques if u[0] != idx_name]
    tbl.uniques.append((idx_name, cols))
    if len(cols) == 1:
        for col in tbl.columns:
            if col.name == cols[0]:
                col.in_unique = True


def _split_top_level_commas(s: str) -> list[str]:
    """Split on commas that are not nested inside parentheses."""
    parts: list[str] = []
    depth = 0
    cur: list[str] = []
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur))
            cur = []
        else:
            cur.append(ch)
    if cur:
        parts.append("".join(cur))
    return parts


# ALTER clauses that never touch the structural model we track (column set,
# nullability, default, pk, uniques, fks, checks). Explicitly ignored so the
# fail-closed guard below can flag anything genuinely new.
_IGNORABLE_ALTER_RE = re.compile(
    r"^(ENABLE|DISABLE|ALTER)\s+TRIGGER\b|^OWNER\s+TO\b|^CLUSTER\b|^SET\b"
    r"|^VALIDATE\s+CONSTRAINT\b|^RENAME\s+CONSTRAINT\b|^RENAME\s+TO\b|^REPLICA\b",
    re.IGNORECASE,
)


def _apply_alter_clause(clause: str, tbl: DDLTable) -> None:
    """Apply one comma-separated clause of an ALTER TABLE to the replay state."""
    clause = clause.strip()
    if not clause:
        return
    # DROP CONSTRAINT -- remove a FK / CHECK / PK by name.
    md = re.match(r"DROP CONSTRAINT\s+(?:IF EXISTS\s+)?\"?(\w+)\"?", clause, re.IGNORECASE)
    if md:
        cname = md.group(1)
        tbl.fks = [f for f in tbl.fks if f.name != cname]
        tbl.checks = [c for c in tbl.checks if c[0] != cname]
        tbl.uniques = [u for u in tbl.uniques if u[0] != cname]
        if cname.endswith("_pkey"):
            tbl.pk = []
            for col in tbl.columns:
                col.pk = False
        return
    # ADD CONSTRAINT ... FOREIGN KEY  (both dialects; may be DEFERRABLE).
    mfk = re.match(
        r"ADD CONSTRAINT\s+\"?(\w+)\"?\s+FOREIGN KEY\s*\(([^)]*)\)\s+"
        r"REFERENCES\s+(?:\"(\w+)\"|(\w+)\.(\w+))\s*\(([^)]*)\)(.*)",
        clause,
        re.IGNORECASE,
    )
    if mfk:
        cname = mfk.group(1)
        local = _split_col_list(mfk.group(2))
        ref_tbl = mfk.group(3) or mfk.group(5)
        ref_cols = _split_col_list(mfk.group(6))
        deferrable = "DEFERRABLE" in mfk.group(7).upper()
        tbl.fks = [f for f in tbl.fks if f.name != cname]
        tbl.fks.append(
            DDLForeignKey(name=cname, local=local, ref_table=ref_tbl, ref_cols=ref_cols, deferrable=deferrable)
        )
        for col in tbl.columns:
            if col.name in local:
                col.in_fk = True
        return
    # ADD CONSTRAINT ... PRIMARY KEY
    mpk = re.match(r"ADD CONSTRAINT\s+\"?(\w+)\"?\s+PRIMARY KEY\s*\(([^)]*)\)", clause, re.IGNORECASE)
    if mpk:
        cols = _split_col_list(mpk.group(2))
        tbl.pk = cols
        for col in tbl.columns:
            col.pk = col.name in cols
        return
    # ADD CONSTRAINT ... CHECK  (both dialects / line layouts -- clause is one line).
    mck = re.match(r"ADD CONSTRAINT\s+\"?(\w+)\"?\s+CHECK\s*\((.*)\)\s*$", clause, re.IGNORECASE)
    if mck:
        cname = mck.group(1)
        expr = re.sub(r"\s+", " ", mck.group(2).strip())
        tbl.checks = [c for c in tbl.checks if c[0] != cname]
        tbl.checks.append((cname, expr))
        return
    # ADD CONSTRAINT ... UNIQUE  (inline; rare in this DDL).
    muq = re.match(r"ADD CONSTRAINT\s+\"?(\w+)\"?\s+UNIQUE\s*\(([^)]*)\)", clause, re.IGNORECASE)
    if muq:
        cname = muq.group(1)
        cols = _split_col_list(muq.group(2))
        tbl.uniques = [u for u in tbl.uniques if u[0] != cname]
        tbl.uniques.append((cname, cols))
        if len(cols) == 1:
            for col in tbl.columns:
                if col.name == cols[0]:
                    col.in_unique = True
        return
    # ADD COLUMN
    if clause.upper().startswith("ADD COLUMN"):
        rest = re.sub(r"^ADD COLUMN\s+", "", clause, flags=re.IGNORECASE).strip()
        cm = re.match(r'\s*\"?(\w+)\"?\s+(.*)', rest)
        if cm:
            col_name = cm.group(1)
            if not any(c.name == col_name for c in tbl.columns):
                ctype, not_null, default, _is_pk, _is_uq = _parse_type_and_mods(cm.group(2))
                tbl.columns.append(DDLColumn(name=col_name, type=ctype, not_null=not_null, default=default))
        return
    # DROP COLUMN
    if clause.upper().startswith("DROP COLUMN"):
        rest = re.sub(r"^DROP COLUMN\s+(?:IF EXISTS\s+)?", "", clause, flags=re.IGNORECASE).strip()
        cm = re.match(r'\s*\"?(\w+)\"?', rest)
        if cm:
            col_name = cm.group(1)
            tbl.columns = [c for c in tbl.columns if c.name != col_name]
            tbl.pk = [c for c in tbl.pk if c != col_name]
        return
    # RENAME COLUMN x TO y
    mrn = re.match(r"RENAME COLUMN\s+\"?(\w+)\"?\s+TO\s+\"?(\w+)\"?", clause, re.IGNORECASE)
    if mrn:
        old, new = mrn.group(1), mrn.group(2)
        for col in tbl.columns:
            if col.name == old:
                col.name = new
        tbl.pk = [new if c == old else c for c in tbl.pk]
        return
    # ALTER COLUMN ... SET NOT NULL / DROP NOT NULL / SET DEFAULT / DROP DEFAULT / TYPE
    if clause.upper().startswith("ALTER COLUMN"):
        rest = re.sub(r"^ALTER COLUMN\s+", "", clause, flags=re.IGNORECASE).strip()
        cm = re.match(r'\s*\"?(\w+)\"?\s+(.*)', rest)
        if cm:
            col_name = cm.group(1)
            action = cm.group(2).strip()
            au = re.sub(r"\s+", " ", action).upper()
            for col in tbl.columns:
                if col.name == col_name:
                    if au.startswith("SET NOT NULL"):
                        col.not_null = True
                    elif au.startswith("DROP NOT NULL"):
                        col.not_null = False
                    elif au.startswith("DROP DEFAULT"):
                        col.default = None
                    elif au.startswith("SET DEFAULT"):
                        col.default = re.sub(r"^SET DEFAULT\s+", "", action, flags=re.IGNORECASE).strip()
                    elif au.startswith("SET DATA TYPE") or au.startswith("TYPE"):
                        col.type = re.sub(
                            r"^(SET DATA TYPE|TYPE)\s+", "", action, flags=re.IGNORECASE
                        ).split(" USING ")[0].strip()
        return
    # Known non-structural clauses (trigger toggles, ownership, etc.).
    if _IGNORABLE_ALTER_RE.match(clause):
        return
    # Fail closed: a new ALTER form we do not model could silently corrupt the
    # column / nullability / default / unique state (the exact Finding B bug).
    raise ValueError(
        f"schema_model: unhandled ALTER clause on {tbl.qualified!r}: {clause!r}. "
        "Extend _apply_alter_clause (or _IGNORABLE_ALTER_RE) to model it."
    )


def _apply_alter(s: str, tables: dict[str, DDLTable]) -> None:
    """Apply one ALTER TABLE statement (whitespace-normalised) to the replay state.

    A single statement may carry several comma-joined clauses (e.g.
    ``DROP CONSTRAINT ..., ADD CONSTRAINT ... PRIMARY KEY (...)``), so the body
    is split on top-level commas and each clause replayed in order.
    """
    m = re.match(r"ALTER TABLE\s+(?:ONLY\s+)?" + _TBL + r"\s+(.*)", s)
    if not m:
        return
    tbl_name, _ = _tbl_name(m)
    tbl = tables.get(tbl_name)
    if not tbl:
        return
    for clause in _split_top_level_commas(m.group(4)):
        _apply_alter_clause(clause, tbl)


def _split_statements(text: str) -> list[str]:
    """Split a migration artifact into ordered statements.

    PL/pgSQL ``DO $$ ... $$;`` blocks contain internal semicolons, so they are
    stripped first; line comments (``--``) are removed; the remainder is split
    on the statement terminator ``;``.
    """
    text = re.sub(r"DO\s*\$\$.*?\$\$\s*;", " ", text, flags=re.DOTALL)
    lines = [re.sub(r"--.*$", "", ln) for ln in text.splitlines()]
    cleaned = "\n".join(lines)
    return [s.strip() for s in cleaned.split(";") if s.strip()]


def _apply_statement(stmt: str, tables: dict[str, DDLTable]) -> None:
    s = re.sub(r"\s+", " ", stmt).strip()
    if s.upper().startswith("CREATE TABLE"):
        _apply_create(stmt, tables)
    elif s.upper().startswith("DROP TABLE"):
        _apply_drop(s, tables)
    elif s.upper().startswith("CREATE UNIQUE INDEX"):
        _apply_unique_index(s, tables)
    elif s.upper().startswith("ALTER TABLE"):
        _apply_alter(s, tables)
    # CREATE TYPE / CREATE INDEX / CREATE SEQUENCE / SET / GRANT etc: ignore.


def replay_ddl(text: str, tables: dict[str, DDLTable] | None = None) -> dict[str, DDLTable]:
    """Replay a concatenated migration artifact into the rich table model.

    Pass an existing ``tables`` dict to fold supplemental DDL (e.g. this repo's
    ``sql/01_ddl_supplements/``) onto the same state.
    """
    if tables is None:
        tables = {}
    for stmt in _split_statements(text):
        _apply_statement(stmt, tables)
    return tables


def _project_type(t: str) -> str:
    low = t.lower()
    return _TYPE_ALIASES.get(low, low)


def parse_prisma_ddl(text: str, *, include_history: bool = False) -> dict[str, Table]:
    """Replay the migration history and project it into simple Table records.

    The replay folds ``ADD COLUMN`` / ``ALTER COLUMN`` / ``CREATE UNIQUE INDEX``
    onto the initial ``CREATE TABLE`` blocks, so ALTER-added columns
    (``demonstration.medicaid_id``, ``state.region``, ...) are visible here.

    ``*_history`` tables are skipped by default: in the ER diagrams they
    mirror their parent's columns and only add clutter. Verifiers pass
    ``include_history=True`` so a doc reference to a history table is not
    falsely flagged as unknown.
    """
    rich = replay_ddl(text)
    tables: dict[str, Table] = {}
    for name, rtbl in rich.items():
        if not include_history and is_history(name):
            continue
        tbl = Table(name=name)
        tbl.pk = list(rtbl.pk)
        tbl.columns = [
            Column(name=c.name, type=_project_type(c.type), nullable=not c.not_null, default=c.default)
            for c in rtbl.columns
        ]
        tbl.uniques = [list(cols) for (_idx, cols) in rtbl.uniques]
        tables[name] = tbl
    return tables


_FK_DEF_RE = re.compile(
    r'FOREIGN KEY\s*\((?P<child>[^)]+)\)\s*REFERENCES\s*"?(?P<parent>[A-Za-z_]\w*)"?\s*\((?P<parent_cols>[^)]+)\)',
    re.IGNORECASE,
)


def parse_prisma_fks(raw: list[dict], *, include_history: bool = False) -> list[FK]:
    """Turn the captured ``prisma_fks.json`` rows into FK records.

    FKs touching a ``*_history`` table on either end are dropped by default to
    match the history exclusion in :func:`parse_prisma_ddl`.
    """
    fks: list[FK] = []
    for row in raw:
        child = str(row.get("table", ""))
        definition = str(row.get("definition", ""))
        m = _FK_DEF_RE.search(definition)
        if not child or not m:
            continue
        parent = m.group("parent")
        if not include_history and (is_history(child) or is_history(parent)):
            continue
        fks.append(
            FK(
                child=child,
                child_cols=_split_quoted_cols(m.group("child")),
                parent=parent,
                parent_cols=_split_quoted_cols(m.group("parent_cols")),
            )
        )
    fks.sort(key=lambda f: (f.child, f.parent, tuple(f.child_cols)))
    return fks


# --------------------------------------------------------------------------- #
# Seed value parsing (static-constraint / type-limiter canonical ids)
# --------------------------------------------------------------------------- #

_INSERT_RE = re.compile(
    r"INSERT\s+INTO\s+(?:demos_app\.)?\"?(?P<table>[A-Za-z_]\w*)\"?\s+VALUES\s+(?P<body>.*?);",
    re.DOTALL | re.IGNORECASE,
)
_FIRST_VALUE_RE = re.compile(r"\(\s*'(?P<id>(?:[^']|'')*)'")


def parse_seed_values(text: str) -> dict[str, list[str]]:
    """Extract the canonical ``id`` of every seeded row, keyed by table.

    The Prisma artifact seeds static-constraint and type-limiter tables with
    ``INSERT INTO demos_app.<table> VALUES ('id', ...), ...;`` blocks (the id
    is always the first tuple element). Comment lines between tuples are
    ignored. Returns insertion-ordered ids per table.
    """
    out: dict[str, list[str]] = {}
    for m in _INSERT_RE.finditer(text):
        table = m.group("table")
        ids: list[str] = []
        for line in m.group("body").splitlines():
            line = line.strip()
            if not line or line.startswith("--"):
                continue
            vm = _FIRST_VALUE_RE.match(line)
            if vm:
                ids.append(vm.group("id").replace("''", "'"))
        if ids:
            out.setdefault(table, []).extend(ids)
    return out


# --------------------------------------------------------------------------- #
# Classification (hybrid: structural heuristics + override file)
# --------------------------------------------------------------------------- #


def load_class_overrides() -> dict[str, str]:
    if not TABLE_CLASSES_FILE.exists():
        return {}
    data = yaml.safe_load(TABLE_CLASSES_FILE.read_text()) or {}
    overrides = data.get("overrides") or {}
    return {str(k): str(v) for k, v in overrides.items()}


def classify(table: Table, overrides: dict[str, str]) -> str:
    """Assign a table to a diagram cluster.

    Override file wins; otherwise: ``*_limit`` -> typeLimiter; composite PK ->
    associativeTable; single ``text`` PK -> staticConstraint; else dataTable.
    """
    if table.name in overrides:
        return overrides[table.name]
    if table.name.endswith("_limit"):
        return "typeLimiter"
    if len(table.pk) > 1:
        return "associativeTable"
    if len(table.pk) == 1:
        pkcol = table.column(table.pk[0])
        if pkcol is not None and pkcol.type == "text":
            return "staticConstraint"
    return "dataTable"


# --------------------------------------------------------------------------- #
# Loading the pinned DDL
# --------------------------------------------------------------------------- #


def resolve_ddl_path() -> Path:
    pin = None
    if PRISMA_PIN_FILE.exists():
        raw = PRISMA_PIN_FILE.read_text().strip().split()
        if raw:
            pin = raw[0]
    if pin:
        candidate = PRISMA_CACHE_DIR / f"{pin}.sql"
        if candidate.exists():
            return candidate
    sqls = sorted(PRISMA_CACHE_DIR.glob("*.sql"))
    if not sqls:
        raise SystemExit(
            f"no Prisma DDL cache found under {PRISMA_CACHE_DIR}; "
            "run `make fetch_prisma` first"
        )
    return sqls[-1]


def build_target_model() -> tuple[dict[str, Table], dict[str, str], list[FK], str]:
    """Diagram-facing model (history excluded), kept tuple-shaped for callers."""
    ddl_path = resolve_ddl_path()
    tables = parse_prisma_ddl(ddl_path.read_text())
    raw_fks = json.loads(PRISMA_FKS_FILE.read_text()) if PRISMA_FKS_FILE.exists() else []
    fks = parse_prisma_fks(raw_fks)
    overrides = load_class_overrides()
    classes = {name: classify(tbl, overrides) for name, tbl in tables.items()}
    return tables, classes, fks, ddl_path.stem


def load_target_model(*, include_history: bool = True) -> TargetModel:
    """Verifier-facing model: includes history tables and seed values."""
    ddl_path = resolve_ddl_path()
    text = ddl_path.read_text()
    tables = parse_prisma_ddl(text, include_history=include_history)
    raw_fks = json.loads(PRISMA_FKS_FILE.read_text()) if PRISMA_FKS_FILE.exists() else []
    fks = parse_prisma_fks(raw_fks, include_history=include_history)
    overrides = load_class_overrides()
    classes = {name: classify(tbl, overrides) for name, tbl in tables.items()}
    seeds = parse_seed_values(text)
    return TargetModel(tables=tables, classes=classes, fks=fks, seeds=seeds, ddl_label=ddl_path.stem)


# --------------------------------------------------------------------------- #
# Source MySQL schema (committed snapshot CSVs)
# --------------------------------------------------------------------------- #


def _read_csv_lower(path: Path) -> list[dict[str, str]]:
    """Read a CSV into dict rows with lower-cased keys.

    The schema snapshot CSVs carry MySQL's upper-cased ``information_schema``
    column names, so callers normalize to lower case here.
    """
    if not path.exists():
        return []
    with path.open(newline="") as f:
        reader = csv.DictReader(f)
        return [{(k or "").lower(): v for k, v in row.items()} for row in reader]


def load_source_columns() -> dict[str, set[str]]:
    """Return ``{source_table: {column, ...}}`` from the schema snapshot."""
    out: dict[str, set[str]] = {}
    for row in _read_csv_lower(COLUMNS_FILE):
        table = row.get("table_name")
        col = row.get("column_name")
        if table and col:
            out.setdefault(table, set()).add(col)
    return out


def load_source_tables() -> list[str]:
    return [row["table_name"] for row in _read_csv_lower(TABLE_STATS_FILE) if row.get("table_name")]
