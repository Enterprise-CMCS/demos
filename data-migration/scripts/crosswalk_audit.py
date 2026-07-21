#!/usr/bin/env python3
"""Audit the codebase's crosswalk assumptions against the *live* PROD MySQL.

The ``sql/04_crosswalks/*_check.sql`` completeness checks fail closed, but only
against ``mysql_raw`` -- the post-load snapshot. The captured
``reports/reference_data/*.csv`` lookups are a point-in-time dump. Neither tells
you whether the committed crosswalks still agree with the *current* source. This
script closes that gap: it reads each crosswalk's source metadata from
``reports/crosswalks/registry.yaml`` and compares the committed crosswalk CSVs
against the live source MySQL (attached READ_ONLY through DuckDB, the same
conduit ``schema-snapshot`` and ``load-fidelity`` use), reporting per crosswalk:

* completeness  -- live legacy codes that the crosswalk does NOT map (the
  load-blocking concern; mirrors the ``*_check.sql`` ``EXCEPT`` exactly);
* orphans       -- crosswalk codes absent from the live ``*_rfrnc`` lookup;
* label drift   -- crosswalk ``legacy_name`` vs the live ``*_rfrnc`` name;
* volume        -- live row count per code, sized all-rows and ``dltd_ind = 0``;
* snapshot drift-- live ``*_rfrnc`` vs the committed Jun-snapshot CSV.

The two table-driven crosswalks (``demonstration_role``, ``pgm_dtl_tag``) audit
structurally instead: the named source tables and per-row date/source columns
must exist in the live source.

Outputs ``reports/runs/crosswalk_audit_<stamp>.md`` + ``reports/generated/crosswalk_audit_manifest.json`` and the
committed AsciiDoc fragments under ``docs/shared/generated/live/`` that the wiki
page includes. Informational by default (exit 0); ``--strict`` exits non-zero
when a *blocking* finding exists (an unmapped live code, or a missing source
table/column).

Security: the source DSN is built in-process via ``_mysql_attach_dsn`` and the
ATTACH is wrapped so only the exception *type* can surface -- the password never
lands in a log or traceback. The source is attached READ_ONLY.

NOTE: this needs live PROD access, which CI does not have, so the generated
fragments are operator-refreshed artifacts -- they are NOT regenerated or
drift-checked in CI (unlike ``scripts/derivability_audit.py``, which reads only
committed snapshots).

Run from the repo root::

    uv run python scripts/crosswalk_audit.py [--strict]
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Any

import yaml

if TYPE_CHECKING:
    import duckdb

from migration.lib import (
    REPORTS_DIR,
    ROOT_DIR,
    RUNS_DIR,
    Env,
    die,
    file_stamp,
    log,
    rel,
    ts,
)
from migration.phases.schema_snapshot import _mysql_attach_dsn, _passthrough

REGISTRY_FILE: Path = REPORTS_DIR / "crosswalks" / "registry.yaml"
REFERENCE_DATA_DIR: Path = REPORTS_DIR / "reference_data"
FRAGMENT_DIR: Path = ROOT_DIR / "docs" / "shared" / "generated" / "live"

_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _safe_ident(name: str, what: str) -> str:
    """Return ``name`` when it is a bare SQL identifier, else die.

    Identifiers are inlined into the MySQL passthrough SQL (DuckDB's
    ``mysql_query`` takes no bind parameters), so every table/column name -- even
    though it comes from repo-controlled YAML/CSV, not user input -- is validated
    against ``[A-Za-z_][A-Za-z0-9_]*`` before interpolation.
    """
    if not _SAFE_IDENTIFIER.match(name or ""):
        die(f"unsafe {what} identifier in crosswalk registry: {name!r}")
    return name


def _norm_code(value: Any) -> str | None:
    """Normalize a legacy code to a comparable string.

    MySQL integer columns come back as ``int``; the crosswalk CSV stores the same
    code as text. Integral floats/decimals (``1.0``) collapse to ``"1"`` so they
    compare equal to the CSV's ``"1"``; everything else is the stripped string.
    ``None`` (SQL NULL) stays ``None`` and is dropped by callers.
    """
    if value is None:
        return None
    if isinstance(value, bool):
        return str(int(value))
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return str(int(value)) if value.is_integer() else str(value)
    text = str(value).strip()
    return text or None


def _norm_name(name: str | None) -> str:
    """Collapse whitespace and casefold for a tolerant label comparison.

    Mirrors the trimmed, case-insensitive match the ``*_check.sql`` name guards
    use (e.g. ``43_role_person_type_check.sql``).
    """
    return " ".join((name or "").split()).casefold()


@dataclass(frozen=True)
class CodeAudit:
    """Result of auditing one value/code crosswalk against the live source."""

    name: str
    has_dltd_ind: bool
    unmapped_all: list[str]  # live codes (all rows) with no crosswalk row -- blocking
    unmapped_active: list[str]  # live codes (dltd_ind = 0) with no crosswalk row
    orphans: list[str]  # crosswalk codes absent from the live *_rfrnc inventory
    label_drift: list[tuple[str, str, str]]  # (code, crosswalk_name, live_name)
    volumes: list[tuple[str, int, int]]  # (code, count_all, count_active)
    snapshot_added: list[str]  # codes in live *_rfrnc but not the snapshot CSV
    snapshot_removed: list[str]  # codes in the snapshot CSV but not live
    snapshot_renamed: list[tuple[str, str, str]]  # (code, snapshot_name, live_name)
    deferred: bool = False  # source fact table absent from live (mirrors to_regclass no-op)

    @property
    def blocking(self) -> bool:
        return bool(self.unmapped_all)


@dataclass(frozen=True)
class StructuralAudit:
    """Result of auditing one table-driven crosswalk against the live source."""

    name: str
    missing_tables: list[str]  # named source tables absent from the live source
    missing_columns: list[tuple[str, str]]  # (table, column) named but absent
    volumes: list[tuple[str, int, int]]  # (table, count_all, count_active)
    pending_rows: list[str]  # source tables whose mapping is SME-pending (blank tag)

    @property
    def blocking(self) -> bool:
        return bool(self.missing_tables or self.missing_columns)


def audit_code_crosswalk(
    *,
    name: str,
    crosswalk: dict[str, str],
    live_fact_all: set[str],
    live_fact_active: set[str],
    live_rfrnc: dict[str, str],
    snapshot_rfrnc: dict[str, str],
    volumes: dict[str, tuple[int, int]],
    has_dltd_ind: bool,
) -> CodeAudit:
    """Pure comparison for a code crosswalk (no DB access).

    ``crosswalk`` / ``live_rfrnc`` / ``snapshot_rfrnc`` map normalized code ->
    name; ``live_fact_*`` are the distinct codes actually present in the source
    fact column; ``volumes`` maps code -> (all_rows, active_rows). Sorting every
    output keeps the report and fragments byte-stable across reruns.
    """
    cw_codes = set(crosswalk)
    unmapped_all = sorted(live_fact_all - cw_codes, key=_sort_key)
    unmapped_active = sorted(live_fact_active - cw_codes, key=_sort_key)
    orphans = sorted(cw_codes - set(live_rfrnc), key=_sort_key)

    label_drift: list[tuple[str, str, str]] = []
    for code in sorted(cw_codes & set(live_rfrnc), key=_sort_key):
        cw_name = crosswalk[code]
        live_name = live_rfrnc[code]
        if _norm_name(cw_name) != _norm_name(live_name):
            label_drift.append((code, cw_name, live_name))

    snapshot_added = sorted(set(live_rfrnc) - set(snapshot_rfrnc), key=_sort_key)
    snapshot_removed = sorted(set(snapshot_rfrnc) - set(live_rfrnc), key=_sort_key)
    snapshot_renamed: list[tuple[str, str, str]] = []
    for code in sorted(set(live_rfrnc) & set(snapshot_rfrnc), key=_sort_key):
        if _norm_name(snapshot_rfrnc[code]) != _norm_name(live_rfrnc[code]):
            snapshot_renamed.append((code, snapshot_rfrnc[code], live_rfrnc[code]))

    vol_rows = sorted(
        ((c, a, b) for c, (a, b) in volumes.items()), key=lambda r: _sort_key(r[0])
    )
    return CodeAudit(
        name=name,
        has_dltd_ind=has_dltd_ind,
        unmapped_all=unmapped_all,
        unmapped_active=unmapped_active,
        orphans=orphans,
        label_drift=label_drift,
        volumes=vol_rows,
        snapshot_added=snapshot_added,
        snapshot_removed=snapshot_removed,
        snapshot_renamed=snapshot_renamed,
    )


def _sort_key(code: str) -> tuple[int, float, str]:
    """Order codes numerically when integral, else lexically; stable + total."""
    try:
        return (0, float(code), "")
    except ValueError:
        return (1, 0.0, code)


@dataclass(frozen=True)
class StructuralRow:
    """One row of a table-driven crosswalk: a source table and the columns
    (per ``columns_from``) that must exist on it, plus whether it is SME-pending."""

    table: str
    columns: tuple[str, ...]
    pending: bool


def audit_structural_crosswalk(
    *,
    name: str,
    rows: list[StructuralRow],
    live_tables: set[str],
    live_columns: dict[str, set[str]],
    volumes: dict[str, tuple[int, int]],
) -> StructuralAudit:
    """Pure comparison for a table-driven crosswalk (no DB access).

    ``live_tables`` is the source's base-table inventory; ``live_columns`` maps a
    present table to its column set; ``volumes`` maps table -> (all, active).
    """
    missing_tables = sorted({r.table for r in rows if r.table not in live_tables})
    missing_columns: set[tuple[str, str]] = set()
    for r in rows:
        if r.table not in live_tables:
            continue
        present = live_columns.get(r.table, set())
        for col in r.columns:
            if col and col not in present:
                missing_columns.add((r.table, col))
    pending_rows = sorted({r.table for r in rows if r.pending})
    vol_rows = sorted(
        ((t, a, b) for t, (a, b) in volumes.items()), key=lambda r: r[0]
    )
    return StructuralAudit(
        name=name,
        missing_tables=missing_tables,
        missing_columns=sorted(missing_columns),
        volumes=vol_rows,
        pending_rows=pending_rows,
    )


@dataclass(frozen=True)
class CrosswalkSpec:
    """A registry entry with its audit ``source:`` metadata resolved."""

    name: str
    csv: str
    kind: str  # "code" | "structural" | "" (no source block -> skipped)
    source: dict[str, Any] = field(default_factory=dict)


def load_registry(path: Path = REGISTRY_FILE) -> list[CrosswalkSpec]:
    """Parse ``registry.yaml`` into specs, carrying each ``source:`` block.

    Entries without a ``source:`` block are returned with ``kind == ""`` so the
    caller can report them as un-audited rather than silently dropping them.
    """
    if not path.exists():
        die(f"crosswalk registry missing: {rel(path)}")
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    entries = data.get("crosswalks") or []
    if not entries:
        die(f"crosswalk registry has no entries: {rel(path)}")
    specs: list[CrosswalkSpec] = []
    for e in entries:
        source = e.get("source") or {}
        specs.append(
            CrosswalkSpec(
                name=str(e["table"]),
                csv=str(e["csv"]),
                kind=str(source.get("kind", "")),
                source=source,
            )
        )
    return specs


def _read_csv_rows(csv_path: Path) -> tuple[list[str], list[dict[str, str]]]:
    """Return ``(header, rows)`` for a committed CSV; die if missing/headerless."""
    if not csv_path.exists():
        die(f"crosswalk audit: CSV not found: {rel(csv_path)}")
    with csv_path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            die(f"crosswalk audit: CSV has no header: {rel(csv_path)}")
        return list(reader.fieldnames), list(reader)


def read_crosswalk(csv_path: Path, code_col: str, name_col: str) -> dict[str, str]:
    """Read a code crosswalk CSV into ``{normalized_code: name}``.

    Blank code cells are skipped (a deliberately blank mapping is not a code).
    """
    header, rows = _read_csv_rows(csv_path)
    for col in (code_col, name_col):
        if col not in header:
            die(f"crosswalk audit: {rel(csv_path)} missing column {col!r}")
    out: dict[str, str] = {}
    for r in rows:
        code = _norm_code(r.get(code_col))
        if code is None:
            continue
        out[code] = (r.get(name_col) or "").strip()
    return out


def read_rfrnc_csv(
    csv_path: Path, code_col: str, name_col: str, subset: set[str] | None
) -> dict[str, str]:
    """Read a captured ``*_rfrnc`` snapshot CSV into ``{normalized_code: name}``."""
    header, rows = _read_csv_rows(csv_path)
    for col in (code_col, name_col):
        if col not in header:
            die(f"crosswalk audit: {rel(csv_path)} missing column {col!r}")
    out: dict[str, str] = {}
    for r in rows:
        code = _norm_code(r.get(code_col))
        if code is None or (subset is not None and code not in subset):
            continue
        out[code] = (r.get(name_col) or "").strip()
    return out


def read_structural_rows(spec: CrosswalkSpec) -> list[StructuralRow]:
    """Read a table-driven crosswalk CSV into :class:`StructuralRow` records."""
    csv_path = REPORTS_DIR / spec.csv
    table_col = str(spec.source["tables_from_column"])
    column_fields = [str(c) for c in spec.source.get("columns_from", [])]
    pending_col = spec.source.get("pending_blank_column")
    header, rows = _read_csv_rows(csv_path)
    for col in [table_col, *column_fields] + ([pending_col] if pending_col else []):
        if col not in header:
            die(f"crosswalk audit: {rel(csv_path)} missing column {col!r}")
    out: list[StructuralRow] = []
    for r in rows:
        table = (r.get(table_col) or "").strip()
        if not table:
            continue
        cols = tuple((r.get(cf) or "").strip() for cf in column_fields)
        pending = bool(pending_col) and not (r.get(pending_col) or "").strip()
        out.append(StructuralRow(table=table, columns=cols, pending=pending))
    return out


# --------------------------------------------------------------------------- #
# Live layer: every query runs through DuckDB's mysql_query passthrough against
# the READ_ONLY-attached source. Exercised in the integration tier, not the unit
# suite. Identifiers are validated by _safe_ident before interpolation.
# --------------------------------------------------------------------------- #


def _subset_clause(column: str, subset: list[int] | None) -> str:
    """Return ``AND <column> IN (...)`` for a code subset, or ``""``.

    Subset values must be integers (the only crosswalk using a subset is
    ``system_role`` over role codes ``{1, 4}``); a non-int is a registry error.
    """
    if not subset:
        return ""
    for v in subset:
        if not isinstance(v, int):
            die(f"crosswalk audit: code_subset must be integers, got {v!r}")
    return f" AND {column} IN ({', '.join(str(int(v)) for v in subset)})"


def _attach_source(con: duckdb.DuckDBPyConnection, env: Env) -> None:
    """Attach the source MySQL READ_ONLY; never let the DSN reach a traceback."""
    con.execute("INSTALL mysql_scanner; LOAD mysql_scanner;")
    dsn = _mysql_attach_dsn(env.mysql_url, env.mysql_db).replace("'", "''")
    try:
        con.execute(f"ATTACH '{dsn}' AS src (TYPE mysql, READ_ONLY)")
    except Exception as e:
        raise SystemExit(f"MySQL ATTACH failed: {type(e).__name__}") from None


def _live_base_tables(con: duckdb.DuckDBPyConnection) -> set[str]:
    """The source's base-table inventory (scoped to the attached database)."""
    _, rows = _passthrough(
        con,
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
    )
    return {str(r[0]) for r in rows}


