"""Generate the column-level MySQL PMDA -> DEMOS PostgreSQL comparison fragments.

Run from the repo root:

    uv run python docs/tools/source_target_columns_to_adoc.py

Both schemas are read from their authoritative source of truth, not from a
hand-drawn diagram:

* MySQL PMDA  -> the live ``information_schema`` snapshot at
  ``reports/schema_snapshot/columns.csv`` (captured by ``migrate
  schema-snapshot`` from ``cma_pro_11_1_000``).
* DEMOS       -> the pinned Prisma DDL (``reports/prisma_ddl.sha256`` +
  ``state/prisma_ddl/<sha>.sql``), replayed through the same migration
  folding as the data dictionary so ``ADD COLUMN`` / ``ALTER COLUMN``
  migrations (e.g. ``demonstration.medicaid_id`` / ``chip_id``) are present.

This keeps the column map in lockstep with the rest of the doc tooling
(data dictionary, schema diagrams, derivability), which already read the
pinned DDL.

Inputs (paths overridable via flags; defaults match the repo layout):

* ``--mysql-snapshot`` path to the MySQL ``columns.csv`` snapshot. Default
                       ``reports/schema_snapshot/columns.csv``.
* ``--demos-mmd``    optional override: a DEMOS schema diagram (mermaid or
                     Graphviz). When unset, the pinned Prisma DDL is used.
* ``--mysql-mmd``    optional override: a MySQL schema diagram (Graphviz or
                     mermaid). When unset, the ``columns.csv`` snapshot is
                     used. (Mainly for tests / ad-hoc what-ifs.)
* ``--csv``          path to ``reports/source_target_columns.csv``
* ``--drop-list``    path to ``reports/narrative/drop_list.md``
* ``--out-dir``      directory to write the three adoc fragments
                     (default: ``reports/``)

Outputs (all written under ``--out-dir``):

* ``source_target_columns_table.adoc``    -- one long sortable table.
* ``source_target_columns_sections.adoc`` -- per-MySQL-table sections.
* ``source_target_columns_coverage.adoc`` -- coverage stats and lint summary.

Lints (hard failures, exit code 1):

1. Every ``(mysql_table, mysql_column)`` exists in the MySQL snapshot.
2. Every non-empty ``(demos_table, demos_column)`` exists in the DEMOS
   Prisma DDL.
3. Every MySQL table from the snapshot is covered (either by at least
   one CSV row or by an entry in the drop list).
4. ``transform`` is from the controlled vocabulary.
5. ``transform=crosswalk:<X>`` requires ``reports/crosswalks/<X>.csv``
   to exist.
6. ``transform=tag_pivot:<X>`` requires a row in
   ``reports/pgm_dtl_tag_mapping.csv`` whose ``tag_name`` is ``<X>``.

Type-compat warnings (do not fail the build): joined cells render as
``OK`` (same normalised type), ``WARN`` (types differ but the
``transform`` explains it), or ``MISMATCH`` (types differ and the
transform does not explain it).
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import OrderedDict
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SPECS_ROOT = REPO_ROOT.parent

DEFAULT_MYSQL_MMD = SPECS_ROOT / "mmd_sql_compare" / "mysql_pmda_data_model.dot"
DEFAULT_DEMOS_MMD = SPECS_ROOT / "mmd_sql_compare" / "demos_data_model.mmd"
DEFAULT_MYSQL_SNAPSHOT = REPO_ROOT / "reports" / "schema_snapshot" / "columns.csv"
DEFAULT_CSV = REPO_ROOT / "reports" / "source_target_columns.csv"
DEFAULT_DROP_LIST = REPO_ROOT / "reports" / "narrative" / "drop_list.md"
DEFAULT_PGM_DTL = REPO_ROOT / "reports" / "pgm_dtl_tag_mapping.csv"
DEFAULT_CROSSWALK_DIR = REPO_ROOT / "reports" / "crosswalks"
DEFAULT_OUT_DIR = REPO_ROOT / "reports" / "generated"

NON_COLUMN_PREFIXES = (
    "CONSTRAINT_CHECK",
    "CONSTRAINT_TRIGGER",
    "TRIGGER_BEFORE",
    "TRIGGER_AFTER",
    "TRIGGER_AFTER_INSERT_OR_UPDATE",
    "PARTIAL_UNIQUE_INDEX",
    "HAS_HISTORY",
)

VALID_TRANSFORMS_BARE = {
    "copy",
    "cast",
    "id_map",
    "derive",
    "constant",
    "drop",
    "pending_unify",
    "comment_route",
}

VALID_TRANSFORM_PREFIXES = {
    "crosswalk:",
    "tag_pivot:",
    "json_pack:",
    "json_extract:",
    "filter_typed:",
    "cast:",
}

TYPE_MAP = {
    "text": "text",
    "varchar": "text",
    "string": "text",
    "char": "text",
    "mediumtext": "text",
    "longtext": "text",
    "tinytext": "text",
    "uuid": "uuid",
    "integer": "integer",
    "int": "integer",
    "int4": "integer",
    "smallint": "integer",
    "tinyint": "integer",
    "mediumint": "integer",
    "year": "integer",
    "bigint": "bigint",
    "int8": "bigint",
    "boolean": "bool",
    "bool": "bool",
    "timestamptz": "timestamptz",
    "timestamp": "timestamp",
    "datetime": "timestamp",
    "jsonb": "jsonb",
    "json": "json",
    "double": "double",
    "float": "double",
    "float8": "double",
    "real": "double",
    "numeric": "numeric",
    "decimal": "numeric",
    "date": "date",
    "time": "time",
    "blob": "bytes",
    "longblob": "bytes",
    "mediumblob": "bytes",
    "tinyblob": "bytes",
    "bytea": "bytes",
    "binary": "bytes",
    "varbinary": "bytes",
}

_TYPE_PARENS_RE = re.compile(r"\(.*\)")
_TYPE_MOD_RE = re.compile(r"\b(unsigned|signed|zerofill)\b", re.IGNORECASE)


def norm_type(t: str) -> str:
    base = (t or "").strip().lower().rstrip(",;")
    base = _TYPE_PARENS_RE.sub("", base)
    base = _TYPE_MOD_RE.sub("", base)
    base = " ".join(base.split())
    return TYPE_MAP.get(base, base)


@dataclass
class SchemaTable:
    name: str
    cls: str
    columns: OrderedDict[str, str] = field(default_factory=OrderedDict)


MermaidTable = SchemaTable


def parse_mermaid(text: str) -> OrderedDict[str, SchemaTable]:
    """Return ``OrderedDict`` keyed by table name -> SchemaTable.

    Handles the ``name:::class { type col ... }`` block syntax used in
    ``demos_data_model.mmd``.
    """
    tables: OrderedDict[str, SchemaTable] = OrderedDict()
    pat = re.compile(
        r"^[ \t]+(?P<name>[A-Za-z_][A-Za-z_0-9]*):::(?P<cls>\w+)[ \t]*\{(?P<body>.*?)^[ \t]+\}",
        re.MULTILINE | re.DOTALL,
    )
    for m in pat.finditer(text):
        tbl = SchemaTable(name=m.group("name"), cls=m.group("cls"))
        for line in m.group("body").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith(NON_COLUMN_PREFIXES):
                continue
            tokens = stripped.split()
            if len(tokens) < 2:
                continue
            col_type = tokens[0]
            col_name = tokens[1].rstrip(",")
            tbl.columns[col_name] = col_type
        tables[tbl.name] = tbl
    return tables


# ---------- Graphviz digraph parser ----------
#
# Supports two label flavours commonly used for ER-style digraphs:
#
# 1. HTML <TABLE> labels (the format produced by most MySQL ER tools)::
#
#        node_name [label=<<TABLE ...>
#            <TR><TD ...><B>node_name</B></TD></TR>
#            <TR><TD PORT='col_a' ...>col_a (col_type)</TD></TR>
#            ...
#        </TABLE>> shape=plaintext];
#
#    Each column row is a <TR> with one <TD> whose visible text is
#    ``col_name (col_type)``. The PORT attribute (when present) gives
#    the canonical column name.
#
# 2. Record-shape labels::
#
#        node_name [shape=record label="{ <node_name> | col_a : col_type | ... }"];
#
#    Columns are pipe-separated; each column entry is
#    ``col_name : col_type`` (or ``col_name col_type``) inside the
#    label braces.
#
# A digraph may mix the two styles per node; we detect per-node by
# inspecting the label payload.

_GV_NODE_RE = re.compile(
    # Match: <name> [<attrs>];   where attrs may span multiple lines
    # because Graphviz allows newlines inside attribute lists.
    r"""(?P<name>[A-Za-z_][A-Za-z_0-9]*)
        \s*\[
        (?P<attrs>(?:[^\[\]]|\[[^\]]*\])*?)
        \]\s*;?""",
    re.VERBOSE | re.DOTALL,
)

_GV_HTML_TR_RE = re.compile(
    r"<TR\b[^>]*>\s*<TD\b(?P<td_attrs>[^>]*)>(?P<inner>.*?)</TD>\s*</TR>",
    re.IGNORECASE | re.DOTALL,
)

_GV_HTML_PORT_RE = re.compile(r"PORT\s*=\s*['\"](?P<port>[^'\"]+)['\"]", re.IGNORECASE)
_GV_HTML_TAGS_RE = re.compile(r"<[^>]+>")

_GV_COL_TEXT_RE = re.compile(
    r"^\s*(?P<col>[A-Za-z_][A-Za-z_0-9]*)\s*"
    r"(?:\(\s*(?P<paren_type>[^)]+)\s*\)|:\s*(?P<colon_type>.+?)|\s+(?P<bare_type>.+?))?\s*$",
)


def _strip_gv_attrs(attrs: str) -> dict[str, str]:
    """Return the parsed attribute dict for a Graphviz attribute list.

    Only the attributes we care about (``label``, ``shape``) are
    inspected, but the parser is general.
    """
    out: dict[str, str] = {}
    i = 0
    while i < len(attrs):
        m = re.match(r"\s*([A-Za-z_]+)\s*=\s*", attrs[i:])
        if not m:
            i += 1
            continue
        key = m.group(1).lower()
        i += m.end()
        if i >= len(attrs):
            break
        ch = attrs[i]
        if ch == "<":
            depth = 0
            j = i
            while j < len(attrs):
                if attrs[j] == "<":
                    depth += 1
                elif attrs[j] == ">":
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
                j += 1
            value = attrs[i + 1 : j - 1]
            i = j
        elif ch == '"':
            j = attrs.find('"', i + 1)
            if j == -1:
                break
            value = attrs[i + 1 : j]
            i = j + 1
        else:
            j = i
            while j < len(attrs) and not attrs[j].isspace() and attrs[j] not in ",;":
                j += 1
            value = attrs[i:j]
            i = j
        out[key] = value
        while i < len(attrs) and (attrs[i].isspace() or attrs[i] in ",;"):
            i += 1
    return out


def _split_trailing_parens(s: str) -> tuple[str, str]:
    """Split ``"name (type)"`` -> ``("name", "type")`` on the *last*
    balanced parenthesis group only. Handles nested parens such as
    ``"col (decimal(15,2))"`` and column names containing their own
    parens such as ``"Notes (2) (mediumtext)"``.

    Returns ``(s.strip(), "")`` if there is no trailing balanced group.
    """
    s = s.rstrip()
    if not s.endswith(")"):
        return s.strip(), ""
    depth = 0
    for i in range(len(s) - 1, -1, -1):
        ch = s[i]
        if ch == ")":
            depth += 1
        elif ch == "(":
            depth -= 1
            if depth == 0:
                name = s[:i].rstrip()
                type_str = s[i + 1 : -1].strip()
                return name, type_str
    return s.strip(), ""


def _parse_html_label_columns(label: str, table_name: str) -> OrderedDict[str, str]:
    cols: OrderedDict[str, str] = OrderedDict()
    for m in _GV_HTML_TR_RE.finditer(label):
        td_attrs = m.group("td_attrs") or ""
        inner = m.group("inner") or ""
        text = _GV_HTML_TAGS_RE.sub("", inner).strip()
        text = (
            text.replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
        )
        if not text or text == table_name:
            continue
        port_m = _GV_HTML_PORT_RE.search(td_attrs)
        text_name, col_type = _split_trailing_parens(text)
        col_name = (port_m.group("port") if port_m else text_name).strip()
        if col_name and col_name not in cols:
            cols[col_name] = col_type
    return cols


def _parse_record_label_columns(label: str, table_name: str) -> OrderedDict[str, str]:
    cols: OrderedDict[str, str] = OrderedDict()
    body = label.strip()
    if body.startswith("{") and body.endswith("}"):
        body = body[1:-1]
    for raw in body.split("|"):
        cell = raw.strip()
        cell = re.sub(r"^<[^>]+>", "", cell).strip()
        if not cell or cell == table_name:
            continue
        m = _GV_COL_TEXT_RE.match(cell)
        if not m:
            continue
        col_name = m.group("col").strip()
        col_type = (
            m.group("paren_type") or m.group("colon_type") or m.group("bare_type") or ""
        ).strip()
        if col_name and col_name not in cols and col_name != table_name:
            cols[col_name] = col_type
    return cols


def parse_graphviz(text: str) -> OrderedDict[str, SchemaTable]:
    """Parse a Graphviz digraph and return ``name -> SchemaTable``.

    Edge statements (``a -> b``) are skipped; only nodes whose label
    contains an HTML <TABLE> or a record-shape body are treated as
    relations.
    """
    tables: OrderedDict[str, SchemaTable] = OrderedDict()
    no_comments = re.sub(r"//[^\n]*", "", text)
    no_comments = re.sub(r"/\*.*?\*/", "", no_comments, flags=re.DOTALL)
    for node_m in _GV_NODE_RE.finditer(no_comments):
        attrs_blob = node_m.group("attrs")
        if "->" in node_m.group(0).split("[", 1)[0]:
            continue
        if "=" not in attrs_blob:
            continue
        attrs = _strip_gv_attrs(attrs_blob)
        label = attrs.get("label", "")
        if not label:
            continue
        name = node_m.group("name")
        shape = (attrs.get("shape") or "").lower()
        looks_html = "<TABLE" in label.upper() or "<TR" in label.upper()
        if looks_html:
            cols = _parse_html_label_columns(label, name)
        elif shape in {"record", "mrecord"} or label.lstrip().startswith("{"):
            cols = _parse_record_label_columns(label, name)
        else:
            continue
        if not cols:
            continue
        tables[name] = SchemaTable(name=name, cls=shape or "graphviz", columns=cols)
    return tables


# ---------- format dispatch ----------

def detect_schema_format(text: str, path: Path | None = None) -> str:
    """Return ``"graphviz"`` or ``"mermaid"``.

    Detection precedence:
    1. Explicit signal in the file body (``digraph`` keyword vs
       ``:::`` mermaid class marker).
    2. File extension (``.gv``/``.dot`` -> graphviz; ``.mmd`` ->
       mermaid).
    3. Mermaid as the conservative default.
    """
    head = text.lstrip()[:512]
    if re.search(r"^\s*(strict\s+)?digraph\b", text, re.IGNORECASE | re.MULTILINE):
        return "graphviz"
    if ":::" in head:
        return "mermaid"
    if path is not None:
        suffix = path.suffix.lower()
        if suffix in {".gv", ".dot"}:
            return "graphviz"
        if suffix == ".mmd":
            return "mermaid"
    return "mermaid"


def parse_schema(text: str, path: Path | None = None) -> OrderedDict[str, SchemaTable]:
    fmt = detect_schema_format(text, path)
    if fmt == "graphviz":
        return parse_graphviz(text)
    return parse_mermaid(text)


def load_schema(path: Path) -> OrderedDict[str, SchemaTable]:
    if not path.exists():
        die(
            f"schema model not found: {path}. "
            "Author the file (Graphviz digraph or mermaid) or "
            "pass --mysql-mmd / --demos-mmd."
        )
    text = path.read_text(encoding="utf-8")
    return parse_schema(text, path)


load_mermaid = load_schema


# ---------- authoritative sources of truth ----------

_BYTES_LITERAL_RE = re.compile(r"^b'(?P<inner>.*)'$", re.DOTALL)


def _unwrap_bytes_literal(value: str) -> str:
    """The MySQL snapshot stores some cells as Python ``b'...'`` reprs."""
    value = (value or "").strip()
    m = _BYTES_LITERAL_RE.match(value)
    return m.group("inner") if m else value


def load_mysql_snapshot(path: Path) -> OrderedDict[str, SchemaTable]:
    """Build the MySQL model from the live ``information_schema`` snapshot.

    ``reports/schema_snapshot/columns.csv`` (one row per column, captured by
    ``migrate schema-snapshot``) is the source of truth for the source schema.
    Columns are ordered by ``ORDINAL_POSITION`` and typed from ``COLUMN_TYPE``
    (e.g. ``varchar(20)``) so the existing :func:`norm_type` keeps working.
    """
    if not path.exists():
        die(
            f"MySQL snapshot not found: {path}. "
            "Run `migrate schema-snapshot` or pass --mysql-snapshot / --mysql-mmd."
        )
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            rows.append(row)
    rows.sort(key=lambda r: (r["TABLE_NAME"], int(r.get("ORDINAL_POSITION") or 0)))
    tables: OrderedDict[str, SchemaTable] = OrderedDict()
    for r in rows:
        table = r["TABLE_NAME"]
        col = r["COLUMN_NAME"]
        ctype = _unwrap_bytes_literal(r.get("COLUMN_TYPE", "")) or _unwrap_bytes_literal(
            r.get("DATA_TYPE", "")
        )
        tables.setdefault(table, SchemaTable(name=table, cls="dataTable")).columns[col] = ctype
    return tables


def load_demos_ddl() -> OrderedDict[str, SchemaTable]:
    """Build the DEMOS model from the pinned Prisma DDL (history excluded).

    Reuses the data dictionary's migration replay so ``ADD COLUMN`` /
    ``ALTER COLUMN`` migrations fold onto the ``CREATE TABLE`` blocks -- this
    is what makes ``demonstration.medicaid_id`` / ``chip_id`` visible to the
    column map (the old mermaid predated those migrations).
    """
    import data_dictionary_to_adoc as dd
    from schema_model import DDLTable, replay_ddl

    artifact = dd._resolve_artifact()
    ddl_tables: dict[str, DDLTable] = replay_ddl(artifact.read_text(encoding="utf-8"))
    # Fold in this repo's migration-private supplements, exactly as the data
    # dictionary does, so the two stay consistent.
    for sup in sorted(dd.SUPPLEMENTS_DIR.glob("*.sql")):
        replay_ddl(sup.read_text(encoding="utf-8"), ddl_tables)
    classes = dd._classify(ddl_tables)
    out: OrderedDict[str, SchemaTable] = OrderedDict()
    for name, tbl in ddl_tables.items():
        if tbl.has_history:  # the column map targets canonical tables, not *_history
            continue
        cols: OrderedDict[str, str] = OrderedDict((c.name, c.type) for c in tbl.columns)
        out[name] = SchemaTable(name=name, cls=classes.get(name, "dataTable"), columns=cols)
    return out


# ---------- drop list ----------

DROP_ROW_RE = re.compile(r"^\|\s*[A-Z_]+\s*\|\s*`(?P<table>[^`]+)`\s*\|\s*(?P<reason>.*?)\s*\|")


def load_drop_list(path: Path) -> dict[str, str]:
    drops: dict[str, str] = {}
    if not path.exists():
        die(f"drop list not found: {path}")
    for line in path.read_text(encoding="utf-8").splitlines():
        m = DROP_ROW_RE.match(line)
        if m:
            drops[m.group("table")] = m.group("reason").strip()
    return drops


# ---------- pgm_dtl tag mapping ----------

def load_pgm_dtl_tags(path: Path) -> set[str]:
    if not path.exists():
        return set()
    tags: set[str] = set()
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            tn = (row.get("tag_name") or "").strip()
            if tn:
                tags.add(tn)
    return tags


# ---------- CSV ----------

@dataclass
class MapRow:
    mysql_table: str
    mysql_column: str
    demos_table: str
    demos_column: str
    transform: str
    notes: str

    @property
    def is_drop(self) -> bool:
        return self.transform == "drop"


CSV_HEADER = ["mysql_table", "mysql_column", "demos_table", "demos_column", "transform", "notes"]


def load_csv(path: Path) -> list[MapRow]:
    if not path.exists():
        die(f"mapping CSV not found: {path}")
    out: list[MapRow] = []
    with path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = [c for c in CSV_HEADER if c not in (reader.fieldnames or [])]
        if missing:
            die(f"CSV {path} missing columns: {missing}")
        for i, row in enumerate(reader, start=2):
            out.append(
                MapRow(
                    mysql_table=(row.get("mysql_table") or "").strip(),
                    mysql_column=(row.get("mysql_column") or "").strip(),
                    demos_table=(row.get("demos_table") or "").strip(),
                    demos_column=(row.get("demos_column") or "").strip(),
                    transform=(row.get("transform") or "").strip(),
                    notes=(row.get("notes") or "").strip(),
                )
            )
            if not out[-1].mysql_table and not out[-1].is_drop():
                die(f"CSV {path} row {i}: mysql_table is required")
            if not out[-1].mysql_column and out[-1].transform not in ("constant", "derive"):
                die(f"CSV {path} row {i}: mysql_column is required (or use transform 'constant'/'derive')")
    return out


# ---------- transform validation ----------

def transform_is_valid(t: str) -> bool:
    if t in VALID_TRANSFORMS_BARE:
        return True
    return any(t.startswith(p) for p in VALID_TRANSFORM_PREFIXES)


# ---------- type-compat ----------

# A non-trivial transform "explains" a type mismatch.
TYPE_BRIDGING_TRANSFORMS = (
    "id_map",
    "cast",
    "derive",
    "crosswalk:",
    "json_pack:",
    "json_extract:",
    "tag_pivot:",
    "filter_typed:",
    "cast:",
    "comment_route",
    "pending_unify",
)


def transform_bridges_types(t: str) -> bool:
    if t in TYPE_BRIDGING_TRANSFORMS:
        return True
    return any(t.startswith(p) for p in TYPE_BRIDGING_TRANSFORMS if p.endswith(":"))


def match_marker(my_type: str | None, demos_type: str | None, transform: str) -> str:
    if transform == "drop":
        return "DROP"
    if not my_type or not demos_type:
        return "MISMATCH"
    if norm_type(my_type) == norm_type(demos_type):
        return "OK"
    if transform_bridges_types(transform):
        return "WARN"
    return "MISMATCH"


# ---------- lints ----------

def die(msg: str, errors: Iterable[str] | None = None) -> None:
    print(f"[source_target_columns] FAIL: {msg}", file=sys.stderr)
    if errors:
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
    sys.exit(1)


def run_lints(
    rows: list[MapRow],
    mysql: OrderedDict[str, MermaidTable],
    demos: OrderedDict[str, MermaidTable],
    drops: dict[str, str],
    pgm_dtl_tags: set[str],
    crosswalk_dir: Path,
    allow_uncovered_tables: bool = False,
) -> tuple[list[str], list[str]]:
    """Return ``(errors, uncovered_tables)``.

    ``errors`` are hard failures that must abort the build. When
    ``allow_uncovered_tables`` is true, the per-table coverage
    requirement is demoted from an error into the second return value
    so the coverage adoc fragment can surface it as a count without
    failing the build.
    """
    errors: list[str] = []
    uncovered: list[str] = []

    for r in rows:
        if r.mysql_table and r.mysql_table not in mysql:
            errors.append(
                f"MySQL table not in PMDA model: {r.mysql_table}.{r.mysql_column}"
            )
        elif r.mysql_table and r.mysql_column and r.mysql_column not in mysql[r.mysql_table].columns:
            errors.append(
                f"MySQL column not in PMDA model: {r.mysql_table}.{r.mysql_column}"
            )

        if r.demos_table or r.demos_column:
            if r.demos_column and not r.demos_table:
                errors.append(
                    f"DEMOS column set without DEMOS table: "
                    f"{r.mysql_table}.{r.mysql_column} -> .{r.demos_column}"
                )
            elif r.demos_table and r.demos_table not in demos:
                errors.append(
                    f"DEMOS table not in DEMOS model: {r.demos_table}.{r.demos_column}"
                )
            elif r.demos_column and r.demos_column not in demos[r.demos_table].columns:
                errors.append(
                    f"DEMOS column not in DEMOS model: "
                    f"{r.demos_table}.{r.demos_column}"
                )

        if not r.transform:
            errors.append(
                f"missing transform: {r.mysql_table}.{r.mysql_column}"
            )
        elif not transform_is_valid(r.transform):
            errors.append(
                f"unknown transform '{r.transform}' on {r.mysql_table}.{r.mysql_column}"
            )

        if r.transform.startswith("crosswalk:"):
            name = r.transform.split(":", 1)[1]
            cw = crosswalk_dir / f"{name}.csv"
            if not cw.exists():
                errors.append(
                    f"crosswalk file missing: {cw} (referenced by "
                    f"{r.mysql_table}.{r.mysql_column})"
                )

        if r.transform.startswith("tag_pivot:"):
            name = r.transform.split(":", 1)[1]
            if name not in pgm_dtl_tags:
                errors.append(
                    f"tag_pivot tag '{name}' missing from pgm_dtl_tag_mapping.csv "
                    f"({r.mysql_table}.{r.mysql_column})"
                )

    rows_by_mysql_table: dict[str, list[MapRow]] = {}
    for r in rows:
        rows_by_mysql_table.setdefault(r.mysql_table, []).append(r)

    for table_name in mysql:
        if table_name in rows_by_mysql_table:
            continue
        if table_name in drops:
            continue
        msg = (
            f"MySQL table {table_name} not covered: no CSV rows and not on drop list"
        )
        if allow_uncovered_tables:
            uncovered.append(table_name)
        else:
            errors.append(msg)

    return errors, uncovered


# ---------- rendering ----------

ADOC_NOTICE = (
    "// Generated by docs/tools/source_target_columns_to_adoc.py.\n"
    "// Do not edit by hand; rerun `make column-map` after editing\n"
    "// reports/source_target_columns.csv. Schemas are read from the\n"
    "// MySQL information_schema snapshot and the pinned Prisma DDL.\n"
)


def _esc(s: str) -> str:
    """Escape pipe characters so they do not break asciidoc table cells."""
    return s.replace("|", "\\|")


def render_long_table(
    rows: list[MapRow],
    drops: dict[str, str],
    mysql: OrderedDict[str, MermaidTable],
    demos: OrderedDict[str, MermaidTable],
) -> str:
    out: list[str] = [ADOC_NOTICE]
    out.append('[%header%autowidth.stretch.sortable]')
    out.append("|===")
    out.append(
        "| MySQL table | MySQL column | MySQL type "
        "| DEMOS table | DEMOS column | DEMOS type "
        "| Transform | Match | Notes"
    )
    out.append("")

    for r in rows:
        my_type = mysql.get(r.mysql_table, MermaidTable(r.mysql_table, "")).columns.get(
            r.mysql_column
        )
        demos_type = (
            demos.get(r.demos_table, MermaidTable(r.demos_table, "")).columns.get(r.demos_column)
            if r.demos_table and r.demos_column
            else None
        )
        marker = match_marker(my_type, demos_type, r.transform)
        out.append(
            "| `{my_t}` | `{my_c}` | {my_ty} | {de_t} | {de_c} | {de_ty} | "
            "`{tr}` | {mk} | {nt}".format(
                my_t=_esc(r.mysql_table),
                my_c=_esc(r.mysql_column),
                my_ty=my_type or "—",
                de_t=f"`{_esc(r.demos_table)}`" if r.demos_table else "—",
                de_c=f"`{_esc(r.demos_column)}`" if r.demos_column else "—",
                de_ty=demos_type or "—",
                tr=_esc(r.transform),
                mk=marker,
                nt=_esc(r.notes) or "",
            )
        )

    for table, reason in sorted(drops.items()):
        for col in mysql.get(table, MermaidTable(table, "")).columns:
            my_type = mysql[table].columns[col]
            out.append(
                f"| `{_esc(table)}` | `{_esc(col)}` | {my_type} | — | — | — | "
                f"`drop` | DROP | {_esc(reason)}"
            )

    out.append("|===")
    out.append("")
    return "\n".join(out)


def render_sections(
    rows: list[MapRow],
    drops: dict[str, str],
    mysql: OrderedDict[str, MermaidTable],
    demos: OrderedDict[str, MermaidTable],
) -> str:
    out: list[str] = [ADOC_NOTICE]

    rows_by_table: dict[str, list[MapRow]] = {}
    for r in rows:
        rows_by_table.setdefault(r.mysql_table, []).append(r)

    for table_name in sorted(rows_by_table):
        table_rows = rows_by_table[table_name]
        targets = sorted({r.demos_table for r in table_rows if r.demos_table})
        target_str = ", ".join(f"`{t}`" for t in targets) if targets else "(no DEMOS target)"
        out.append(f"=== `{table_name}` -> {target_str}")
        out.append("")
        out.append('[cols="2,1,2,1,2,1,3"]')
        out.append("|===")
        out.append(
            "| MySQL column | Type | DEMOS column | Type | Transform | Match | Notes"
        )
        out.append("")
        for r in table_rows:
            my_type = mysql.get(table_name, MermaidTable(table_name, "")).columns.get(
                r.mysql_column
            )
            demos_type = (
                demos.get(r.demos_table, MermaidTable(r.demos_table, "")).columns.get(
                    r.demos_column
                )
                if r.demos_table and r.demos_column
                else None
            )
            marker = match_marker(my_type, demos_type, r.transform)
            de_t_disp = f"`{r.demos_table}`." if r.demos_table else ""
            de_c_disp = f"`{r.demos_column}`" if r.demos_column else "—"
            out.append(
                f"| `{r.mysql_column}` | {my_type or '—'} "
                f"| {de_t_disp}{de_c_disp} | {demos_type or '—'} "
                f"| `{r.transform}` | {marker} | {_esc(r.notes)}"
            )
        out.append("|===")
        out.append("")

    if drops:
        out.append("=== Dropped tables")
        out.append("")
        out.append('[cols="2,4"]')
        out.append("|===")
        out.append("| MySQL table | Reason")
        out.append("")
        for table, reason in sorted(drops.items()):
            out.append(f"| `{table}` | {_esc(reason)}")
        out.append("|===")
        out.append("")

    return "\n".join(out)


def render_coverage(
    rows: list[MapRow],
    drops: dict[str, str],
    mysql: OrderedDict[str, MermaidTable],
    demos: OrderedDict[str, MermaidTable],
    uncovered: list[str] | None = None,
) -> str:
    uncovered = list(uncovered or [])
    out: list[str] = [ADOC_NOTICE]

    mapped_tables = {r.mysql_table for r in rows if not r.is_drop}
    drop_tables = set(drops)
    total = len(mysql)
    covered = len(mapped_tables | drop_tables)
    pct = (100.0 * covered / total) if total else 0.0

    type_ok = type_warn = type_mismatch = 0
    for r in rows:
        my_type = mysql.get(r.mysql_table, MermaidTable(r.mysql_table, "")).columns.get(
            r.mysql_column
        )
        demos_type = (
            demos.get(r.demos_table, MermaidTable(r.demos_table, "")).columns.get(r.demos_column)
            if r.demos_table and r.demos_column
            else None
        )
        m = match_marker(my_type, demos_type, r.transform)
        if m == "OK":
            type_ok += 1
        elif m == "WARN":
            type_warn += 1
        elif m == "MISMATCH":
            type_mismatch += 1

    demos_targets = {r.demos_table for r in rows if r.demos_table}
    demos_total = len(demos)
    demos_pct = (100.0 * len(demos_targets) / demos_total) if demos_total else 0.0

    out.append('[cols="3,2"]')
    out.append("|===")
    out.append("| Metric | Value")
    out.append("")
    out.append(f"| MySQL tables in PMDA model | {total}")
    out.append(f"| MySQL tables covered (mapped or dropped) | {covered} ({pct:.1f}%)")
    out.append(f"| MySQL tables migrated (>=1 mapping row) | {len(mapped_tables)}")
    out.append(f"| MySQL tables dropped | {len(drop_tables)}")
    out.append(f"| Column-mapping rows | {len(rows)}")
    out.append(f"| Column-pair type matches (OK) | {type_ok}")
    out.append(
        f"| Column-pair type warnings (WARN; transform explains the diff) | {type_warn}"
    )
    out.append(
        f"| Column-pair type mismatches (MISMATCH; needs review) | {type_mismatch}"
    )
    out.append(
        f"| DEMOS tables hit by at least one mapping | "
        f"{len(demos_targets)} of {demos_total} ({demos_pct:.1f}%)"
    )
    out.append(
        f"| MySQL tables not yet covered (no CSV rows, not on drop list) | "
        f"{len(uncovered)}"
    )
    out.append("|===")
    out.append("")

    if uncovered:
        out.append("[NOTE]")
        out.append("====")
        out.append(
            f"`--allow-uncovered-tables` was set: {len(uncovered)} MySQL "
            "table(s) are awaiting SME mapping. Each one needs at least one "
            "row in `reports/source_target_columns.csv` (or an entry in "
            "`reports/narrative/drop_list.md`) before this flag can be removed."
        )
        out.append("====")
        out.append("")
        out.append("=== Tables awaiting SME mapping")
        out.append("")
        out.append('[%collapsible]')
        out.append("=====")
        out.append('[cols="1"]')
        out.append("|===")
        out.append("| MySQL table")
        out.append("")
        for t in sorted(uncovered):
            out.append(f"| `{t}`")
        out.append("|===")
        out.append("=====")
        out.append("")
    return "\n".join(out)


# ---------- main ----------

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    p.add_argument("--mysql-snapshot", type=Path, default=DEFAULT_MYSQL_SNAPSHOT)
    p.add_argument(
        "--mysql-mmd",
        type=Path,
        default=None,
        help="override: read MySQL from a Graphviz/mermaid diagram instead of the snapshot",
    )
    p.add_argument(
        "--demos-mmd",
        type=Path,
        default=None,
        help="override: read DEMOS from a mermaid/Graphviz diagram instead of the pinned DDL",
    )
    p.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    p.add_argument("--drop-list", type=Path, default=DEFAULT_DROP_LIST)
    p.add_argument("--pgm-dtl", type=Path, default=DEFAULT_PGM_DTL)
    p.add_argument("--crosswalk-dir", type=Path, default=DEFAULT_CROSSWALK_DIR)
    p.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    p.add_argument(
        "--allow-missing-mysql-mmd",
        action="store_true",
        help=(
            "If set, write empty fragments and exit 0 when the MySQL PMDA "
            "model file is absent. Useful while the model is being authored."
        ),
    )
    p.add_argument(
        "--allow-uncovered-tables",
        action="store_true",
        help=(
            "If set, demote the per-table coverage requirement (every "
            "MySQL table must have CSV rows or a drop-list entry) from a "
            "hard error into a count + collapsible list rendered into the "
            "coverage adoc fragment. Other lints (column existence, "
            "transform vocabulary, crosswalk/tag-pivot existence) still "
            "fail the build. Intended for the soft-launch period while "
            "the SME completes the column map."
        ),
    )
    args = p.parse_args(argv)

    args.out_dir.mkdir(parents=True, exist_ok=True)

    if args.allow_missing_mysql_mmd and args.mysql_mmd is not None and not args.mysql_mmd.exists():
        try:
            shown = args.mysql_mmd.resolve().relative_to(SPECS_ROOT.resolve())
        except ValueError:
            shown = args.mysql_mmd
        stub = (
            ADOC_NOTICE
            + "\n[NOTE]\n====\n"
            + f"`{shown}` is not yet in the workspace.\n"
            + "Author it as a Graphviz digraph "
            + "(``digraph { ... }`` with HTML <TABLE> labels) or as a\n"
            + "mermaid ``name:::class { type col ... }`` block, then rerun\n"
            + "`make column-map`.\n"
            + "====\n"
        )
        for name in (
            "source_target_columns_table.adoc",
            "source_target_columns_sections.adoc",
            "source_target_columns_coverage.adoc",
        ):
            (args.out_dir / name).write_text(stub, encoding="utf-8")
        print(
            "[source_target_columns] MySQL PMDA mermaid missing; "
            "wrote stub fragments under "
            f"{args.out_dir} (--allow-missing-mysql-mmd was set).",
        )
        return 0

    # Source of truth: the live snapshot (MySQL) and the pinned Prisma DDL
    # (DEMOS). A diagram path is only used when explicitly passed as an override.
    mysql = load_schema(args.mysql_mmd) if args.mysql_mmd else load_mysql_snapshot(args.mysql_snapshot)
    demos = load_schema(args.demos_mmd) if args.demos_mmd else load_demos_ddl()
    drops = load_drop_list(args.drop_list)
    pgm_dtl_tags = load_pgm_dtl_tags(args.pgm_dtl)
    rows = load_csv(args.csv)

    errors, uncovered = run_lints(
        rows,
        mysql,
        demos,
        drops,
        pgm_dtl_tags,
        args.crosswalk_dir,
        allow_uncovered_tables=args.allow_uncovered_tables,
    )
    if errors:
        die(f"{len(errors)} lint error(s)", errors=errors)

    (args.out_dir / "source_target_columns_table.adoc").write_text(
        render_long_table(rows, drops, mysql, demos), encoding="utf-8"
    )
    (args.out_dir / "source_target_columns_sections.adoc").write_text(
        render_sections(rows, drops, mysql, demos), encoding="utf-8"
    )
    (args.out_dir / "source_target_columns_coverage.adoc").write_text(
        render_coverage(rows, drops, mysql, demos, uncovered=uncovered),
        encoding="utf-8",
    )

    print(
        f"[source_target_columns] wrote 3 fragments to {args.out_dir} "
        f"({len(rows)} rows, {len(mysql)} MySQL tables, "
        f"{len(drops)} drops, {len(uncovered)} uncovered).",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
