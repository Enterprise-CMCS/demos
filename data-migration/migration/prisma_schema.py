"""Minimal pure-Python parser for the DEMOS app's declarative ``.prisma`` models.

The DEMOS app owns its schema in Prisma. Two artifacts come out of that:
the compiled ``migration.sql`` files (applied verbatim by ``migrate ddl``)
and the declarative ``*.prisma`` *model* files. The compiled SQL is the
source of truth for what gets applied; the model files carry metadata the
SQL makes painful to recover -- model/field -> table/column mapping
(``@@map`` / ``@map``), declarative relations (``@relation``) including
composite keys and referential actions.

This module parses only the subset needed to cross-validate and enrich the
FK-candidate reconstruction in ``migration/phases/fk_candidates.py``:
models, ``@@map``, fields, ``@map``, ``@relation``, and enums. It depends on
nothing outside the standard library -- deliberately, to keep the Node /
Prisma CLI toolchain out of this Python+SQL repo (see
``docs/developer/reference-prisma-ddl.adoc``).

It is intentionally lenient: anything it does not recognize is ignored
rather than raising, because this is a best-effort cross-validation input,
not an apply path.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Field-level @map("column") and block-level @@map("table").
_MAP_RE = re.compile(r'@map\(\s*"([^"]*)"\s*\)')
_BLOCK_MAP_RE = re.compile(r'@@map\(\s*"([^"]*)"\s*\)')

# @relation(...) argument shapes. Each is optional; a relation field on the
# non-owning side carries no `fields:`/`references:` and is skipped.
_REL_FIELDS_RE = re.compile(r"fields:\s*\[([^\]]*)\]")
_REL_REFERENCES_RE = re.compile(r"references:\s*\[([^\]]*)\]")
_REL_ONDELETE_RE = re.compile(r"onDelete:\s*(\w+)")
_REL_ONUPDATE_RE = re.compile(r"onUpdate:\s*(\w+)")
_REL_NAME_KW_RE = re.compile(r'name:\s*"([^"]*)"')
# Positional relation name: a quoted string immediately after the opening
# paren, e.g. `@relation("DemoState", fields: ...)`. `_parse_relation`
# receives the parenthesized text starting at `(`.
_REL_NAME_POS_RE = re.compile(r'^\(\s*"([^"]*)"')

# `model Name {` / `enum Name {` block openers.
_BLOCK_OPEN_RE = re.compile(r"^(model|enum)\s+(\w+)\s*\{")
# A field declaration: `fieldName Type ...`. The type may carry `?`/`[]`.
_FIELD_RE = re.compile(r"^(\w+)\s+(\w+)(\[\])?(\?)?\b")


@dataclass(frozen=True)
class PrismaRelation:
    """The owning side of a ``@relation`` (the side that holds the FK columns)."""

    name: str | None
    fields: list[str]
    references: list[str]
    on_delete: str | None
    on_update: str | None


@dataclass(frozen=True)
class PrismaField:
    """A single field line within a ``model`` block."""

    name: str
    type_name: str
    is_list: bool
    is_optional: bool
    column: str
    relation: PrismaRelation | None


@dataclass
class PrismaModel:
    """A ``model`` block: its name, mapped table, and fields."""

    name: str
    table: str
    fields: list[PrismaField] = field(default_factory=list)

    def field_to_column(self) -> dict[str, str]:
        """Map each field name to its ``@map`` column (or the field name)."""
        return {f.name: f.column for f in self.fields}


@dataclass(frozen=True)
class PrismaEnum:
    """An ``enum`` block: its name, mapped name, and values."""

    name: str
    mapped: str
    values: list[str]


@dataclass(frozen=True)
class ResolvedRelation:
    """A ``@relation`` resolved to ``demos_app`` table/column names.

    ``from_columns`` and ``to_columns`` are positionally paired (the i-th
    from-column references the i-th to-column), so a composite relation
    yields parallel lists of equal length.
    """

    name: str | None
    from_table: str
    from_columns: list[str]
    to_table: str
    to_columns: list[str]
    on_delete: str | None
    on_update: str | None


@dataclass
class PrismaSchema:
    """Parsed view of a (possibly multi-file) Prisma datamodel."""

    models: dict[str, PrismaModel] = field(default_factory=dict)
    enums: dict[str, PrismaEnum] = field(default_factory=dict)

    def resolved_relations(self) -> list[ResolvedRelation]:
        """Resolve every owning-side ``@relation`` to mapped table/column names.

        Relations whose target type is not a known model (e.g. a dangling
        reference) or whose owning side lacks ``fields``/``references`` are
        skipped. Field names are translated to their ``@map`` columns so the
        result joins the ``(demos_table, demos_column)`` key space used by
        ``source_target_columns.csv``.
        """
        out: list[ResolvedRelation] = []
        for model in self.models.values():
            from_cols_map = model.field_to_column()
            for fld in model.fields:
                rel = fld.relation
                if rel is None or not rel.fields or not rel.references:
                    continue
                target = self.models.get(fld.type_name)
                if target is None:
                    continue
                if len(rel.fields) != len(rel.references):
                    continue
                to_cols_map = target.field_to_column()
                out.append(
                    ResolvedRelation(
                        name=rel.name,
                        from_table=model.table,
                        from_columns=[from_cols_map.get(f, f) for f in rel.fields],
                        to_table=target.table,
                        to_columns=[to_cols_map.get(r, r) for r in rel.references],
                        on_delete=rel.on_delete,
                        on_update=rel.on_update,
                    )
                )
        return out


def _strip_comment(line: str) -> str:
    """Remove a trailing ``//`` comment, ignoring ``//`` inside quotes."""
    in_q = False
    i = 0
    while i < len(line):
        c = line[i]
        if c == '"':
            in_q = not in_q
        elif c == "/" and not in_q and i + 1 < len(line) and line[i + 1] == "/":
            return line[:i]
        i += 1
    return line