def _live_columns(con: duckdb.DuckDBPyConnection, table: str) -> set[str]:
    """The column names of one source table."""
    _safe_ident(table, "table")
    _, rows = _passthrough(
        con,
        "SELECT column_name FROM information_schema.columns "
        f"WHERE table_schema = DATABASE() AND table_name = '{table}'",
    )
    return {str(r[0]) for r in rows}


def _distinct_codes(
    con: duckdb.DuckDBPyConnection,
    table: str,
    column: str,
    *,
    active_only: bool,
    subset: list[int] | None,
) -> set[str]:
    """Distinct non-NULL codes in ``table.column`` (optionally ``dltd_ind = 0``)."""
    _safe_ident(table, "table")
    _safe_ident(column, "column")
    where = f"{column} IS NOT NULL{_subset_clause(column, subset)}"
    if active_only:
        where += " AND dltd_ind = 0"
    _, rows = _passthrough(con, f"SELECT DISTINCT {column} FROM {table} WHERE {where}")
    return {c for c in (_norm_code(r[0]) for r in rows) if c is not None}


def _code_volumes(
    con: duckdb.DuckDBPyConnection,
    table: str,
    column: str,
    *,
    has_dltd_ind: bool,
    subset: list[int] | None,
) -> dict[str, tuple[int, int]]:
    """Per-code (all_rows, active_rows) counts for ``table.column``."""
    _safe_ident(table, "table")
    _safe_ident(column, "column")
    active_expr = (
        "SUM(CASE WHEN dltd_ind = 0 THEN 1 ELSE 0 END)" if has_dltd_ind else "COUNT(*)"
    )
    where = f"{column} IS NOT NULL{_subset_clause(column, subset)}"
    _, rows = _passthrough(
        con,
        f"SELECT {column} AS cd, COUNT(*) AS n_all, {active_expr} AS n_active "
        f"FROM {table} WHERE {where} GROUP BY {column}",
    )
    out: dict[str, tuple[int, int]] = {}
    for code, n_all, n_active in rows:
        norm = _norm_code(code)
        if norm is not None:
            out[norm] = (int(n_all or 0), int(n_active or 0))
    return out


