"""Analyse the pinned Prisma DDL for migration-relevant statements.

The DEMOS app team owns the ``demos_app.*`` schema via Prisma migrations;
this repo *consumes* them (see
xref:reference-prisma-ddl.adoc[Prisma DDL pipeline]). Every time the pin in
``reports/prisma_ddl.sha256`` is bumped, someone has to read the new
migration set and decide what each statement means for *our* loader -- a new
NOT NULL column we must source, a CHECK that narrows an accepted value
domain, a backfill that mints synthetic ids we would rather populate from
PMDA, and so on.

This tool turns that read into a committed, drift-checked artifact. It parses
the concatenated, pinned DDL into per-migration statements (correctly
skipping ``$$``-quoted function bodies, which is why a naive
``grep -c UPDATE`` over the same file is wildly wrong), classifies each into
the migration-relevant categories below, and renders
``docs/shared/generated/prisma-migration-analysis.adoc``. ``make all`` in
``docs/`` regenerates it and CI fails if the committed copy drifts -- so a
new upstream migration cannot land silently.

Statement categories (the "what to inspect when the pin moves" checklist):

* ``CREATE TABLE`` -- new parent tables (may need a source mapping or a
  drop-list entry).
* ``INSERT INTO ... VALUES`` -- seed/vocabulary rows (a new value domain may
  become a crosswalk target).
* ``CREATE SEQUENCE`` -- generators we may have to reconcile so PMDA-sourced
  values do not collide.
* ``ALTER TABLE ... ADD COLUMN`` -- new columns we may have to populate.
* ``ALTER COLUMN ... SET/DROP DEFAULT`` and ``SET NOT NULL`` -- defaults the
  loader must not lean on, and new not-null obligations.
* ``ADD CONSTRAINT ... CHECK`` -- narrowed value domains / blockers.
* ``UPDATE`` / ``WITH ... UPDATE`` -- backfills (often the seed/clone path we
  must override with real PMDA data).
* ``DELETE FROM ... WHERE`` -- reseed housekeeping.
* ``DISABLE/ENABLE TRIGGER`` -- backfill scaffolding that hints at
  immutable-field / history-log timing we must respect at insert time.
* ``JOIN`` usage inside backfills -- the derivation rule for a minted value.

It also asserts the *absence* of ``ON CONFLICT`` / ``MERGE`` / ``upsert``,
since their appearance would change our idempotency assumptions.

Run from the repo root:

    uv run python docs/tools/prisma_migration_analysis.py

Diff the current pin against a previously cached artifact (operator aid when
bumping the pin; prints to stdout, writes nothing):

    uv run python docs/tools/prisma_migration_analysis.py --against <old-sha>
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field

from schema_model import (
    DOCS_DIR,
    PRISMA_CACHE_DIR,
    resolve_ddl_path,
)

OUTPUT = DOCS_DIR / "shared" / "generated" / "prisma-migration-analysis.adoc"

MIGRATION_BANNER = re.compile(r"^-- migration:\s*(?P<name>\S+)\s*$", re.MULTILINE)


# --------------------------------------------------------------------------- #
# Statement splitting
# --------------------------------------------------------------------------- #
def split_statements(sql: str) -> list[str]:
    """Split a migration body into top-level statements.

    Honours ``--`` line comments and ``$tag$ ... $tag$`` dollar quoting so a
    ``DO $$ ... ;  ... $$;`` block (which contains inner semicolons and inner
    ``UPDATE``s) is returned as a *single* statement.
    """
    out: list[str] = []
    buf: list[str] = []
    i, n = 0, len(sql)
    dollar_tag: str | None = None
    while i < n:
        ch = sql[i]
        if dollar_tag is not None:
            if sql.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue
            buf.append(ch)
            i += 1
            continue
        # line comment
        if ch == "-" and sql.startswith("--", i):
            j = sql.find("\n", i)
            j = n if j == -1 else j
            buf.append(sql[i:j])
            i = j
            continue
        # dollar-quote open
        if ch == "$":
            m = re.match(r"\$[A-Za-z_]*\$", sql[i:])
            if m:
                dollar_tag = m.group(0)
                buf.append(dollar_tag)
                i += len(dollar_tag)
                continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                out.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        out.append(tail)
    return out


def strip_comments(stmt: str) -> str:
    """Drop ``--`` comments and collapse whitespace for keyword classification."""
    no_comments = re.sub(r"--[^\n]*", " ", stmt)
    return re.sub(r"\s+", " ", no_comments).strip()


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #
@dataclass
class MigrationFacts:
    name: str
    created_tables: list[str] = field(default_factory=list)
    created_sequences: list[str] = field(default_factory=list)
    inserts: list[str] = field(default_factory=list)
    added_columns: list[str] = field(default_factory=list)
    set_default: list[str] = field(default_factory=list)
    drop_default: list[str] = field(default_factory=list)
    set_not_null: list[str] = field(default_factory=list)
    checks: list[str] = field(default_factory=list)
    backfills: int = 0
    deletes: list[str] = field(default_factory=list)
    triggers_disabled: list[str] = field(default_factory=list)
    triggers_enabled: list[str] = field(default_factory=list)
    backfill_joins: int = 0
    risky: list[str] = field(default_factory=list)  # ON CONFLICT / MERGE / upsert

    def is_noteworthy(self) -> bool:
        return any(
            (
                self.created_tables,
                self.created_sequences,
                self.inserts,
                self.added_columns,
                self.set_default,
                self.drop_default,
                self.set_not_null,
                self.checks,
                self.backfills,
                self.deletes,
                self.risky,
            )
        )


_QUAL = r'(?:"?[a-z_][a-z0-9_]*"?\.)?"?(?P<name>[a-z_][a-z0-9_]*)"?'
RE_CREATE_TABLE = re.compile(rf"^CREATE TABLE (?:IF NOT EXISTS )?{_QUAL}", re.I)
RE_CREATE_SEQ = re.compile(rf"^CREATE SEQUENCE (?:IF NOT EXISTS )?{_QUAL}", re.I)
RE_INSERT = re.compile(rf"^INSERT INTO {_QUAL}", re.I)
RE_DELETE = re.compile(rf"^DELETE FROM {_QUAL}", re.I)
RE_ALTER = re.compile(rf"^ALTER TABLE (?:ONLY )?{_QUAL}", re.I)
RE_ADD_COLUMN = re.compile(r"ADD COLUMN (?:IF NOT EXISTS )?\"?(?P<col>[a-z_][a-z0-9_]*)\"?", re.I)
RE_ALTER_COLUMN = re.compile(r"ALTER COLUMN \"?(?P<col>[a-z_][a-z0-9_]*)\"?", re.I)
RE_ADD_CHECK = re.compile(
    r"ADD CONSTRAINT \"?(?P<name>[a-z_][a-z0-9_]*)\"?\s+CHECK", re.I
)
RE_TRIG = re.compile(
    r"(?P<act>DISABLE|ENABLE) TRIGGER \"?(?P<trig>[a-z_][a-z0-9_]*)\"?", re.I
)


def classify(name: str, statements: list[str]) -> MigrationFacts:
    facts = MigrationFacts(name=name)
    for raw in statements:
        s = strip_comments(raw)
        if not s:
            continue
        upper = s.upper()

        if any(tok in upper for tok in (" ON CONFLICT", " MERGE ", "UPSERT")):
            facts.risky.append(s[:80])

        m = RE_CREATE_TABLE.match(s)
        if m:
            facts.created_tables.append(m.group("name"))
            continue
        m = RE_CREATE_SEQ.match(s)
        if m:
            facts.created_sequences.append(m.group("name"))
            continue
        m = RE_INSERT.match(s)
        if m:
            facts.inserts.append(m.group("name"))
            continue
        m = RE_DELETE.match(s)
        if m:
            facts.deletes.append(m.group("name"))
            continue
        if upper.startswith("UPDATE ") or (
            upper.startswith("WITH ") and re.search(r"\bUPDATE\b", upper)
        ):
            facts.backfills += 1
            if re.search(r"\bJOIN\b", upper):
                facts.backfill_joins += 1
            continue
        # DO $$ ... TRIGGER ... $$ blocks and bare ALTER ... TRIGGER
        for tm in RE_TRIG.finditer(s):
            if tm.group("act").upper() == "DISABLE":
                facts.triggers_disabled.append(tm.group("trig"))
            else:
                facts.triggers_enabled.append(tm.group("trig"))
        m = RE_ALTER.match(s)
        if m:
            table = m.group("name")
            for cm in RE_ADD_COLUMN.finditer(s):
                facts.added_columns.append(f"{table}.{cm.group('col')}")
            if "SET DEFAULT" in upper:
                for am in RE_ALTER_COLUMN.finditer(s):
                    facts.set_default.append(f"{table}.{am.group('col')}")
            if "DROP DEFAULT" in upper:
                for am in RE_ALTER_COLUMN.finditer(s):
                    facts.drop_default.append(f"{table}.{am.group('col')}")
            if "SET NOT NULL" in upper:
                for am in RE_ALTER_COLUMN.finditer(s):
                    facts.set_not_null.append(f"{table}.{am.group('col')}")
            cm = RE_ADD_CHECK.search(s)
            if cm:
                facts.checks.append(f"{table}: {cm.group('name')}")
    return facts


def parse_ddl(text: str) -> list[MigrationFacts]:
    """Split the concatenated DDL into per-migration fact records."""
    spans: list[tuple[str, int, int]] = []
    matches = list(MIGRATION_BANNER.finditer(text))
    for idx, m in enumerate(matches):
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        spans.append((m.group("name"), start, end))
    return [classify(name, split_statements(text[start:end])) for name, start, end in spans]


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def _li(items: list[str]) -> str:
    return ", ".join(f"`{x}`" for x in items)


def render(facts: list[MigrationFacts], pin: str) -> str:
    lines: list[str] = [
        "// Generated by docs/tools/prisma_migration_analysis.py from "
        f"state/prisma_ddl/{pin}.sql -- do not edit.",
        "",
    ]

    risky = [f for f in facts if f.risky]
    lines.append("[cols=\"2,1,4\"]")
    lines.append("|===")
    lines.append("| Signal | Count | Notes")
    lines.append("")
    total_tables = sum(len(f.created_tables) for f in facts)
    total_cols = sum(len(f.added_columns) for f in facts)
    total_checks = sum(len(f.checks) for f in facts)
    total_seq = sum(len(f.created_sequences) for f in facts)
    total_backfill = sum(f.backfills for f in facts)
    total_del = sum(len(f.deletes) for f in facts)
    total_nn = sum(len(f.set_not_null) for f in facts)
    total_inserts = sum(len(f.inserts) for f in facts)
    lines += [
        f"| Migrations in pin | {len(facts)} | Concatenated, chronological.",
        f"| `CREATE TABLE` | {total_tables} | New parent tables.",
        f"| `INSERT INTO` | {total_inserts} | Seed / vocabulary rows (possible crosswalk targets).",
        f"| `ADD COLUMN` | {total_cols} | New columns the loader may need to source.",
        f"| `SET NOT NULL` | {total_nn} | New not-null obligations.",
        f"| `ADD CONSTRAINT ... CHECK` | {total_checks} | Narrowed value domains / blockers.",
        f"| `CREATE SEQUENCE` | {total_seq} | Generators to reconcile.",
        f"| `UPDATE` / `WITH ... UPDATE` | {total_backfill} | Backfills (top-level only).",
        f"| `DELETE FROM` | {total_del} | Reseed housekeeping.",
        "| `ON CONFLICT` / `MERGE` / `upsert` | "
        + str(len(risky))
        + " | Expected `0`; non-zero changes our idempotency assumptions.",
        "|===",
        "",
    ]

    noteworthy = [f for f in facts if f.is_noteworthy()]
    lines.append("== Migration-by-migration")
    lines.append("")
    lines.append(
        f"{len(facts) - len(noteworthy)} of {len(facts)} migrations carry no "
        "loader-relevant statement (pure Prisma bookkeeping) and are omitted."
    )
    lines.append("")
    for f in noteworthy:
        lines.append(f"=== `{f.name}`")
        lines.append("")
        if f.created_tables:
            lines.append(f"* New tables: {_li(sorted(set(f.created_tables)))}")
        if f.created_sequences:
            lines.append(f"* New sequences: {_li(sorted(set(f.created_sequences)))}")
        if f.inserts:
            tables = sorted(set(f.inserts))
            lines.append(f"* Seeds into ({len(f.inserts)} rows): {_li(tables)}")
        if f.added_columns:
            lines.append(f"* Added columns: {_li(sorted(set(f.added_columns)))}")
        if f.set_not_null:
            lines.append(f"* Set NOT NULL: {_li(sorted(set(f.set_not_null)))}")
        if f.set_default:
            lines.append(f"* Set DEFAULT: {_li(sorted(set(f.set_default)))}")
        if f.drop_default:
            lines.append(f"* Drop DEFAULT: {_li(sorted(set(f.drop_default)))}")
        if f.checks:
            lines.append(f"* New CHECK constraints: {_li(sorted(set(f.checks)))}")
        if f.backfills:
            join = f" ({f.backfill_joins} join-derived)" if f.backfill_joins else ""
            lines.append(f"* Backfills: {f.backfills}{join}")
        if f.deletes:
            lines.append(f"* Deletes from: {_li(sorted(set(f.deletes)))}")
        if f.triggers_disabled:
            lines.append(
                "* Triggers toggled during backfill: "
                f"{_li(sorted(set(f.triggers_disabled)))}"
            )
        if f.risky:
            lines.append(f"* WARNING -- conflict/merge/upsert seen: {_li(f.risky)}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Diff mode (operator aid; not committed)
# --------------------------------------------------------------------------- #
def diff_against(current: list[MigrationFacts], old_sha: str) -> int:
    old_path = PRISMA_CACHE_DIR / f"{old_sha}.sql"
    if not old_path.exists():
        print(f"no cached DDL at {old_path}", file=sys.stderr)
        return 1
    old = parse_ddl(old_path.read_text(encoding="utf-8"))
    old_names = {f.name for f in old}
    added = [f for f in current if f.name not in old_names]
    removed = sorted(old_names - {f.name for f in current})
    print(f"=== Prisma DDL delta vs {old_sha[:12]} ===")
    print(f"added migrations: {len(added)}  removed: {len(removed)}")
    for name in removed:
        print(f"  - removed: {name}")
    for f in added:
        print(f"  + {f.name}")
        if f.created_tables:
            print(f"      tables:   {sorted(set(f.created_tables))}")
        if f.added_columns:
            print(f"      columns:  {sorted(set(f.added_columns))}")
        if f.set_not_null:
            print(f"      not-null: {sorted(set(f.set_not_null))}")
        if f.checks:
            print(f"      checks:   {sorted(set(f.checks))}")
        if f.created_sequences:
            print(f"      seqs:     {sorted(set(f.created_sequences))}")
        if f.risky:
            print(f"      RISKY:    {f.risky}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--against", metavar="SHA", help="diff current pin vs a cached SHA (stdout)")
    p.add_argument("--check", action="store_true", help="fail if committed output is stale")
    args = p.parse_args(argv)

    ddl_path = resolve_ddl_path()
    pin = ddl_path.stem
    facts = parse_ddl(ddl_path.read_text(encoding="utf-8"))

    if args.against:
        return diff_against(facts, args.against)

    out = render(facts, pin)
    if args.check:
        existing = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if existing != out:
            print(f"{OUTPUT} is stale; run docs/tools/prisma_migration_analysis.py", file=sys.stderr)
            return 1
        print(f"{OUTPUT.name} OK")
        return 0
    OUTPUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