def _split_idents(s: str) -> list[str]:
    """Split a ``[a, b]`` body into trimmed identifier names."""
    return [p.strip() for p in s.split(",") if p.strip()]


def _parse_relation(attr_text: str) -> PrismaRelation:
    """Parse the text of a single ``@relation(...)`` attribute."""
    fields_m = _REL_FIELDS_RE.search(attr_text)
    refs_m = _REL_REFERENCES_RE.search(attr_text)
    on_del = _REL_ONDELETE_RE.search(attr_text)
    on_upd = _REL_ONUPDATE_RE.search(attr_text)
    name_m = _REL_NAME_KW_RE.search(attr_text) or _REL_NAME_POS_RE.search(attr_text)
    return PrismaRelation(
        name=name_m.group(1) if name_m else None,
        fields=_split_idents(fields_m.group(1)) if fields_m else [],
        references=_split_idents(refs_m.group(1)) if refs_m else [],
        on_delete=on_del.group(1) if on_del else None,
        on_update=on_upd.group(1) if on_upd else None,
    )


def _extract_relation(line: str) -> PrismaRelation | None:
    """Return the parsed ``@relation`` on ``line`` if one is present."""
    idx = line.find("@relation")
    if idx == -1:
        return None
    open_idx = line.find("(", idx)
    if open_idx == -1:
        return _parse_relation("")
    depth = 0
    for j in range(open_idx, len(line)):
        if line[j] == "(":
            depth += 1
        elif line[j] == ")":
            depth -= 1
            if depth == 0:
                return _parse_relation(line[open_idx : j + 1])
    return _parse_relation(line[open_idx:])


def _parse_model_body(name: str, body: list[str]) -> PrismaModel:
    """Build a :class:`PrismaModel` from the raw lines of one block."""
    table = name
    fields: list[PrismaField] = []
    for raw in body:
        line = _strip_comment(raw).strip()
        if not line:
            continue
        if line.startswith("@@"):
            bm = _BLOCK_MAP_RE.search(line)
            if bm:
                table = bm.group(1)
            continue
        fm = _FIELD_RE.match(line)
        if not fm:
            continue
        fname = fm.group(1)
        type_name = fm.group(2)
        is_list = bool(fm.group(3))
        is_optional = bool(fm.group(4))
        col_m = _MAP_RE.search(line)
        column = col_m.group(1) if col_m else fname
        relation = _extract_relation(line)
        fields.append(
            PrismaField(
                name=fname,
                type_name=type_name,
                is_list=is_list,
                is_optional=is_optional,
                column=column,
                relation=relation,
            )
        )
    return PrismaModel(name=name, table=table, fields=fields)


def _parse_enum_body(name: str, body: list[str]) -> PrismaEnum:
    """Build a :class:`PrismaEnum` from the raw lines of one block."""
    mapped = name
    values: list[str] = []
    for raw in body:
        line = _strip_comment(raw).strip()
        if not line:
            continue
        if line.startswith("@@"):
            bm = _BLOCK_MAP_RE.search(line)
            if bm:
                mapped = bm.group(1)
            continue
        if line.startswith("@"):
            continue
        token = line.split()[0]
        if re.fullmatch(r"\w+", token):
            values.append(token)
    return PrismaEnum(name=name, mapped=mapped, values=values)


def parse_prisma_schema(text: str) -> PrismaSchema:
    """Parse concatenated ``.prisma`` source into a :class:`PrismaSchema`.

    Only ``model`` and ``enum`` blocks are extracted; ``datasource``,
    ``generator``, and unrecognized constructs are ignored. Nested braces
    inside a block (e.g. ``@default(...)``) are tracked so the block end is
    detected correctly.
    """
    schema = PrismaSchema()
    lines = text.splitlines()
    i = 0
    n = len(lines)
    while i < n:
        stripped = _strip_comment(lines[i]).strip()
        opener = _BLOCK_OPEN_RE.match(stripped)
        if not opener:
            i += 1
            continue
        kind, block_name = opener.group(1), opener.group(2)
        depth = stripped.count("{") - stripped.count("}")
        body: list[str] = []
        i += 1
        while i < n and depth > 0:
            raw = lines[i]
            no_comment = _strip_comment(raw)
            depth += no_comment.count("{") - no_comment.count("}")
            if depth > 0:
                body.append(raw)
            i += 1
        if kind == "model":
            model = _parse_model_body(block_name, body)
            schema.models[model.name] = model
        else:
            enum = _parse_enum_body(block_name, body)
            schema.enums[enum.name] = enum
    return schema