def _live_rfrnc(
    con: duckdb.DuckDBPyConnection,
    table: str,
    code_col: str,
    name_col: str,
    subset: list[int] | None,
) -> dict[str, str]:
    """Read the live ``*_rfrnc`` inventory into ``{normalized_code: name}``."""
    _safe_ident(table, "table")
    _safe_ident(code_col, "rfrnc code column")
    _safe_ident(name_col, "rfrnc name column")
    where = f" WHERE {code_col} IS NOT NULL{_subset_clause(code_col, subset)}"
    _, rows = _passthrough(con, f"SELECT {code_col}, {name_col} FROM {table}{where}")
    out: dict[str, str] = {}
    for code, name in rows:
        norm = _norm_code(code)
        if norm is not None:
            out[norm] = (str(name).strip() if name is not None else "")
    return out


def _row_counts(
    con: duckdb.DuckDBPyConnection, table: str, *, has_dltd_ind: bool
) -> tuple[int, int]:
    """Return (all_rows, active_rows) for a source table."""
    _safe_ident(table, "table")
    active_expr = (
        "SUM(CASE WHEN dltd_ind = 0 THEN 1 ELSE 0 END)" if has_dltd_ind else "COUNT(*)"
    )
    _, rows = _passthrough(con, f"SELECT COUNT(*), {active_expr} FROM {table}")
    if not rows:
        return (0, 0)
    return (int(rows[0][0] or 0), int(rows[0][1] or 0))


