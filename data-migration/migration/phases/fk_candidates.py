"""Generate FK candidates from mysql_raw column naming + Prisma FKs + manual overrides.

The original MySQL schema has no declared foreign keys; this module
reconstructs them in three layers, each one informing the next:

1. `scripts/generate_fk_candidates.sql` runs against `mysql_raw` and infers
   candidate `(from_table, from_column) -> (to_table, to_column)` pairs from
   column-naming conventions (e.g. `state_id` looking like a reference to a
   `*_rfrnc` table). It returns rows shaped as
   `(from_table_qual, from_column, to_table, to_column, confidence, notes)`.

2. Prisma back-translation walks every declared `demos_app.*` FK back through
   `reports/source_target_columns.csv` to produce a high-confidence MySQL FK
   candidate. Prisma is the declarative source of truth for the post-migration
   schema; if Prisma says `demos_app.X.col -> demos_app.Y.col`, the
   corresponding MySQL FK is what we want. This layer has two inputs:

   * The cached `.prisma` model files (fetched + pinned by
     `migrate fetch-prisma-schema`). Their `@relation` directives are the
     *declarative* source -- they carry composite keys and relation names, and
     are readable without first applying any DDL. This is the primary input.
   * `state/prisma_fks.json`, the FKs captured from `pg_constraint` after
     `migrate ddl` applies the compiled SQL. This is kept as a cross-check
     (does each declarative relation actually compile to a constraint?) and as
     the *only* source for Prisma implicit many-to-many relations, which
     compile to hidden join tables with no explicit `@relation` field.

   The `notes` column records the relation name and the cross-check verdict
   (`pg_constraint: confirmed` / `missing`); composite relations emit one row
   per column-pair tagged `composite i/N`.

3. `reports/inputs/fk_overrides.yaml` is the human-curated patch layer (highest
   priority). Each entry identifies a `(from_table, from_column)` pair and
   replaces the inference with operator judgment.

This script writes the merged result to `reports/generated/fk_candidates.csv` with
two cross-validation columns:

* `source` -- which layer produced the row (`sql` | `prisma` | `override`).
* `prisma_status` -- agreement with Prisma when both layers fired
  (`confirmed`, `conflict`, `prisma_only`, `sql_only`, or empty when no
  Prisma data was loaded).

Why three layers instead of editing the CSV directly?
  - The SQL re-runs whenever `mysql_raw` is reloaded (drop list changes,
    new dress rehearsal, etc.); rerunning it would clobber any manual
    edits made directly to the CSV.
  - Prisma back-translation re-runs whenever `state/prisma_fks.json` is
    refreshed (each `migrate ddl`); the cross-validation surface is
    automatically up to date.
  - Overrides live in YAML, which round-trips cleanly through git review.

Stale overrides (entries whose `(from_table, from_column)` doesn't match
any candidate row) are surfaced as a `WARNING` log line at the end of
the run so they can be pruned.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass

import yaml

from migration.lib import (
    PRISMA_FKS_FILE,
    REPORTS_DIR,
    ROOT_DIR,
    Env,
    log,
    psql_query,
    rel,
)
from migration.phases.fetch_prisma_schema import load_prisma_schema_text
from migration.prisma_schema import parse_prisma_schema

GEN_SQL_PATH = ROOT_DIR / "scripts" / "generate_fk_candidates.sql"
OVERRIDES_PATH = REPORTS_DIR / "inputs" / "fk_overrides.yaml"
SOURCE_TARGET_PATH = REPORTS_DIR / "source_target_columns.csv"
OUT_CSV = REPORTS_DIR / "generated" / "fk_candidates.csv"

# Quoted-or-bare identifier; covers `name`, `"name"`, and `"weird""name"`.
_IDENT = r'(?:"(?:[^"]|"")+"|\w+)'

# `pg_get_constraintdef` shape for FOREIGN KEYs:
#   FOREIGN KEY (col[, ...]) REFERENCES [schema.]table (col[, ...]) [ON ...]
_FK_DEF_RE = re.compile(
    r"^FOREIGN\s+KEY\s*\(\s*(?P<from_cols>[^)]+?)\s*\)\s+"
    rf"REFERENCES\s+(?:(?P<to_schema>{_IDENT})\.)?(?P<to_table>{_IDENT})"
    r"\s*\(\s*(?P<to_cols>[^)]+?)\s*\)",
    re.IGNORECASE,
)


def _load_overrides() -> dict[tuple[str, str], dict[str, str]]:
    """Load ``fk_overrides.yaml`` and key it by ``(from_table, from_column)``.

    The YAML schema is::

        overrides:
          - from_table: mysql_raw.mdcd_demo
            from_column: state_id
            to_table: geo_ansi_state_rfrnc
            to_column: state_id
            confidence: HIGH
            notes: 'Manual: digraph confirms FK to state ref table'

    Returns an empty dict when the file does not exist.
    """
    if not OVERRIDES_PATH.exists():
        return {}
    raw = yaml.safe_load(OVERRIDES_PATH.read_text(encoding="utf-8")) or {}
    out: dict[tuple[str, str], dict[str, str]] = {}
    for entry in raw.get("overrides", []):
        key = (entry["from_table"], entry["from_column"])
        out[key] = entry
    return out


def _unquote(name: str) -> str:
    """Strip outer double-quotes and undouble embedded ``""`` if quoted."""
    if name.startswith('"') and name.endswith('"') and len(name) >= 2:
        return name[1:-1].replace('""', '"')
    return name


def _split_cols(s: str) -> list[str]:
    """Split a parenthesized identifier list, respecting quoted identifiers.

    Handles the rare case where a quoted identifier contains a literal
    comma; bare identifiers cannot. Embedded ``""`` inside a quoted run
    stays paired up with the surrounding quotes.
    """
    out: list[str] = []
    cur: list[str] = []
    in_q = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == '"':
            cur.append(c)
            if in_q and i + 1 < len(s) and s[i + 1] == '"':
                # Doubled `""` inside a quoted identifier: keep both, stay quoted.
                cur.append(s[i + 1])
                i += 2
                continue
            in_q = not in_q
        elif c == "," and not in_q:
            out.append(_unquote("".join(cur).strip()))
            cur = []
        else:
            cur.append(c)
        i += 1
    tail = "".join(cur).strip()
    if tail:
        out.append(_unquote(tail))
    return out


@dataclass(frozen=True)
class ParsedFK:
    """Structured form of a ``pg_get_constraintdef`` FOREIGN KEY clause."""

    from_columns: list[str]
    to_schema: str | None
    to_table: str
    to_columns: list[str]


def _parse_fk_definition(defn: str) -> ParsedFK | None:
    """Parse a ``pg_get_constraintdef`` FOREIGN KEY clause.

    Returns ``None`` when ``defn`` is not a recognizable FOREIGN KEY
    clause; ``to_schema`` is ``None`` when the definition omits it.
    """
    m = _FK_DEF_RE.match(defn.strip().rstrip(";"))
    if not m:
        return None
    return ParsedFK(
        from_columns=_split_cols(m.group("from_cols")),
        to_schema=_unquote(m.group("to_schema")) if m.group("to_schema") else None,
        to_table=_unquote(m.group("to_table")),
        to_columns=_split_cols(m.group("to_cols")),
    )


def _load_st_index() -> dict[tuple[str, str], list[tuple[str, str, str]]]:
    """Reverse-index ``source_target_columns.csv`` by ``(demos_table, demos_column)``.

    Each entry maps to a list of ``(mysql_table, mysql_column, transform)``
    tuples; multiple MySQL columns can target the same DEMOS column
    (e.g. comment routing splits one source column across two targets).
    Rows whose ``demos_table`` is empty (drop-list rows) are skipped.
    """
    out: dict[tuple[str, str], list[tuple[str, str, str]]] = {}
    if not SOURCE_TARGET_PATH.exists():
        return out
    with SOURCE_TARGET_PATH.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            demos_table = (row.get("demos_table") or "").strip()
            demos_column = (row.get("demos_column") or "").strip()
            if not demos_table or not demos_column:
                continue
            mysql_table = (row.get("mysql_table") or "").strip()
            mysql_column = (row.get("mysql_column") or "").strip()
            transform = (row.get("transform") or "").strip()
            if not mysql_table or not mysql_column:
                continue
            out.setdefault((demos_table, demos_column), []).append(
                (mysql_table, mysql_column, transform)
            )
    return out


@dataclass(frozen=True)
class DemosFK:
    """One single-column FK edge in ``demos_app`` naming, with provenance.

    Composite relations are flattened into one :class:`DemosFK` per
    column-pair; ``part`` / ``parts`` carry the ``i/N`` position so the back-
    translation can tag the emitted rows.
    """

    from_table: str
    from_column: str
    to_table: str
    to_column: str
    relation: str
    part: int
    parts: int


def _flatten_pair(
    from_table: str,
    from_cols: list[str],
    to_table: str,
    to_cols: list[str],
    relation: str,
) -> list[DemosFK]:
    """Flatten a (possibly composite) FK into one :class:`DemosFK` per column."""
    n = min(len(from_cols), len(to_cols))
    return [
        DemosFK(
            from_table=from_table,
            from_column=from_cols[k],
            to_table=to_table,
            to_column=to_cols[k],
            relation=relation,
            part=k + 1,
            parts=n,
        )
        for k in range(n)
    ]


def _prisma_demos_fks() -> list[DemosFK]:
    """Demos-level FK edges from the cached ``.prisma`` model files.

    Returns an empty list when the schema cache is absent (the operator has
    not run ``migrate fetch-prisma-schema``) or contains no resolvable
    relations.
    """
    text = load_prisma_schema_text()
    if text is None:
        log("no cached .prisma model files; run `migrate fetch-prisma-schema`")
        return []
    schema = parse_prisma_schema(text)
    out: list[DemosFK] = []
    for rln in schema.resolved_relations():
        out.extend(
            _flatten_pair(
                rln.from_table,
                rln.from_columns,
                rln.to_table,
                rln.to_columns,
                rln.name or "",
            )
        )
    return out


def _pg_demos_fks() -> list[DemosFK]:
    """Demos-level FK edges captured from ``pg_constraint`` (``prisma_fks.json``).

    These are the FKs the compiled SQL actually produced. Used to cross-check
    the declarative ``.prisma`` relations and to recover implicit
    many-to-many join-table FKs that have no explicit ``@relation`` field.
    """
    if not PRISMA_FKS_FILE.exists():
        return []
    try:
        fks = json.loads(PRISMA_FKS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        log(f"WARNING: {rel(PRISMA_FKS_FILE)} is not valid JSON ({e}); skipping")
        return []
    if not isinstance(fks, list):
        log(
            f"WARNING: {rel(PRISMA_FKS_FILE)} is malformed (expected a list); "
            "skipping pg_constraint cross-check"
        )
        return []
    out: list[DemosFK] = []
    for fk in fks:
        if not isinstance(fk, dict):
            continue
        from_table = str(fk.get("table", ""))
        parsed = _parse_fk_definition(str(fk.get("definition", "")))
        if parsed is None or not from_table:
            continue
        out.extend(
            _flatten_pair(
                from_table,
                parsed.from_columns,
                parsed.to_table,
                parsed.to_columns,
                str(fk.get("name", "")),
            )
        )
    return out


def _back_translate(
    edge: DemosFK,
    st_index: dict[tuple[str, str], list[tuple[str, str, str]]],
    note: str,
) -> list[dict[str, str]]:
    """Walk one demos-level FK edge back to MySQL candidate rows.

    Emits one row per ``(source-side mapping, target-side mapping)`` pair found
    in ``source_target_columns.csv``; an edge with no mapping on either side
    yields nothing.
    """
    from_sources = st_index.get((edge.from_table, edge.from_column), [])
    to_sources = st_index.get((edge.to_table, edge.to_column), [])
    if not from_sources or not to_sources:
        return []
    rows: list[dict[str, str]] = []
    for m_from_table, m_from_col, m_from_xform in from_sources:
        for m_to_table, m_to_col, _m_to_xform in to_sources:
            row_note = note
            if edge.parts > 1:
                row_note += f" composite {edge.part}/{edge.parts}"
            if m_from_xform.startswith(("crosswalk:", "tag_pivot:")):
                row_note += f" ({m_from_xform})"
            rows.append(
                {
                    "from_table_qual": f"mysql_raw.{m_from_table}",
                    "from_column": m_from_col,
                    "to_table": m_to_table,
                    "to_column": m_to_col,
                    "confidence": "HIGH",
                    "notes": row_note,
                }
            )
    return rows


def _prisma_back_translation() -> list[dict[str, str]]:
    """Translate declarative Prisma relations into MySQL FK candidates.

    The primary input is the cached ``.prisma`` model files; their
    ``@relation`` directives (including composites) are walked back through
    ``reports/source_target_columns.csv``. Each candidate is cross-checked
    against the ``pg_constraint`` capture (``state/prisma_fks.json``) and the
    verdict folded into ``notes``. FKs that exist only in ``pg_constraint``
    (Prisma implicit many-to-many join tables) are back-translated too and
    tagged as such.
    """
    if not SOURCE_TARGET_PATH.exists():
        log(f"no {rel(SOURCE_TARGET_PATH)}; skipping Prisma back-translation")
        return []

    prisma_edges = _prisma_demos_fks()
    pg_edges = _pg_demos_fks()
    if not prisma_edges and not pg_edges:
        return []

    st_index = _load_st_index()
    pg_keys = {
        (e.from_table, e.from_column, e.to_table, e.to_column) for e in pg_edges
    }
    prisma_keys = {
        (e.from_table, e.from_column, e.to_table, e.to_column) for e in prisma_edges
    }

    out: list[dict[str, str]] = []
    skipped_unmapped = 0

    for edge in prisma_edges:
        key = (edge.from_table, edge.from_column, edge.to_table, edge.to_column)
        verdict = "confirmed" if key in pg_keys else "missing"
        note = f"prisma:{edge.relation}; pg_constraint: {verdict}"
        rows = _back_translate(edge, st_index, note)
        if not rows:
            skipped_unmapped += 1
            continue
        out.extend(rows)

    # FKs present only in pg_constraint: Prisma implicit m2m join tables that
    # have no explicit @relation field, so .prisma cannot surface them.
    pg_only = 0
    for edge in pg_edges:
        key = (edge.from_table, edge.from_column, edge.to_table, edge.to_column)
        if key in prisma_keys:
            continue
        note = f"prisma:{edge.relation}; pg_constraint only (implicit relation)"
        rows = _back_translate(edge, st_index, note)
        if not rows:
            skipped_unmapped += 1
            continue
        out.extend(rows)
        pg_only += 1

    if skipped_unmapped:
        log(f"  skipped {skipped_unmapped} Prisma FK edge(s) without source-target mapping")
    if pg_only:
        log(f"  recovered {pg_only} pg_constraint-only FK edge(s) (implicit relations)")
    return out


def _empty_entry(key: tuple[str, str]) -> dict[str, str]:
    return {
        "from_table_qual": key[0],
        "from_column": key[1],
        "to_table": "",
        "to_column": "",
        "confidence": "",
        "notes": "",
        "source": "",
        "prisma_status": "",
    }


def run_generate_fk_candidates() -> None:
    """Regenerate ``reports/generated/fk_candidates.csv`` from the three-layer merge.

    Runs ``scripts/generate_fk_candidates.sql`` against ``mysql_raw``,
    overlays Prisma back-translation (from the cached ``.prisma`` model files,
    cross-checked against ``state/prisma_fks.json``, when
    ``reports/source_target_columns.csv`` is present), then applies
    ``reports/inputs/fk_overrides.yaml``. Writes the merged result with
    ``source`` and ``prisma_status`` columns. Stale overrides (no
    matching candidate row) are logged as a ``WARNING``.
    """
    env = Env.load()
    sql = GEN_SQL_PATH.read_text(encoding="utf-8")

    log("running FK candidate scanner")
    sql_rows = psql_query(env, sql)

    prisma_candidates = _prisma_back_translation()
    if prisma_candidates:
        log(
            f"loaded {len(prisma_candidates)} candidate(s) "
            "from Prisma relations via source-target mapping"
        )

    overrides = _load_overrides()
    if overrides:
        log(f"applying {len(overrides)} manual overrides from {OVERRIDES_PATH.name}")

    merged: dict[tuple[str, str], dict[str, str]] = {}

    # Layer 1: SQL inference.
    for r in sql_rows:
        key = (str(r[0] or ""), str(r[1] or ""))
        if not key[0] or not key[1]:
            continue
        merged[key] = {
            "from_table_qual": key[0],
            "from_column": key[1],
            "to_table": str(r[2] or ""),
            "to_column": str(r[3] or ""),
            "confidence": str(r[4] or "LOW"),
            "notes": str(r[5] or ""),
            "source": "sql",
            "prisma_status": "",
        }

    # Layer 2: Prisma back-translation. Prisma is the declarative source of
    # truth: when both layers fire, Prisma's target wins and the SQL guess is
    # recorded in `notes` for review.
    for cand in prisma_candidates:
        key = (cand["from_table_qual"], cand["from_column"])
        if key in merged:
            existing = merged[key]
            sql_to = (existing["to_table"], existing["to_column"])
            prisma_to = (cand["to_table"], cand["to_column"])
            status = "confirmed" if sql_to == prisma_to else "conflict"
            note = cand["notes"]
            if status == "conflict":
                note = f"{note}; sql inferred {sql_to[0]}.{sql_to[1]}"
            existing.update(
                {
                    "to_table": cand["to_table"],
                    "to_column": cand["to_column"],
                    "confidence": "HIGH",
                    "notes": note,
                    "source": "prisma",
                    "prisma_status": status,
                }
            )
        else:
            merged[key] = {
                **cand,
                "source": "prisma",
                "prisma_status": "prisma_only",
            }

    # Mark SQL-only rows when we actually had Prisma data to compare against.
    if prisma_candidates:
        for entry in merged.values():
            if entry["source"] == "sql":
                entry["prisma_status"] = "sql_only"

    # Layer 3: YAML overrides (highest priority). Overrides may match a row
    # produced by either prior layer or pre-create one if neither layer fired.
    for key in list(overrides.keys()):
        ovr = overrides[key]
        existing = merged.get(key) or _empty_entry(key)
        existing.update(
            {
                "to_table": str(ovr.get("to_table", existing["to_table"])),
                "to_column": str(ovr.get("to_column", existing["to_column"])),
                "confidence": str(ovr.get("confidence", existing["confidence"] or "LOW")),
                "notes": str(ovr.get("notes", existing["notes"] or "(override)")),
                "source": "override",
            }
        )
        if key not in merged:
            # An override that matched neither SQL nor Prisma: still emit it,
            # but flag it so the operator notices.
            merged[key] = existing
            del overrides[key]
            log(f"  override {key} matched no SQL/Prisma row; emitting as override-only")
        else:
            merged[key] = existing
            del overrides[key]

    # Write the merged CSV (sorted for review-friendly diffs).
    with OUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "from_table_qual",
                "from_column",
                "to_table",
                "to_column",
                "confidence",
                "notes",
                "source",
                "prisma_status",
            ]
        )
        for key in sorted(merged.keys()):
            e = merged[key]
            w.writerow(
                [
                    e["from_table_qual"],
                    e["from_column"],
                    e["to_table"],
                    e["to_column"],
                    e["confidence"],
                    e["notes"],
                    e["source"],
                    e["prisma_status"],
                ]
            )

    if overrides:
        log(f"WARNING: {len(overrides)} overrides did not match any candidate row:")
        for k in overrides:
            log(f"  {k}")

    if prisma_candidates:
        confirmed = sum(1 for e in merged.values() if e["prisma_status"] == "confirmed")
        conflict = sum(1 for e in merged.values() if e["prisma_status"] == "conflict")
        prisma_only = sum(1 for e in merged.values() if e["prisma_status"] == "prisma_only")
        sql_only = sum(1 for e in merged.values() if e["prisma_status"] == "sql_only")
        log(
            f"prisma cross-validation: {confirmed} confirmed, {conflict} conflict, "
            f"{prisma_only} prisma-only, {sql_only} sql-only"
        )

    log(f"wrote {rel(OUT_CSV)}")