def _deferred_code_audit(name: str) -> CodeAudit:
    """A code crosswalk whose source fact table is not (yet) in the live source.

    Mirrors the ``to_regclass(...) IS NULL`` NOTICE no-op in the ``*_check.sql``
    guards (e.g. ``67_document_type_check.sql``): completeness cannot be judged,
    so the audit defers rather than fabricating a finding.
    """
    return CodeAudit(
        name=name,
        has_dltd_ind=False,
        unmapped_all=[],
        unmapped_active=[],
        orphans=[],
        label_drift=[],
        volumes=[],
        snapshot_added=[],
        snapshot_removed=[],
        snapshot_renamed=[],
        deferred=True,
    )


def collect_code_audit(
    con: duckdb.DuckDBPyConnection, spec: CrosswalkSpec, live_tables: set[str]
) -> CodeAudit:
    """Collect the live data for a code crosswalk and run the pure comparison."""
    s = spec.source
    fact_table = _safe_ident(str(s["fact_table"]), "fact_table")
    fact_column = _safe_ident(str(s["fact_column"]), "fact_column")
    if fact_table not in live_tables:
        return _deferred_code_audit(spec.name)
    subset = s.get("code_subset")
    has_dltd = "dltd_ind" in _live_columns(con, fact_table)

    crosswalk = read_crosswalk(
        REPORTS_DIR / spec.csv,
        str(s["crosswalk_code_column"]),
        str(s["crosswalk_name_column"]),
    )
    live_all = _distinct_codes(
        con, fact_table, fact_column, active_only=False, subset=subset
    )
    live_active = (
        _distinct_codes(con, fact_table, fact_column, active_only=True, subset=subset)
        if has_dltd
        else live_all
    )
    volumes = _code_volumes(
        con, fact_table, fact_column, has_dltd_ind=has_dltd, subset=subset
    )
    live_rfrnc = _live_rfrnc(
        con,
        str(s["rfrnc_table"]),
        str(s["rfrnc_code_column"]),
        str(s["rfrnc_name_column"]),
        subset,
    )
    subset_norm = {str(int(v)) for v in subset} if subset else None
    snapshot = read_rfrnc_csv(
        REPORTS_DIR / str(s["snapshot_csv"]),
        str(s["rfrnc_code_column"]),
        str(s["rfrnc_name_column"]),
        subset_norm,
    )
    return audit_code_crosswalk(
        name=spec.name,
        crosswalk=crosswalk,
        live_fact_all=live_all,
        live_fact_active=live_active,
        live_rfrnc=live_rfrnc,
        snapshot_rfrnc=snapshot,
        volumes=volumes,
        has_dltd_ind=has_dltd,
    )


def collect_structural_audit(
    con: duckdb.DuckDBPyConnection, spec: CrosswalkSpec, live_tables: set[str]
) -> StructuralAudit:
    """Collect the live data for a table-driven crosswalk and compare."""
    rows = read_structural_rows(spec)
    tables = sorted({r.table for r in rows})
    live_columns: dict[str, set[str]] = {}
    volumes: dict[str, tuple[int, int]] = {}
    for t in tables:
        if t not in live_tables:
            continue
        cols = _live_columns(con, t)
        live_columns[t] = cols
        volumes[t] = _row_counts(con, t, has_dltd_ind="dltd_ind" in cols)
    return audit_structural_crosswalk(
        name=spec.name,
        rows=rows,
        live_tables=live_tables,
        live_columns=live_columns,
        volumes=volumes,
    )


def _baseline_captured_at() -> str:
    """The reference_data snapshot timestamp used for the drift baseline."""
    manifest = REFERENCE_DATA_DIR / "_manifest.json"
    if not manifest.exists():
        return "(unknown)"
    try:
        return str(json.loads(manifest.read_text()).get("captured_at", "(unknown)"))
    except (ValueError, OSError):
        return "(unknown)"


def _codes(items: list[str]) -> str:
    """Render a code list for the markdown report."""
    return ", ".join(f"`{c}`" for c in items) if items else "(none)"


def render_report(
    code_audits: list[CodeAudit],
    structural_audits: list[StructuralAudit],
    *,
    mysql_db: str,
    baseline: str,
    skipped: list[str],
) -> str:
    """Render the full markdown audit report (pure; unit-testable)."""
    blocking = [a for a in code_audits if a.blocking] + [
        a for a in structural_audits if a.blocking
    ]
    status = "CLEAN" if not blocking else f"ISSUES ({len(blocking)} blocking)"
    out: list[str] = [
        "# Crosswalk audit (codebase vs live PROD MySQL)",
        "",
        f"Generated: {ts()}",
        f"Source MySQL database: {mysql_db}",
        f"Snapshot drift baseline: reference_data captured {baseline}",
        f"Crosswalks audited: {len(code_audits)} code + "
        f"{len(structural_audits)} structural"
        + (
            f"; {sum(a.deferred for a in code_audits)} deferred (source not loaded)"
            if any(a.deferred for a in code_audits)
            else ""
        )
        + (f"; {len(skipped)} skipped (no source block)" if skipped else ""),
        "",
        f"**OVERALL: {status}**",
        "",
    ]
    if blocking:
        out.append("## Blocking findings")
        out.append("")
        for a in code_audits:
            if a.unmapped_all:
                out.append(
                    f"- `{a.name}`: {len(a.unmapped_all)} live code(s) not mapped "
                    f"(all rows): {_codes(a.unmapped_all)}"
                )
        for s in structural_audits:
            for t in s.missing_tables:
                out.append(f"- `{s.name}`: source table `{t}` not present in live source")
            for t, c in s.missing_columns:
                out.append(f"- `{s.name}`: column `{t}.{c}` not present in live source")
        out.append("")

    if skipped:
        out.append("## Skipped (no `source:` block in registry)")
        out.append("")
        out.extend(f"- `{name}`" for name in skipped)
        out.append("")

    for a in code_audits:
        out.extend(_render_code_section(a))
    for s in structural_audits:
        out.extend(_render_structural_section(s))
    return "\n".join(out) + "\n"


def _render_code_section(a: CodeAudit) -> list[str]:
    out = [f"## `{a.name}` (code)", ""]
    if a.deferred:
        out.append(
            "- Deferred: source fact table not present in the live source "
            "(workstream not loaded yet); completeness check is a no-op, mirroring "
            "the `to_regclass` guard in the corresponding `*_check.sql`."
        )
        out.append("")
        return out
    active_note = "" if a.has_dltd_ind else " (no `dltd_ind`; active == all)"
    out.append(
        f"- Completeness: unmapped all-rows {_codes(a.unmapped_all)}; "
        f"unmapped active{active_note} {_codes(a.unmapped_active)}"
    )
    out.append(f"- Orphans (crosswalk code absent from live rfrnc): {_codes(a.orphans)}")
    if a.label_drift:
        drift = "; ".join(
            f"`{c}` crosswalk={cw!r} live={lv!r}" for c, cw, lv in a.label_drift
        )
        out.append(f"- Label drift: {drift}")
    else:
        out.append("- Label drift: (none)")
    snap = (
        f"+{len(a.snapshot_added)} added / -{len(a.snapshot_removed)} removed / "
        f"~{len(a.snapshot_renamed)} renamed since baseline"
    )
    out.append(f"- Snapshot drift: {snap}")
    if a.snapshot_added:
        out.append(f"  - added: {_codes(a.snapshot_added)}")
    if a.snapshot_removed:
        out.append(f"  - removed: {_codes(a.snapshot_removed)}")
    if a.snapshot_renamed:
        ren = "; ".join(
            f"`{c}` baseline={b!r} live={lv!r}" for c, b, lv in a.snapshot_renamed
        )
        out.append(f"  - renamed: {ren}")
    if a.volumes:
        vols = ", ".join(f"`{c}`={n_all} ({n_act} active)" for c, n_all, n_act in a.volumes)
        out.append(f"- Volume per code: {vols}")
    out.append("")
    return out


def _render_structural_section(s: StructuralAudit) -> list[str]:
    out = [f"## `{s.name}` (structural)", ""]
    out.append(
        f"- Missing source tables: "
        f"{_codes(s.missing_tables) if s.missing_tables else '(none)'}"
    )
    if s.missing_columns:
        cols = ", ".join(f"`{t}.{c}`" for t, c in s.missing_columns)
        out.append(f"- Missing columns: {cols}")
    else:
        out.append("- Missing columns: (none)")
    if s.pending_rows:
        out.append(f"- SME-pending (blank mapping): {_codes(s.pending_rows)}")
    if s.volumes:
        vols = ", ".join(f"`{t}`={n_all} ({n_act} active)" for t, n_all, n_act in s.volumes)
        out.append(f"- Row volume per source table: {vols}")
    out.append("")
    return out


_FRAGMENT_BANNER = (
    "// Generated by scripts/crosswalk_audit.py against live PROD MySQL.\n"
    "// Do not edit by hand; rerun `make crosswalk_audit` (needs live source access).\n"
    "// Operator-refreshed: NOT regenerated or drift-checked in CI (no PROD in CI).\n\n"
)


def _write_fragment(name: str, body: str) -> None:
    FRAGMENT_DIR.mkdir(parents=True, exist_ok=True)
    (FRAGMENT_DIR / name).write_text(_FRAGMENT_BANNER + body.rstrip() + "\n", encoding="utf-8")


def emit_fragments(
    code_audits: list[CodeAudit],
    structural_audits: list[StructuralAudit],
    *,
    mysql_db: str,
    baseline: str,
) -> None:
    """Write the committed AsciiDoc fragments the wiki page includes."""
    blocking = sum(a.blocking for a in code_audits) + sum(
        s.blocking for s in structural_audits
    )
    attrs = {
        "crosswalk-audit-generated": ts(),
        "crosswalk-audit-mysql-db": mysql_db,
        "crosswalk-audit-baseline": baseline,
        "crosswalk-audit-code": len(code_audits),
        "crosswalk-audit-structural": len(structural_audits),
        "crosswalk-audit-blocking": blocking,
        "crosswalk-audit-status": "CLEAN" if not blocking else "ISSUES",
    }
    _write_fragment(
        "crosswalk-audit-attrs.adoc",
        "\n".join(f":{k}: {v}" for k, v in attrs.items()),
    )

    summary = [
        ".Crosswalk audit summary (codebase vs live PROD source)",
        '[cols="2,1,2,1,1,2",options="header"]',
        "|===",
        "| Crosswalk | Kind | Completeness | Orphans | Label drift | Snapshot drift",
        "",
    ]
    for a in code_audits:
        if a.deferred:
            comp = "deferred (source absent)"
        else:
            comp = "OK" if not a.unmapped_all else f"*{len(a.unmapped_all)} unmapped*"
        snap = (
            f"+{len(a.snapshot_added)}/-{len(a.snapshot_removed)}/"
            f"~{len(a.snapshot_renamed)}"
        )
        summary.append(
            f"| `{a.name}` | code | {comp} | {len(a.orphans)} | "
            f"{len(a.label_drift)} | {snap}"
        )
    for s in structural_audits:
        comp = (
            "OK"
            if not s.blocking
            else f"*{len(s.missing_tables)}t/{len(s.missing_columns)}c missing*"
        )
        summary.append(f"| `{s.name}` | structural | {comp} | -- | -- | --")
    summary.append("|===")
    _write_fragment("crosswalk-audit-summary.adoc", "\n".join(summary))

    findings: list[str] = []
    blocking_lines: list[str] = []
    for a in code_audits:
        if a.unmapped_all:
            blocking_lines.append(
                f"* `{a.name}`: {len(a.unmapped_all)} live code(s) not mapped "
                f"({', '.join('`' + c + '`' for c in a.unmapped_all)})."
            )
    for s in structural_audits:
        for t in s.missing_tables:
            blocking_lines.append(f"* `{s.name}`: source table `{t}` not present.")
        for t, c in s.missing_columns:
            blocking_lines.append(f"* `{s.name}`: column `{t}.{c}` not present.")
    if blocking_lines:
        findings.append("Blocking findings (a `--strict` run exits non-zero):\n")
        findings.extend(blocking_lines)
    else:
        findings.append(
            "No blocking findings: every live legacy code is mapped and every "
            "named source table/column exists."
        )
    _write_fragment("crosswalk-audit-findings.adoc", "\n".join(findings))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="exit non-zero when a blocking finding exists (unmapped live code "
        "or missing source table/column)",
    )
    args = parser.parse_args(argv)

    import duckdb

    env = Env.load()
    mysql_db = env.mysql_db or "(from MYSQL_URL)"
    specs = load_registry()

    con = duckdb.connect()
    code_audits: list[CodeAudit] = []
    structural_audits: list[StructuralAudit] = []
    skipped: list[str] = []
    try:
        _attach_source(con, env)
        live_tables = _live_base_tables(con)
        for spec in specs:
            if spec.kind == "code":
                code_audits.append(collect_code_audit(con, spec, live_tables))
            elif spec.kind == "structural":
                structural_audits.append(collect_structural_audit(con, spec, live_tables))
            else:
                skipped.append(spec.name)
    finally:
        con.close()

    baseline = _baseline_captured_at()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report = render_report(
        code_audits,
        structural_audits,
        mysql_db=mysql_db,
        baseline=baseline,
        skipped=skipped,
    )
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    out = RUNS_DIR / f"crosswalk_audit_{file_stamp()}.md"
    out.write_text(report, encoding="utf-8")

    blocking = [a for a in code_audits if a.blocking] + [
        s for s in structural_audits if s.blocking
    ]
    manifest = {
        "generated_at": ts(),
        "stamp": file_stamp(),
        "duckdb_version": duckdb.__version__,
        "mysql_db": mysql_db,
        "snapshot_baseline": baseline,
        "code_crosswalks": len(code_audits),
        "structural_crosswalks": len(structural_audits),
        "deferred": sorted(a.name for a in code_audits if a.deferred),
        "skipped": skipped,
        "blocking": len(blocking),
    }
    (REPORTS_DIR / "generated" / "crosswalk_audit_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    emit_fragments(code_audits, structural_audits, mysql_db=mysql_db, baseline=baseline)

    status = "CLEAN" if not blocking else f"ISSUES ({len(blocking)} blocking)"
    log(f"wrote {rel(out)} -- {status}")
    if blocking and args.strict:
        die(f"crosswalk audit found {len(blocking)} blocking finding(s); see {rel(out)}")
    if blocking:
        log(f"WARNING: {len(blocking)} blocking finding(s) (informational; use --strict to fail)")
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT_DIR))
    raise SystemExit(main())
