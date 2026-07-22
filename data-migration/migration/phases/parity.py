"""P6: parity report. Pure-Postgres checks comparing source vs target.

Parity is intentionally NOT a DuckDB job: the source-of-truth (`mysql_raw`,
the frozen pgloaded copy, pinnable via `_loaded_at`/`_delta_log`) and the
target (`demos_app`) live in the same Postgres database, so the gating checks
are pure-PG SQL. DuckDB's home is the pre-load conduit (schema_snapshot,
reference_data) and the separate, non-gating load-fidelity check
(`migrate load-fidelity`), never this gate.

Most checks read from a Postgres view created by the corresponding
`sql/99_parity/*.sql` file; check 5 is CSV-driven (its reconstructed-FK
bindings live in `reports/generated/fk_candidates.csv`, not in PG). Authored checks:
3 (JSONB shape, BN oracle) and 8 (demonstration load completeness), the
non-gating 5 (reconstructed-FK orphan review, scoped to the migration load
surface; orphans logged per-row to
`reports/orphans/reconstructed_fk_orphans.csv`), plus the pre-existing 6
(demonstration-id provenance) and 7
(users/person integrity), and the user-RBAC checks 9 (system_role_assignment
integrity), 10 (person_state integrity + held state-authorization flags),
11 (active-users coverage cross-check), 12 (demonstration_role_assignment
integrity), the non-gating 13 (Approved demos held back for a missing
required field; logged per-row to `reports/orphans/`), the non-gating 14
(PMDA workflow scope coverage; written to `reports/generated/scope_coverage.csv`), the
deliverable-family checks 15 (deliverable load completeness) and 16
(deliverable integrity), the non-gating 17 (deliverables held back from the
load; logged per-row to `reports/orphans/deliverable_held.csv`), the
non-gating deliverable BN routing QA (type-vs-flag/name disagreements; logged
per-row to `reports/orphans/deliverable_bn_qa.csv`), the non-gating
other-program demonstration-type tags held back (free-text
`mdcd_othr_pgm_dtl` rows that are not an exact seeded tag, held per SME rather
than invented as tags; logged per-row to
`reports/orphans/pgm_dtl_tag_othr_held.csv`) and the fail-closed pgm_dtl
tag mapped-but-unseeded guard (RED if a `crosswalk_pgm_dtl_tag` mapping names a
tag the fold loader would silently skip), and the non-gating 18 (state -> CMS region seed vs source drift; logged per-row to
`reports/orphans/state_region_drift.csv`), and the non-gating 19 (amendment
load accounting: parent-held amendments + dropped OGD/DD signatures, logged
per-row to `reports/orphans/amendment_*.csv`) and the fail-closed amendment
unmapped/NULL-status guard (RED if a staged amendment with a loaded parent has a
`status_cd` the loader's inner crosswalk JOIN would silently drop; logged
per-row to `reports/orphans/amendment_unmapped_status.csv`), and the non-gating 20
(medicaid.gov 1115 outcome-fact cross-check; logged per-row to
`reports/orphans/medicaid_gov_1115_drift.csv`), and the non-gating 21
(demonstrations held back as the non-winning row of a duplicate medicaid_id;
logged per-row to `reports/orphans/demonstration_held_dup_medicaid.csv`).
Checks 1 and 2 are real reconciliations over the BUILT consolidated families:
1 cross-foots each family's source (loadable resolver) against target + held
(`migration._parity_row_counts`, `sql/99_parity/90_row_counts.sql`), and 2
folds that into a count-checksum (no numeric business column moves, so a literal
value-sum is N/A). Checks 10 and 12 reconcile their held-row flags against an
SME accepted-flags baseline (`reports/parity_accepted/`, keyed on stable legacy
ids): GREEN once every live flag is covered by a SIGNED baseline, else PENDING.
Check 4 audits the pending/approved unification (`migration._parity_pending_approved`,
`sql/99_parity/04_pending_approved.sql`): RED if a pending demo leaked into the
demonstration target, else the pending-only deferred set is reconciled against
its own signed baseline (same mechanism as 10/12). The SQL apply runs *before*
the report is built so the views are current when the Python checks read them.

Operators MAY pass `--accept-pending` to mark the gate green even when
checks are PENDING; doing so logs a WARN that names every pending check.
This is for dress rehearsals; do not use it on cutover day.
"""

from __future__ import annotations

import csv
import json
from collections.abc import Callable
from collections.abc import Set as AbstractSet
from dataclasses import dataclass, field
from pathlib import Path

import psycopg
from psycopg import sql

from migration.lib import (
    REPORTS_DIR,
    RUNS_DIR,
    SQL_DIR,
    Env,
    apply_dir,
    copy_csv_into_table,
    die,
    file_stamp,
    log,
    mark_gate,
    progress_for,
    psql_query,
    rel,
    require_gate,
    ts,
)

# Reconstructed-FK candidates (source had no declared FKs); see
# migration/phases/fk_candidates.py. Header-only until the scanner + overrides
# populate it, in which case check 5 is vacuously GREEN.
FK_CANDIDATES_FILE: Path = REPORTS_DIR / "generated" / "fk_candidates.csv"

# SME-signed accepted-flags baselines for the held-row gates (10, 12). A held
# flag is GREEN-eligible only when it appears in the matching signed baseline
# here; see _read_accepted_baseline.
PARITY_ACCEPTED_DIR: Path = REPORTS_DIR / "parity_accepted"

# Only these confidence tiers are worth reviewing; LOW/NONE are noise.
_ORPHAN_CONFIDENCE: frozenset[str] = frozenset({"HIGH", "MED"})

# The mysql_raw source tables the migration actually reads (its load surface).
# Check 5 scopes the reconstructed-FK orphan review to edges whose CHILD table is
# in this set; orphans in never-migrated source tables (budget-neutrality link
# tables, program-detail tables, pending program-detail, *_hstry/*_bkup) are
# pre-existing source data-quality noise, out of scope for this migration.
# Derived by scanning sql/ for `mysql_raw.<table>` reads in query bodies
# (excluding synthetic crosswalk_* lookups and the _delta_log pin table); refresh
# it if a new loader begins reading a new source table.
_MIGRATION_SOURCE_TABLES: frozenset[str] = frozenset({
    "bdgt_ntrlty_demo_yr",
    "bdgt_ntrlty_mdcd_elgblty_grp",
    "bdgt_ntrlty_mmbr_mo_actl",
    "bdgt_ntrlty_mmbr_mo_prjtd",
    "bdgt_ntrlty_wth_wvr_spnd_prjtd_cst",
    "geo_ansi_state_rfrnc",
    "mdcd_demo",
    "mdcd_demo_amndmt",
    "mdcd_demo_aplctn",
    "mdcd_demo_aplctn_doc",
    "mdcd_demo_cntct",
    "mdcd_demo_rnwl",
    "mdcd_demo_type_rfrnc",
    "mdcd_dlvrbl",
    "mdcd_dlvrbl_cmt",
    "mdcd_dlvrbl_fil_doc",
    "mdcd_dlvrbl_paper",
    "mdcd_dlvrbl_paper_cmt",
    "mdcd_pendg_demo",
    "mdcd_pendg_demo_cntct",
    "rfrnc_matl",
    "role_rfrnc",
    "user_authrzd_state_acs",
    "user_role_asgnmt",
    "users",
})


@dataclass
class CheckResult:
    """Outcome of a single parity check.

    ``status`` is one of ``"GREEN"``, ``"RED"``, or ``"PENDING"``.
    """

    name: str
    status: str  # "GREEN" | "RED" | "PENDING"
    detail: str = ""


@dataclass
class ParityReport:
    """Aggregate of every :class:`CheckResult` produced by ``run_parity``."""

    generated_at: str
    checks: list[CheckResult] = field(default_factory=list)
    report_path: Path | None = None

    @property
    def overall(self) -> str:
        """Worst-status rollup: RED > PENDING > GREEN; empty checks read PENDING."""
        statuses = {c.status for c in self.checks}
        if "RED" in statuses:
            return "RED"
        if "PENDING" in statuses or not statuses:
            return "PENDING"
        return "GREEN"

    @property
    def pending_checks(self) -> list[str]:
        """Return the names of every check whose status is ``"PENDING"``."""
        return [c.name for c in self.checks if c.status == "PENDING"]

    def to_markdown(self) -> str:
        """Render the report as a Markdown document suitable for ``reports/``."""
        lines = [
            "# Parity report",
            "",
            f"Generated: {self.generated_at}",
            "",
        ]
        for c in self.checks:
            lines.extend([f"## {c.name} -- **{c.status}**", "", c.detail or "(no detail)", ""])
        lines.extend(["---", "", f"**OVERALL STATUS: {self.overall}**", ""])
        return "\n".join(lines)


def _row_count_parity(env: Env) -> CheckResult:
    """Check 1: row-count reconciliation per consolidated BUILT family.

    Reads ``migration._parity_row_counts`` (``sql/99_parity/90_row_counts.sql``):
    one row per BUILT family with (source_count, target_count, held_count,
    delta), where source = loadable ``stg.*_resolved`` and
    delta = source - target - held. A non-zero delta means a family's loadable
    rows were silently dropped or the target was over-counted -> RED. An empty
    view (resolvers absent pre-build) -> vacuously GREEN. Structural non-1:1
    BUILT families (users, application(_date), amendment, person_state,
    demonstration_role_assignment, demonstration_type_tag_assignment) are
    reconciled by their dedicated gates, documented in 90_row_counts.sql.
    """
    name = "1. Row count parity per consolidated family"
    rows = psql_query(
        env,
        "SELECT family, source_count, target_count, held_count, delta "
        "FROM migration._parity_row_counts ORDER BY family",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "no resolver present yet; per-family row-count reconciliation "
                "vacuously satisfied"
            ),
        )
    offenders = [r for r in rows if int(r[4]) != 0]
    if offenders:
        detail = "; ".join(
            f"{r[0]}: source {r[1]} != target {r[2]} + held {r[3]} (delta {r[4]})"
            for r in offenders
        )
        return CheckResult(
            name=name,
            status="RED",
            detail=(
                f"{len(offenders)} family/ies fail row-count reconciliation: "
                f"{detail}; see migration._parity_row_counts"
            ),
        )
    tally = "; ".join(f"{r[0]}: {r[1]}=tgt {r[2]}+held {r[3]}" for r in rows)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=f"every BUILT family reconciles source = target + held: {tally}",
    )


def _numeric_sum_parity(env: Env) -> CheckResult:
    """Check 2: count-checksum cross-foot (literal numeric value-sum N/A).

    No numeric business column moves into the BUILT ``demos_app`` targets
    (values are UUIDs/text/dates/enums; monetary BN data is JSONB, covered by
    check 3), so a literal source-vs-target value-sum has nothing to compare.
    Per the repurposing decision this folds into the row-count reconciliation:
    it cross-foots the column totals of ``migration._parity_row_counts`` (sum of
    source vs sum of target + held). Equal -> GREEN; a mismatch the per-family
    check somehow missed -> RED. Empty view -> vacuously GREEN.
    """
    name = "2. Numeric sum parity"
    rows = psql_query(
        env,
        "SELECT coalesce(sum(source_count), 0), coalesce(sum(target_count), 0), "
        "coalesce(sum(held_count), 0) FROM migration._parity_row_counts",
    )
    src = int(rows[0][0]) if rows else 0
    tgt = int(rows[0][1]) if rows else 0
    held = int(rows[0][2]) if rows else 0
    if src != tgt + held:
        return CheckResult(
            name=name,
            status="RED",
            detail=(
                "count-checksum mismatch across BUILT families: "
                f"source {src} != target {tgt} + held {held}; "
                "see migration._parity_row_counts"
            ),
        )
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            "literal numeric value-sum N/A (no numeric business columns move to "
            "demos_app; BN monetary shape covered by check 3); count-checksum "
            f"cross-foots: source {src} = target {tgt} + held {held}"
        ),
    )


def _jsonb_shape(env: Env) -> CheckResult:
    """Check 3: JSONB payload-shape conformance of the BN parity oracle.

    Reads ``migration._parity_jsonb_shape`` (created by
    ``sql/99_parity/03_jsonb_shape.sql``). The only migration-owned JSONB
    whose shape matters for parity is
    ``migration.bn_workbook_detail.validation_data`` vs the registered
    ``budget_neutrality`` schema; the live ``demos_app.*`` JSONB columns are
    DEMOS-owned and empty at cutover, so they are out of scope. Vacuously
    GREEN until the W5 BN loader populates the oracle.
    """
    rows = psql_query(env, "SELECT count(*) FROM migration._parity_jsonb_shape")
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name="3. JSONB shape conformance",
            status="GREEN",
            detail=(
                "migration.bn_workbook_detail.validation_data conforms to the "
                "registered budget_neutrality schema (DEMOS-owned demos_app JSONB "
                "is out of scope)"
            ),
        )
    return CheckResult(
        name="3. JSONB shape conformance",
        status="RED",
        detail=(
            f"{count} BN parity-oracle object(s) fail their registered JSON "
            "schema; see view migration._parity_jsonb_shape"
        ),
    )


def _pending_approved_audit(env: Env) -> CheckResult:
    """Check 4: pending/approved unification audit.

    Reads ``migration._parity_pending_approved``
    (``sql/99_parity/04_pending_approved.sql``). RED when any ``leaked`` row
    exists -- a pending demo (id resolving to
    ``migration._id_map_mdcd_pendg_demo``) was loaded as a
    ``demos_app.demonstration``, violating the "approved wins / pending
    deferred" rule in ``reports/narrative/pending_approved_decisions.md``. Otherwise the
    intentionally-deferred pending-only set (a valid pending demo with no
    approved counterpart) is reconciled against the SME-signed baseline
    ``reports/parity_accepted/pending_approved_deferrals.csv``: GREEN once every
    live deferral is covered by a SIGNED baseline, else PENDING (a new deferral
    or an unsigned baseline forces re-review). Vacuously GREEN when the view is
    empty (pipeline not built yet). Leakage-only by SME decision; a stronger
    counterpart-loaded invariant is documented in 04_pending_approved.sql.
    """
    name = "4. Pending/approved unification audit"
    leaked = psql_query(
        env,
        "SELECT legacy_pendg_demo_id, medicaid_id "
        "FROM migration._parity_pending_approved WHERE category = 'leaked'",
    )
    if leaked:
        detail = "; ".join(f"pendg {r[0]} ({r[1]})" for r in leaked[:10])
        return CheckResult(
            name=name,
            status="RED",
            detail=(
                f"{len(leaked)} pending demonstration(s) were loaded as "
                "demos_app.demonstration (approved-wins/pending-deferred rule "
                f"violated): {detail}; see migration._parity_pending_approved"
            ),
        )
    deferred = psql_query(
        env,
        "SELECT legacy_pendg_demo_id, reason "
        "FROM migration._parity_pending_approved WHERE category = 'pending_only_deferred'",
    )
    if not deferred:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "no pending demo leaked into demos_app.demonstration and no "
                "pending-only demonstration to defer (vacuously satisfied)"
            ),
        )
    live_keys = {(str(r[0]), str(r[1])) for r in deferred}
    baseline = _read_accepted_baseline(
        PARITY_ACCEPTED_DIR / "pending_approved_deferrals.csv",
        ["legacy_pendg_demo_id", "reason"],
    )
    status, phrase = _classify_held_flags(live_keys, baseline)
    return CheckResult(
        name=name,
        status=status,
        detail=(
            f"{phrase}; no pending demo leaked into demos_app.demonstration; "
            "pending-only demonstrations deferred per "
            "reports/narrative/pending_approved_decisions.md (see "
            "migration._parity_pending_approved)"
        ),
    )


@dataclass(frozen=True)
class _ReconstructedFK:
    """One reconstructed FK edge from ``reports/generated/fk_candidates.csv``.

    The source MySQL schema declares no foreign keys; these edges are inferred
    by ``migrate fk-candidates``. ``from_schema``/``from_table`` come from the
    schema-qualified ``from_table_qual``; ``to_table`` is bare in the CSV and
    defaults to the same schema as the child.
    """

    from_schema: str
    from_table: str
    from_column: str
    to_schema: str
    to_table: str
    to_column: str


def _read_reconstructed_fks(path: Path = FK_CANDIDATES_FILE) -> list[_ReconstructedFK]:
    """Return the HIGH/MED reconstructed FK edges from the candidates CSV.

    Header-only or missing file yields an empty list (check 5 then reads
    vacuously GREEN). Rows missing a required field, or carrying a
    LOW/NONE/blank confidence, are skipped. ``to_table`` may be schema
    qualified (``schema.table``) or bare (defaults to the child's schema).
    """
    if not path.exists():
        return []
    edges: list[_ReconstructedFK] = []
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if (row.get("confidence") or "").strip().upper() not in _ORPHAN_CONFIDENCE:
                continue
            from_qual = (row.get("from_table_qual") or "").strip()
            from_col = (row.get("from_column") or "").strip()
            to_table_raw = (row.get("to_table") or "").strip()
            to_col = (row.get("to_column") or "").strip()
            if not (from_qual and from_col and to_table_raw and to_col):
                continue
            from_schema, _, from_table = from_qual.rpartition(".")
            if not (from_schema and from_table):
                continue
            to_schema, _, to_table = to_table_raw.rpartition(".")
            if not to_table:
                to_schema, to_table = from_schema, to_table_raw
            elif not to_schema:
                to_schema = from_schema
            edges.append(
                _ReconstructedFK(
                    from_schema=from_schema,
                    from_table=from_table,
                    from_column=from_col,
                    to_schema=to_schema,
                    to_table=to_table,
                    to_column=to_col,
                )
            )
    return edges


def _orphan_rows_query(fk: _ReconstructedFK) -> sql.Composed:
    """Compose an identifier-safe SELECT of child FK values with no parent.

    Returns one row per orphan child row (its non-NULL FK value absent from the
    parent's referenced column), so check 5 can log the orphans per-row for SME
    review. All table/column names are interpolated via ``sql.Identifier`` so a
    surprising name in the CSV can never inject SQL.
    """
    return sql.SQL(
        "SELECT f.{fc} FROM {ft} f "
        "WHERE f.{fc} IS NOT NULL "
        "AND NOT EXISTS (SELECT 1 FROM {tt} t WHERE t.{tc} = f.{fc})"
    ).format(
        ft=sql.Identifier(fk.from_schema, fk.from_table),
        fc=sql.Identifier(fk.from_column),
        tt=sql.Identifier(fk.to_schema, fk.to_table),
        tc=sql.Identifier(fk.to_column),
    )


def _existing_columns(env: Env) -> set[tuple[str, str, str]]:
    """Return every ``(schema, table, column)`` present in the live target.

    Used to guard reconstructed-FK edges before composing an orphan query: the
    candidate CSV is heuristic (``scripts/generate_fk_candidates.sql`` guesses
    the parent PK as ``id``/``cd``), so an edge may name a column that does not
    exist in ``mysql_raw`` (e.g. ``mdcd_demo.id`` -- the real PK is
    ``mdcd_demo_id``). Running the count on such an edge raises UndefinedColumn
    and would abort the whole parity gate; the guard turns that into a reported
    PENDING instead.
    """
    rows = psql_query(
        env,
        "SELECT table_schema, table_name, column_name FROM information_schema.columns",
    )
    return {(str(r[0]), str(r[1]), str(r[2])) for r in rows}


def _orphans(env: Env) -> CheckResult:
    """Check 5: reconstructed-FK orphan review (non-gating, load-surface scoped).

    The declared demos_app FKs are already enforced and VALIDATED by the
    constraints phase, so target integrity is guaranteed regardless. This check
    inspects the *reconstructed* (inferred, non-declared) edges in
    ``reports/generated/fk_candidates.csv``, which describe SOURCE relationships MySQL
    never enforced. Those edges are heuristic (many demonstrably wrong) and span
    the entire source, most of it in tables this migration never loads, so a
    dangling source reference is a pre-existing data-quality signal, not a
    migration defect -- and every loader already holds back rows whose parent is
    not loaded. Accordingly this check is NON-GATING (always GREEN) and is
    scoped to the migration's load surface (``_MIGRATION_SOURCE_TABLES``):

    * edges whose CHILD table is not read by the migration are skipped;
    * for in-scope edges whose endpoints both exist, orphan child rows are
      logged per-row to ``reports/orphans/reconstructed_fk_orphans.csv`` for
      SME review;
    * edges naming an absent column (a heuristic PK guess) or pairing
      incompatible types are reported uncheckable in the detail.

    Vacuously GREEN when the candidates file is header-only.
    """
    name = "5. Reconstructed-FK orphan checks"
    edges = _read_reconstructed_fks()
    if not edges:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no HIGH/MED reconstructed-FK candidates to check (vacuously green)",
        )
    cols = _existing_columns(env)
    orphan_rows: list[tuple[object, ...]] = []
    offenders: list[str] = []
    uncheckable: list[str] = []
    out_of_scope = 0
    checked = 0
    for fk in edges:
        if fk.from_table not in _MIGRATION_SOURCE_TABLES:
            out_of_scope += 1
            continue
        child_present = (fk.from_schema, fk.from_table, fk.from_column) in cols
        parent_present = (fk.to_schema, fk.to_table, fk.to_column) in cols
        if not (child_present and parent_present):
            absent = []
            if not child_present:
                absent.append(f"{fk.from_schema}.{fk.from_table}.{fk.from_column}")
            if not parent_present:
                absent.append(f"{fk.to_schema}.{fk.to_table}.{fk.to_column}")
            uncheckable.append(
                f"{fk.from_schema}.{fk.from_table}.{fk.from_column} -> "
                f"{fk.to_schema}.{fk.to_table}.{fk.to_column} (absent: {', '.join(absent)})"
            )
            continue
        try:
            rows = psql_query(env, _orphan_rows_query(fk).as_string())
        except psycopg.Error as e:
            # A heuristic candidate may pair columns of incompatible types
            # (e.g. an integer child key against a text *_cd parent), which
            # makes the equality uncheckable. Report it rather than aborting.
            reason = str(e).splitlines()[0]
            uncheckable.append(
                f"{fk.from_schema}.{fk.from_table}.{fk.from_column} -> "
                f"{fk.to_schema}.{fk.to_table}.{fk.to_column} (uncheckable: {reason})"
            )
            continue
        checked += 1
        if rows:
            offenders.append(
                f"{fk.from_schema}.{fk.from_table}.{fk.from_column} -> "
                f"{fk.to_schema}.{fk.to_table}.{fk.to_column}: {len(rows)} orphan(s)"
            )
            for r in rows:
                orphan_rows.append(
                    (
                        fk.from_schema,
                        fk.from_table,
                        fk.from_column,
                        fk.to_schema,
                        fk.to_table,
                        fk.to_column,
                        r[0],
                    )
                )

    out_path = REPORTS_DIR / "orphans" / "reconstructed_fk_orphans.csv"
    if orphan_rows:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(
                [
                    "from_schema",
                    "from_table",
                    "from_column",
                    "to_schema",
                    "to_table",
                    "to_column",
                    "orphan_value",
                ]
            )
            for row in orphan_rows:
                w.writerow(["" if v is None else v for v in row])

    def _sample(items: list[str], limit: int = 5) -> str:
        head = "; ".join(items[:limit])
        return head + (f"; +{len(items) - limit} more" if len(items) > limit else "")

    parts: list[str] = []
    if offenders:
        parts.append(
            f"{len(offenders)} in-scope reconstructed-FK edge(s) with orphans "
            f"({len(orphan_rows)} row(s)) logged to {rel(out_path)} (non-gating): "
            + _sample(offenders)
        )
    else:
        parts.append(f"{checked} in-scope edge(s) orphan-free")
    if uncheckable:
        parts.append(
            f"{len(uncheckable)} edge(s) uncheckable (absent column/type): "
            + _sample(uncheckable)
        )
    parts.append(
        f"{out_of_scope} out-of-scope edge(s) skipped "
        "(child table not in the migration load surface)"
    )
    return CheckResult(name=name, status="GREEN", detail="; ".join(parts))


def _demonstration_id_provenance(env: Env) -> CheckResult:
    """Check 6: every demos_app.demonstration.id traces to a PMDA id-map row.

    Reads ``migration._parity_demonstration_id_provenance`` (created by
    ``sql/99_parity/10_demonstration_id_provenance.sql``). Any row in the
    view is a migration-side bug -- a demonstration UUID that does not
    appear in ``migration._id_map_mdcd_demo`` or
    ``migration._id_map_mdcd_pendg_demo``. New demonstration IDs are
    created post-migration by the DEMOS backend and are out of scope.
    """
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_demonstration_id_provenance",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name="6. Demonstration ID provenance (PMDA-only)",
            status="GREEN",
            detail="every demos_app.demonstration.id resolves through a PMDA id-map row",
        )
    return CheckResult(
        name="6. Demonstration ID provenance (PMDA-only)",
        status="RED",
        detail=(
            f"{count} demos_app.demonstration row(s) have an id not present in "
            "migration._id_map_mdcd_demo or migration._id_map_mdcd_pendg_demo; "
            "see view migration._parity_demonstration_id_provenance"
        ),
    )


def _users_person_integrity(env: Env) -> CheckResult:
    """Check 7: every migrated demos_app.users row is internally consistent.

    Reads ``migration._parity_users_person_integrity`` (created by
    ``sql/99_parity/20_users_person_provenance.sql``). Any row flags a
    users account that lacks its matching person on (id, person_type_id),
    carries a person_type that is not an allowed auth limit, or has an id
    the migration did not mint. Returns 0 rows (vacuously GREEN) until the
    guarded sql/20_app loaders populate person/users at Tier C.
    """
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_users_person_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name="7. Users/person integrity",
            status="GREEN",
            detail=(
                "every demos_app.users row has a matching person, an allowed "
                "person_type, and an id-map provenance"
            ),
        )
    return CheckResult(
        name="7. Users/person integrity",
        status="RED",
        detail=(
            f"{count} demos_app.users row(s) violate the person match, the "
            "user_person_type_limit, or id-map provenance; see view "
            "migration._parity_users_person_integrity"
        ),
    )


def _demonstration_completeness(env: Env) -> CheckResult:
    """Check 8: every resolved PMDA demonstration is loaded into demos_app.

    Reads ``migration._parity_demonstration_completeness`` (created by
    ``sql/99_parity/11_demonstration_completeness.sql`` only when
    ``stg.demonstration_resolved`` exists). Any row is a PMDA-valid demo the
    loader resolved but could not place in ``demos_app.demonstration`` -- in a
    build that reaches parity every status code is already crosswalked (the
    ``11_demo_status_check`` hard gate blocks any unmapped status code upstream;
    code 1 'Pending' now maps to 'Under Review' per D1), so the residual cause
    is a NULL/unmapped state leaving no CMS region to mint the 21-W chip.
    Completeness counterpart to check 6 (provenance guards the reverse edge).
    Vacuously GREEN before ``build_stg`` builds the staging view.
    """
    name = "8. Demonstration load completeness"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_demonstration_completeness') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no resolved demonstrations to reconcile (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_demonstration_completeness",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every PMDA-resolved demonstration is present in demos_app.demonstration",
        )
    sample = psql_query(
        env,
        "SELECT medicaid_id FROM migration._parity_demonstration_completeness "
        "ORDER BY medicaid_id LIMIT 10",
    )
    ids = ", ".join(str(r[0]) for r in sample)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} PMDA-resolved demonstration(s) were not loaded (e.g. a "
            f"NULL/unmapped state blocks 21-W region derivation); medicaid_id(s): "
            f"{ids}; see view migration._parity_demonstration_completeness"
        ),
    )


def _demonstration_phase_derived(env: Env) -> CheckResult:
    """Demonstration phase derivation tally (non-gating informational log).

    Reads ``migration._parity_demonstration_phase_derived`` (created by
    ``sql/99_parity/13_demonstration_phase_derived.sql`` only when
    ``stg.demonstration_resolved`` + ``crosswalk_demo_status`` exist). The loader
    assigns ``current_phase_id`` by COALESCE(date-derived phase, Approved ->
    'Approval Summary', 'Concept'); there is no single source column to validate
    the date derivation, so this tallies each LOADED demonstration by
    ``(status_id, derived_phase, source_path)`` for SME ratification. The phase
    counterpart to ``_parity_amendment_phase_derived``: always GREEN, with the
    per-path tally emitted inline. Vacuously GREEN before the staging view exists.
    """
    name = "Demonstration phase derivation"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_demonstration_phase_derived') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no demonstration phases to tally (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT status_id, derived_phase, source_path, n "
        "FROM migration._parity_demonstration_phase_derived "
        "ORDER BY source_path, derived_phase, status_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no demonstrations loaded yet; phase derivation tally empty",
        )
    by_path: dict[str, list[str]] = {}
    total = 0
    for row in rows:
        if len(row) < 4:
            continue
        status_id, derived_phase, source_path, n = row[0], row[1], row[2], row[3]
        total += int(n)
        by_path.setdefault(str(source_path), []).append(
            f"{derived_phase}({status_id})={n}"
        )
    tally = "; ".join(f"{path}[{', '.join(items)}]" for path, items in by_path.items())
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{total} loaded demonstration(s); current_phase_id derivation tally "
            f"(non-gating, for SME ratification): {tally}; see view "
            "migration._parity_demonstration_phase_derived"
        ),
    )


def _system_role_assignment_integrity(env: Env) -> CheckResult:
    """Check 9: every demos_app.system_role_assignment row is consistent.

    Reads ``migration._parity_system_role_assignment_integrity`` (created by
    ``sql/99_parity/22_system_role_assignment_provenance.sql``). Any row flags
    a system role assignment whose ``(person_id, person_type_id)`` lacks its
    matching person, whose ``(role_id, person_type_id)`` is not permitted by
    ``role_person_type``, or whose person the migration did not mint. Returns 0
    rows (vacuously GREEN) until the guarded ``23_app_derived`` loader populates
    the table.
    """
    name = "9. System role assignment integrity"
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_system_role_assignment_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "every demos_app.system_role_assignment row has a matching person, "
                "an allowed role_person_type, and id-map provenance"
            ),
        )
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} demos_app.system_role_assignment row(s) violate the person "
            "match, role_person_type, or id-map provenance; see view "
            "migration._parity_system_role_assignment_integrity"
        ),
    )


@dataclass(frozen=True)
class _AcceptedBaseline:
    """A parsed SME accepted-flags baseline: accepted key set + sign-off state."""

    keys: frozenset[tuple[str, ...]]
    signed: bool
    reviewer: str
    date: str


def _read_accepted_baseline(path: Path, key_columns: list[str]) -> _AcceptedBaseline:
    """Read an accepted-flags baseline CSV under ``reports/parity_accepted/``.

    The file carries an SME sign-off in ``#``-prefixed header lines
    (``# Status: SIGNED``, ``# Reviewer: <name>``, ``# Date: <iso>``) followed by
    a normal CSV whose ``key_columns`` identify each accepted held flag by stable
    legacy keys. A missing file, an unsigned/placeholder header, or a blank
    reviewer/date all yield ``signed=False`` so the gate stays PENDING until an
    SME actually signs. Keys are read as trimmed strings so they compare cleanly
    against the stringified live flag rows.
    """
    if not path.exists():
        return _AcceptedBaseline(keys=frozenset(), signed=False, reviewer="", date="")
    meta: dict[str, str] = {}
    data_lines: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        if raw.lstrip().startswith("#"):
            body = raw.lstrip("# ").strip()
            if ":" in body:
                key, _, value = body.partition(":")
                meta[key.strip().lower()] = value.strip()
            continue
        data_lines.append(raw)
    keys: set[tuple[str, ...]] = set()
    for row in csv.DictReader(data_lines):
        keys.add(tuple((row.get(col) or "").strip() for col in key_columns))
    reviewer = meta.get("reviewer", "")
    date = meta.get("date", "")
    signed = meta.get("status", "").upper() == "SIGNED" and bool(reviewer) and bool(date)
    return _AcceptedBaseline(keys=frozenset(keys), signed=signed, reviewer=reviewer, date=date)


def _classify_held_flags(
    live_keys: AbstractSet[tuple[str, ...]], baseline: _AcceptedBaseline
) -> tuple[str, str]:
    """Return ``(status, phrase)`` for held flags against a signed baseline.

    GREEN when every live flag is in a SIGNED baseline; PENDING when new flags
    appear that the baseline has not accepted, or when the baseline covers them
    but is not yet SME-signed.
    """
    total = len(live_keys)
    new = live_keys - baseline.keys
    if new:
        return (
            "PENDING",
            f"{len(new)} new unreviewed flag(s) absent from the accepted baseline "
            f"({total} held total); review and add to the baseline",
        )
    if not baseline.signed:
        return (
            "PENDING",
            f"all {total} held flag(s) are recorded in the accepted baseline but it "
            "is not yet SME-signed (set Status: SIGNED with a Reviewer and Date)",
        )
    return (
        "GREEN",
        f"all {total} held flag(s) accepted per baseline signed by "
        f"{baseline.reviewer} on {baseline.date}",
    )


def _person_state_integrity(env: Env) -> CheckResult:
    """Check 10: demos_app.person_state integrity, plus state-user XX flags.

    RED when ``migration._parity_person_state_integrity`` (created by
    ``sql/99_parity/21_person_state_provenance.sql``) is non-empty -- a loaded
    grant whose person, state, or id-map provenance does not resolve. Otherwise
    the source-side anomalies in ``migration._parity_person_state_flags`` (a
    non-CMS user authorized for 'XX'/all-states, or an unmapped state code) are
    reconciled against the SME accepted-flags baseline
    (``reports/parity_accepted/``): GREEN when every live flag is covered by a
    SIGNED baseline, PENDING when a new flag is unreviewed or the baseline is not
    yet signed. No flags -> GREEN. Vacuously GREEN until the loader populates the
    base table.
    """
    name = "10. Person state integrity"
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_person_state_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count:
        return CheckResult(
            name=name,
            status="RED",
            detail=(
                f"{count} demos_app.person_state row(s) violate the person match, "
                "the state FK, or id-map provenance; see view "
                "migration._parity_person_state_integrity"
            ),
        )

    flags = psql_query(
        env,
        "SELECT user_id, state_cd, reason FROM migration._parity_person_state_flags",
    )
    if not flags:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "every demos_app.person_state grant resolves a person, a state, and "
                "id-map provenance, with no held state-authorization anomalies"
            ),
        )
    live_keys = {(str(r[0]), str(r[1]), str(r[2])) for r in flags}
    baseline = _read_accepted_baseline(
        PARITY_ACCEPTED_DIR / "person_state_flags.csv",
        ["user_id", "state_cd", "reason"],
    )
    status, phrase = _classify_held_flags(live_keys, baseline)
    return CheckResult(
        name=name,
        status=status,
        detail=(
            f"{phrase}; held state-authorization anomalies (a 'XX' all-states grant "
            "DEMOS reserves for CMS, or an unmapped state code) in view "
            "migration._parity_person_state_flags"
        ),
    )


def _active_users_coverage(env: Env) -> CheckResult:
    """Check 11: every realistically-active PMDA user is in the migrated set.

    Reads ``migration._parity_active_users_coverage`` (created by
    ``sql/99_parity/23_active_users_coverage.sql``): PMDA users that are not
    deleted, not soft-deleted, and accessed since 2020, yet absent from
    ``migration._id_map_users``. Any row is an active account the user filter
    dropped -> RED (confirm the exclusion or force-keep). Vacuously GREEN when
    the frozen source copy is not present.
    """
    name = "11. Active-users coverage cross-check"
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_active_users_coverage",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every active PMDA user (not deleted, accessed since 2020) is migrated",
        )
    sample = psql_query(
        env,
        "SELECT email FROM migration._parity_active_users_coverage "
        "ORDER BY email LIMIT 10",
    )
    emails = ", ".join(str(r[0]) for r in sample)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} active PMDA user(s) were filtered out of the migration; "
            f"email(s): {emails}; see view migration._parity_active_users_coverage"
        ),
    )


def _demonstration_role_assignment_integrity(env: Env) -> CheckResult:
    """Check 12: demos_app.demonstration_role_assignment integrity, plus drops.

    RED when ``migration._parity_demonstration_role_assignment_integrity``
    (created by ``sql/99_parity/24_demonstration_role_assignment_provenance.sql``)
    is non-empty -- a loaded row whose person, role_person_type, person_state,
    demonstration-state, or id-map provenance does not resolve. Otherwise the
    dropped candidates in
    ``migration._parity_demonstration_role_assignment_flags`` (a person_type the
    Demonstration role forbids, a person not authorized for the demonstration's
    state, or a demonstration that did not load) are reconciled against the SME
    accepted-flags baseline (``reports/parity_accepted/``): GREEN when every live
    flag is covered by a SIGNED baseline, PENDING when a new flag is unreviewed
    or the baseline is not yet signed. No flags -> GREEN. Vacuously GREEN until
    the loader populates the base table.
    """
    name = "12. Demonstration role assignment integrity"
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_demonstration_role_assignment_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count:
        return CheckResult(
            name=name,
            status="RED",
            detail=(
                f"{count} demos_app.demonstration_role_assignment row(s) violate the "
                "person match, role_person_type, person_state, demonstration-state, "
                "or id-map provenance; see view "
                "migration._parity_demonstration_role_assignment_integrity"
            ),
        )

    flags = psql_query(
        env,
        "SELECT legacy_user_id, legacy_demonstration_id, role_id, person_type_id, reason "
        "FROM migration._parity_demonstration_role_assignment_flags",
    )
    if not flags:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "every demos_app.demonstration_role_assignment row resolves a person, an "
                "allowed role_person_type, a person_state grant, the demonstration's state, "
                "and id-map provenance, with no held candidates"
            ),
        )
    live_keys = {tuple(str(v) for v in r) for r in flags}
    baseline = _read_accepted_baseline(
        PARITY_ACCEPTED_DIR / "demonstration_role_assignment_flags.csv",
        ["legacy_user_id", "legacy_demonstration_id", "role_id", "person_type_id", "reason"],
    )
    status, phrase = _classify_held_flags(live_keys, baseline)
    return CheckResult(
        name=name,
        status=status,
        detail=(
            f"{phrase}; dropped candidate role assignments (a Demonstration role the "
            "person_type may not hold, a person not authorized for the demonstration's "
            "state, or an unloaded demonstration) in view "
            "migration._parity_demonstration_role_assignment_flags"
        ),
    )


def _approved_demo_held_for_division(env: Env) -> CheckResult:
    """Check 13: Approved demos held back for a missing required field (non-gating log).

    Reads ``migration._parity_approved_demo_held`` (created by
    ``sql/99_parity/12_approved_demo_held_for_division.sql`` only when the
    staging view + crosswalks exist). DEMOS enforces
    ``check_demonstration_non_null_fields_when_approved``; the loader
    (``sql/20_app/30_demonstration.sql``) holds back any Approved demo missing
    ``sdg_division_id``/``effective_date``/``expiration_date`` instead of
    failing the whole build. Per the cutover scope decision this is reported,
    not gated: every held-back row is written per-row to
    ``reports/orphans/approved_demo_held_for_division.csv`` for SME review, and
    the status stays GREEN so a recorded, logged hold-back never blocks the
    gate. Vacuously GREEN before the staging view exists.
    """
    name = "13. Approved demos held back for missing required field"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_approved_demo_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no Approved hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT demonstration_id, medicaid_id, state_id, status_cd, "
        "sdg_division_cd, effective_date, expiration_date, reason "
        "FROM migration._parity_approved_demo_held ORDER BY medicaid_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no Approved demonstration was held back for a missing required field",
        )
    out: Path = REPORTS_DIR / "orphans" / "approved_demo_held_for_division.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "demonstration_id",
                "medicaid_id",
                "state_id",
                "status_cd",
                "sdg_division_cd",
                "effective_date",
                "expiration_date",
                "reason",
            ]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    # medicaid_id is column index 1; guard the slice so the check never raises
    # on an unexpectedly short row.
    sample = ", ".join(str(r[1]) for r in rows[:10] if len(r) > 1)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} Approved demonstration(s) held back for a missing required "
            f"field and logged per-row for SME review in {rel(out)} (non-gating); "
            f"medicaid_id(s): {sample}"
        ),
    )


def _demonstration_held_dup_medicaid(env: Env) -> CheckResult:
    """Check 21: demonstrations held back for a duplicate medicaid_id (non-gating log).

    Reads ``migration._parity_demonstration_held_dup_medicaid_id`` (created by
    ``sql/99_parity/14_demonstration_held_dup_medicaid.sql`` only when the
    staging view + crosswalks + state_region exist). DEMOS enforces
    ``demonstration_medicaid_id_key`` UNIQUE, but the source can carry the same
    ``mdcd_demo_num`` on two live demonstrations (RED-4). The loader
    (``sql/20_app/30_demonstration.sql``) loads one deterministic winner per
    medicaid_id and holds the rest back instead of failing the whole build. Per
    the cutover scope decision this is reported, not gated: every held-back row
    is written per-row to ``reports/orphans/demonstration_held_dup_medicaid.csv``
    for SME source-correction, and the status stays GREEN so a recorded, logged
    hold-back never blocks the gate. Vacuously GREEN before the staging view exists.
    """
    name = "21. Demonstrations held back for duplicate medicaid_id"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_demonstration_held_dup_medicaid_id') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no duplicate-medicaid_id hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT demonstration_id, legacy_demo_id, medicaid_id, state_id, status_cd, "
        "kept_legacy_demo_id, kept_demonstration_id, reason "
        "FROM migration._parity_demonstration_held_dup_medicaid_id ORDER BY medicaid_id, legacy_demo_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no demonstration was held back for a duplicate medicaid_id",
        )
    out: Path = REPORTS_DIR / "orphans" / "demonstration_held_dup_medicaid.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "demonstration_id",
                "legacy_demo_id",
                "medicaid_id",
                "state_id",
                "status_cd",
                "kept_legacy_demo_id",
                "kept_demonstration_id",
                "reason",
            ]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    # medicaid_id is column index 2; guard the slice so the check never raises.
    sample = ", ".join(str(r[2]) for r in rows[:10] if len(r) > 2)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} demonstration(s) held back as the non-winning row of a "
            f"duplicate medicaid_id and logged per-row for SME review in {rel(out)} "
            f"(non-gating); medicaid_id(s): {sample}"
        ),
    )


def _scope_coverage(env: Env) -> CheckResult:
    """Check 14: PMDA workflow scope coverage (non-gating informational log).

    Reads ``migration._scope_coverage`` (created by
    ``sql/99_parity/30_scope_coverage.sql`` once ``demos_app`` is built) and
    writes the full disposition + row-count table to
    ``reports/generated/scope_coverage.csv`` so a reviewer can see, at the gate, which
    PMDA workflows are BUILT vs deliberately DEFERRED / OUT-OF-SCOPE (mirrors
    the dispositions in ``reports/narrative/pending_approved_decisions.md``). Always
    GREEN: it reports coverage, it does not gate on it. Vacuously GREEN before
    ``demos_app`` is built.
    """
    name = "14. PMDA workflow scope coverage"
    exists = psql_query(
        env, "SELECT to_regclass('migration._scope_coverage') IS NOT NULL"
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="demos_app not built yet; no scope-coverage report (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT workflow, target_table, disposition, row_count "
        "FROM migration._scope_coverage ORDER BY target_table",
    )
    if not rows:
        return CheckResult(
            name=name, status="GREEN", detail="scope-coverage view present but empty"
        )
    out: Path = REPORTS_DIR / "generated" / "scope_coverage.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["workflow", "target_table", "disposition", "row_count"])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    dispositions = [str(r[2]) for r in rows if len(r) > 2]
    built = sum(1 for d in dispositions if d == "BUILT")
    partial = sum(1 for d in dispositions if d == "PARTIAL")
    deferred = sum(1 for d in dispositions if d == "DEFERRED")
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} target table(s): {built} BUILT, {partial} PARTIAL, "
            f"{deferred} DEFERRED; coverage written to {rel(out)} (non-gating)"
        ),
    )


def _deliverable_completeness(env: Env) -> CheckResult:
    """Check 15: every loadable PMDA deliverable is loaded into demos_app.

    Reads ``migration._parity_deliverable_completeness`` (created by
    ``sql/99_parity/41_deliverable_completeness.sql`` only when
    ``stg.deliverable_resolved`` exists). Any row is a resolved deliverable that
    is NOT a recorded hold-back yet is absent from ``demos_app.deliverable`` -- a
    migration bug. With the deliverable_type crosswalk authored, deliverables
    load; every non-loaded resolved row must carry a recorded hold-back reason,
    so this view stays empty. Vacuously GREEN before the staging view is built.
    """
    name = "15. Deliverable load completeness"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_deliverable_completeness') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no resolved deliverables to reconcile (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_deliverable_completeness",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every loadable PMDA deliverable is present in demos_app.deliverable (or recorded as held back)",
        )
    sample = psql_query(
        env,
        "SELECT legacy_id FROM migration._parity_deliverable_completeness "
        "ORDER BY legacy_id LIMIT 10",
    )
    ids = ", ".join(str(r[0]) for r in sample)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} loadable deliverable(s) were neither loaded nor held back; "
            f"legacy_id(s): {ids}; see view migration._parity_deliverable_completeness"
        ),
    )


def _deliverable_integrity(env: Env) -> CheckResult:
    """Check 16: every loaded demos_app.deliverable row is internally consistent.

    Reads ``migration._parity_deliverable_integrity`` (created by
    ``sql/99_parity/42_deliverable_integrity.sql`` only when
    ``stg.deliverable_resolved`` exists). Any row flags a deliverable whose
    ``demonstration_status_id`` is not 'Approved', whose owner person_type is not
    a CMS user type, whose ``(demonstration_id, demonstration_status_id)`` does
    not match an Approved demonstration, or whose
    ``(cms_owner_user_id, cms_owner_person_type_id)`` is not a real users row.
    The declared FKs enforce this once VALIDATEd; the view catches a loader
    regression by name. Expected empty (every loaded deliverable is consistent);
    vacuously GREEN before the staging view is built.
    """
    name = "16. Deliverable integrity"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_deliverable_integrity') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no loaded deliverables to check (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_deliverable_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "every demos_app.deliverable row has an Approved demonstration_status, a "
                "CMS owner person_type, a matching Approved demonstration, and a real owner"
            ),
        )
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} demos_app.deliverable row(s) violate the demonstration-status, "
            "owner person_type, composite demonstration, or owner-users invariant; see "
            "view migration._parity_deliverable_integrity"
        ),
    )


def _deliverable_held(env: Env) -> CheckResult:
    """Check 17: deliverables held back from the load (non-gating per-row log).

    Reads ``migration._parity_deliverable_held`` (created by
    ``sql/99_parity/40_deliverable_held.sql`` only when ``stg.deliverable_resolved``
    + the status and type crosswalks exist). The loader holds back any
    deliverable it cannot place (non-Approved parent, N/A status code 0, unmapped
    status, unresolvable due date, empty name, unmigrated creator, or a
    state-user owner). Per the cutover scope decision this is
    reported, not gated: every held-back row is written per-row to
    ``reports/orphans/deliverable_held.csv`` for SME review, and the status stays
    GREEN. Vacuously GREEN before the staging view is built.
    """
    name = "17. Deliverables held back"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_deliverable_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no deliverable hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT deliverable_id, legacy_id, demonstration_id, status_cd, reason "
        "FROM migration._parity_deliverable_held ORDER BY legacy_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no deliverable was held back from the load",
        )
    out: Path = REPORTS_DIR / "orphans" / "deliverable_held.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            ["deliverable_id", "legacy_id", "demonstration_id", "status_cd", "reason"]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    # legacy_id is column index 1; guard the slice so the check never raises on
    # an unexpectedly short row.
    sample = ", ".join(str(r[1]) for r in rows[:10] if len(r) > 1)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} deliverable(s) held back from the load and logged per-row for "
            f"SME review in {rel(out)} (non-gating); legacy_id(s): {sample}"
        ),
    )


def _deliverable_bn_qa(env: Env) -> CheckResult:
    """Deliverable BN routing QA (non-gating per-row log).

    Reads ``migration._parity_deliverable_bn_qa`` (created by
    ``sql/99_parity/43_deliverable_bn_qa.sql`` only when
    ``stg.deliverable_resolved`` exists). deliverable_type is routed purely by
    the report-occurrence code (57 = Quarterly BN, 70 = Annual BN); the legacy
    bdgt_ntrlty_ind flag and free-text name were retired as routing inputs. This
    surfaces every migratable deliverable whose type-based BN classification
    disagrees with the flag or the name, so an SME can review the mislabeled
    source signal. It is reported, not gated: rows are written per-row to
    ``reports/orphans/deliverable_bn_qa.csv`` and the status stays GREEN.
    Vacuously GREEN before the staging view is built.
    """
    name = "Deliverable BN routing QA"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_deliverable_bn_qa') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no BN routing disagreements to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT deliverable_id, legacy_id, deliverable_type_cd, demos_deliverable_type, "
        "bdgt_ntrlty_ind, name, reason "
        "FROM migration._parity_deliverable_bn_qa ORDER BY legacy_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no type-vs-flag/name BN disagreements among migratable deliverables",
        )
    out: Path = REPORTS_DIR / "orphans" / "deliverable_bn_qa.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "deliverable_id",
                "legacy_id",
                "deliverable_type_cd",
                "demos_deliverable_type",
                "bdgt_ntrlty_ind",
                "name",
                "reason",
            ]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    sample = ", ".join(str(r[1]) for r in rows[:10] if len(r) > 1)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} deliverable(s) with a type-vs-flag/name BN disagreement logged "
            f"per-row for SME review in {rel(out)} (non-gating); legacy_id(s): {sample}"
        ),
    )


def _pgm_dtl_tag_othr_held(env: Env) -> CheckResult:
    """Other-program demonstration-type tags held back (non-gating per-row log).

    Reads ``migration._parity_pgm_dtl_tag_othr_held`` (created by
    ``sql/99_parity/54_pgm_dtl_tag_othr_held.sql`` only when its inputs exist).
    ``mdcd_othr_pgm_dtl`` carries a per-row free-text program name; per the SME
    decision (2026-07-09) a name is turned into a demonstration-type tag only
    when it exactly equals a seeded tag, so 1115 demonstration names are held,
    never invented as tags. Every active source row that did not produce an
    assignment is written per-row to
    ``reports/orphans/pgm_dtl_tag_othr_held.csv`` for SME review; the status
    stays GREEN (reported, not gated). Vacuously GREEN before the view is built.
    """
    name = "Other-program demonstration-type tags held back"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_pgm_dtl_tag_othr_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="view not built yet; no other-program tag hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT legacy_id, legacy_demo_id, demonstration_id, othr_name, reason "
        "FROM migration._parity_pgm_dtl_tag_othr_held ORDER BY legacy_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no other-program tag row was held back from the load",
        )
    out: Path = REPORTS_DIR / "orphans" / "pgm_dtl_tag_othr_held.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            ["legacy_id", "legacy_demo_id", "demonstration_id", "othr_name", "reason"]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    sample = ", ".join(str(r[3]) for r in rows[:8] if len(r) > 3)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} other-program (mdcd_othr_pgm_dtl) row(s) held back and logged "
            f"per-row for SME review in {rel(out)} (non-gating); name(s): {sample}"
        ),
    )


def _pgm_dtl_tag_unseeded(env: Env) -> CheckResult:
    """pgm_dtl tag mapped-but-unseeded (fail-closed guard).

    Reads ``migration._parity_pgm_dtl_tag_unseeded`` (created by
    ``sql/99_parity/54_pgm_dtl_tag_othr_held.sql``). The fixed-tag fold loader
    (``sql/21_app_associative/10_demonstration_type_tag_assignment.sql``)
    silently skips (fail-open NOTICE) any ``crosswalk_pgm_dtl_tag`` mapping whose
    ``tag_name`` is not a seeded demonstration-type tag, which would drop that
    table's rows with no error. This makes that silent skip visible and fails the
    gate RED. Expected empty: the seven SME-approved tags absent from the DEMOS
    seed are created as User/Unapproved tags in
    ``sql/21_app_associative/05_demonstration_type_tags_user.sql``. Vacuously
    GREEN before the view is built.
    """
    name = "pgm_dtl tag mapped-but-unseeded"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_pgm_dtl_tag_unseeded') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="view not built yet; no pgm_dtl tag mappings to validate (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT source_table, tag_name FROM migration._parity_pgm_dtl_tag_unseeded "
        "ORDER BY source_table",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every mapped pgm_dtl tag_name resolves to a seeded demonstration-type tag",
        )
    detail = "; ".join(f"{r[0]} -> {r[1]!r}" for r in rows[:10])
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{len(rows)} pgm_dtl mapping(s) reference a tag_name that is not a seeded "
            f"demonstration-type tag (the fold loader would silently skip them): {detail}; "
            "create the tag (see sql/21_app_associative/05) or blank the mapping"
        ),
    )


def _comment_completeness(env: Env) -> CheckResult:
    """Comment load completeness (loadable-but-unloaded rows).

    Reads ``migration._parity_comment_completeness`` (created by
    ``sql/99_parity/45_comment_completeness.sql`` only when
    ``stg.comment_resolved`` exists). Any row is a resolved comment that is NOT a
    recorded hold-back yet is absent from both demos_app.private_comment and
    demos_app.public_comment -- a migration bug. Comments cascade from
    deliverables; every non-loaded resolved comment must carry a recorded
    hold-back reason, so this view stays empty. Vacuously GREEN before the
    staging view is built.
    """
    name = "Comment load completeness"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_comment_completeness') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no resolved comments to reconcile (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_comment_completeness",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every loadable deliverable comment is present in a comment table (or recorded as held back)",
        )
    sample = psql_query(
        env,
        "SELECT legacy_id FROM migration._parity_comment_completeness "
        "ORDER BY legacy_id LIMIT 10",
    )
    ids = ", ".join(str(r[0]) for r in sample)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} loadable comment(s) were neither loaded nor held back; "
            f"legacy_id(s): {ids}; see view migration._parity_comment_completeness"
        ),
    )


def _comment_integrity(env: Env) -> CheckResult:
    """Comment integrity: every loaded comment is internally consistent.

    Reads ``migration._parity_comment_integrity`` (created by
    ``sql/99_parity/46_comment_integrity.sql`` only when ``stg.comment_resolved``
    exists). Any row flags a comment whose deliverable_id is not a loaded
    deliverable, whose public author is not a real users row, or whose private
    author is not a real CMS users row. The declared FKs enforce this once
    VALIDATEd; the view catches a loader regression by name. Expected empty
    (every loaded comment is consistent); vacuously GREEN before the staging
    view is built.
    """
    name = "Comment integrity"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_comment_integrity') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no loaded comments to check (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_comment_integrity",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail=(
                "every loaded comment has a real deliverable, a real author, and "
                "(for private_comment) a CMS author person_type"
            ),
        )
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} loaded comment(s) violate the deliverable, author-users, or "
            "private-author person_type invariant; see view migration._parity_comment_integrity"
        ),
    )


def _comment_held(env: Env) -> CheckResult:
    """Comments held back from the load (non-gating per-row log).

    Reads ``migration._parity_comment_held`` (created by
    ``sql/99_parity/44_comment_held.sql`` only when ``stg.comment_resolved``
    exists). The loader holds back any comment it cannot place (parent
    deliverable not loaded, unresolved author, empty content, or a private route
    with a non-CMS author). Per the cutover scope
    decision this is reported, not gated: every held-back row is written per-row
    to ``reports/orphans/comment_held.csv`` for SME review, and the status stays
    GREEN. Vacuously GREEN before the staging view is built.
    """
    name = "Comments held back"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_comment_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no comment hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT comment_id, legacy_id, deliverable_id, source, origin_cd, reason "
        "FROM migration._parity_comment_held ORDER BY source, legacy_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no comment was held back from the load",
        )
    out: Path = REPORTS_DIR / "orphans" / "comment_held.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            ["comment_id", "legacy_id", "deliverable_id", "source", "origin_cd", "reason"]
        )
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    sample = ", ".join(str(r[1]) for r in rows[:10] if len(r) > 1)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} comment(s) held back from the load and logged per-row for "
            f"SME review in {rel(out)} (non-gating); legacy_id(s): {sample}"
        ),
    )


def _override_note_completeness(env: Env) -> CheckResult:
    """Override-note load completeness (loadable-but-unloaded rows).

    Reads ``migration._parity_override_note_completeness`` (created by
    ``sql/99_parity/48_override_note.sql`` only when
    ``stg.override_note_resolved`` + the held view exist). Any row is a resolved
    budget-neutrality override note that is NOT a recorded hold-back yet is
    absent from demos_app.private_comment -- a migration bug. Vacuously GREEN
    before the staging view is built.
    """
    name = "Override-note load completeness"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_override_note_completeness') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no resolved override notes to reconcile (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT count(*) FROM migration._parity_override_note_completeness",
    )
    count = int(rows[0][0]) if rows else 0
    if count == 0:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every loadable override note is present in demos_app.private_comment (or recorded as held back)",
        )
    sample = psql_query(
        env,
        "SELECT legacy_id FROM migration._parity_override_note_completeness "
        "ORDER BY legacy_id LIMIT 10",
    )
    ids = ", ".join(str(r[0]) for r in sample)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{count} loadable override note(s) were neither loaded nor held back; "
            f"legacy_id(s): {ids}; see view migration._parity_override_note_completeness"
        ),
    )


def _override_note_held(env: Env) -> CheckResult:
    """Override notes held back from the load (non-gating per-row log).

    Reads ``migration._parity_override_note_held`` (created by
    ``sql/99_parity/48_override_note.sql`` only when
    ``stg.override_note_resolved`` exists). The loader holds back any override
    note it cannot place (parent deliverable not loaded, unresolved author,
    non-CMS author, or empty content). Per the cutover scope decision this is
    reported, not gated: every held-back row is written per-row to
    ``reports/orphans/override_note_held.csv`` for SME review, and the status
    stays GREEN. Vacuously GREEN before the staging view is built.
    """
    name = "Override notes held back"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_override_note_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no override-note hold-backs to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT comment_id, legacy_id, deliverable_id, reason "
        "FROM migration._parity_override_note_held ORDER BY legacy_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no override note was held back from the load",
        )
    out: Path = REPORTS_DIR / "orphans" / "override_note_held.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["comment_id", "legacy_id", "deliverable_id", "reason"])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    sample = ", ".join(str(r[1]) for r in rows[:10] if len(r) > 1)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} override note(s) held back from the load and logged per-row for "
            f"SME review in {rel(out)} (non-gating); legacy_id(s): {sample}"
        ),
    )


def _comment_routing_coverage(env: Env) -> CheckResult:
    """Comment routing coverage: cmt_orgn_cd codes not yet mapped (non-gating).

    Reads ``migration._parity_comment_routing_coverage`` (created by
    ``sql/99_parity/47_comment_routing_coverage.sql`` only when
    ``stg.comment_resolved`` exists). The cmt_orgn_cd -> route crosswalk is
    deliberately gated/empty until SME sign-off, so this lists each origin code
    the source uses that has no route yet, with its comment count, written to
    ``reports/orphans/comment_routing_coverage.csv``. NON-GATING: an unmapped
    code is expected today, so the status stays GREEN. Vacuously GREEN before the
    staging view is built.
    """
    name = "Comment routing coverage"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_comment_routing_coverage') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="staging view not built yet; no comment origin codes to reconcile (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT origin_cd, comment_count FROM migration._parity_comment_routing_coverage "
        "ORDER BY comment_count DESC, origin_cd",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every used cmt_orgn_cd code has a route in crosswalk_comment_origin",
        )
    out: Path = REPORTS_DIR / "orphans" / "comment_routing_coverage.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["origin_cd", "comment_count"])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    codes = ", ".join(str(r[0]) for r in rows)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} cmt_orgn_cd code(s) not yet mapped in crosswalk_comment_origin "
            f"(gated; author-default routing applies); codes: {codes}; logged in {rel(out)} (non-gating)"
        ),
    )


def _state_region_source_drift(env: Env) -> CheckResult:
    """Check 18: state -> CMS region seed vs source drift (non-gating log).

    Reads ``migration._parity_state_region_drift`` (created by
    ``sql/99_parity/50_state_region_source_drift.sql`` only when both the
    pgloaded ``mysql_raw.geo_ansi_state_rfrnc`` and the ``migration.state_region``
    seed exist). The migration's ``state_region`` seed is the authoritative
    source for the ``11-W-NNNNN/R`` region segment; the CMA audit (R4) surfaced
    ``geo_ansi_state_rfrnc.rgnl_ofc_cd`` as the source-of-truth column. This
    cross-checks them. Per the audit's framing the seed is deliberately
    authoritative, so any divergence is reported per-row to
    ``reports/orphans/state_region_drift.csv`` for review, and the status stays
    GREEN. Vacuously GREEN before the source/seed exist.
    """
    name = "18. State-region seed vs source drift"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_state_region_drift') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="source/seed not present yet; no state-region drift to log (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT state_id, seed_region, source_region, reason "
        "FROM migration._parity_state_region_drift ORDER BY state_id",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="state_region seed matches the source geo_ansi_state_rfrnc.rgnl_ofc_cd",
        )
    out: Path = REPORTS_DIR / "orphans" / "state_region_drift.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["state_id", "seed_region", "source_region", "reason"])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    sample = ", ".join(str(r[0]) for r in rows[:10] if len(r) > 0)
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} state(s) diverge between the state_region seed and the source "
            f"rgnl_ofc_cd; logged per-row for review in {rel(out)} (non-gating); "
            f"state(s): {sample}"
        ),
    )


def _amendment_load(env: Env) -> CheckResult:
    """Check 19: amendment load accounting (non-gating log).

    Reads the views created by ``sql/99_parity/52_amendment_load.sql`` only when
    the amendment staging view, crosswalk, and demonstration table all exist:
    ``migration._parity_amendment_held`` (amendments excluded because their parent
    demonstration is not loaded), ``_parity_amendment_signature_dropped`` (legacy
    OGD/DD signatures NULLed -- DEMOS bars them on amendments),
    ``_parity_amendment_name_synthesized`` (loaded amendments whose NULL/empty
    source name was replaced with a synthesized ``<parent> Amendment (effective
    DATE)`` name), and ``_parity_amendment_phase_derived`` (per-status tally of the
    status-derived ``current_phase_id`` for SME ratification). All are deliberate,
    documented loader choices, so any rows are reported per-row to
    ``reports/orphans/amendment_held.csv`` / ``amendment_signature_dropped.csv`` /
    ``amendment_name_synthesized.csv`` and the status stays GREEN. Vacuously GREEN
    before the views exist.
    """
    name = "19. Amendment load accounting"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_amendment_held') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="amendment staging/crosswalk not present yet; nothing to account for (vacuously green)",
        )

    held = psql_query(
        env,
        "SELECT amendment_uuid, demo_uuid, name, reason "
        "FROM migration._parity_amendment_held ORDER BY amendment_uuid",
    )
    dropped = psql_query(
        env,
        "SELECT amendment_uuid, name, signature_cd "
        "FROM migration._parity_amendment_signature_dropped ORDER BY amendment_uuid",
    )
    synthesized = psql_query(
        env,
        "SELECT amendment_uuid, demo_uuid, parent_demonstration_name, "
        "effective_date, synthesized_name "
        "FROM migration._parity_amendment_name_synthesized ORDER BY amendment_uuid",
    )
    phases = psql_query(
        env,
        "SELECT status_id, derived_phase, n "
        "FROM migration._parity_amendment_phase_derived ORDER BY derived_phase",
    )

    orphans_dir: Path = REPORTS_DIR / "orphans"
    if held:
        orphans_dir.mkdir(parents=True, exist_ok=True)
        out_held = orphans_dir / "amendment_held.csv"
        with out_held.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["amendment_uuid", "demo_uuid", "name", "reason"])
            for r in held:
                w.writerow(["" if v is None else v for v in r])
    if dropped:
        orphans_dir.mkdir(parents=True, exist_ok=True)
        out_dropped = orphans_dir / "amendment_signature_dropped.csv"
        with out_dropped.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["amendment_uuid", "name", "signature_cd"])
            for r in dropped:
                w.writerow(["" if v is None else v for v in r])
    if synthesized:
        orphans_dir.mkdir(parents=True, exist_ok=True)
        out_synth = orphans_dir / "amendment_name_synthesized.csv"
        with out_synth.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(
                [
                    "amendment_uuid",
                    "demo_uuid",
                    "parent_demonstration_name",
                    "effective_date",
                    "synthesized_name",
                ]
            )
            for r in synthesized:
                w.writerow(["" if v is None else v for v in r])

    phase_summary = (
        "; ".join(f"{p[1]}={p[2]}" for p in phases if len(p) >= 3) or "none loaded"
    )
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(held)} amendment(s) held back (parent demonstration not loaded), "
            f"{len(dropped)} signature(s) dropped to NULL (OGD/DD), "
            f"{len(synthesized)} name(s) synthesized (source null/empty), logged per-row in "
            f"{rel(orphans_dir)} (non-gating); derived phase tally: {phase_summary}"
        ),
    )


def _amendment_unmapped_status(env: Env) -> CheckResult:
    """Amendment unmapped/NULL status (fail-closed guard).

    Reads ``migration._parity_amendment_unmapped_status`` (created by
    ``sql/99_parity/52_amendment_load.sql``). The amendment loader
    (``sql/20_app/35_amendment.sql``) joins ``stg.amendment_resolved`` to
    ``mysql_raw.crosswalk_amendment_status`` with an INNER join on ``status_cd``,
    so a staged amendment whose ``status_cd`` is NULL or absent from the
    crosswalk is dropped from the load with no error and no held-row log -- and
    check 19's accounting views share that same inner join, so the drop is
    invisible there too. This guard captures every such amendment that HAS a
    loaded parent demonstration (i.e. would otherwise load) and fails the gate
    RED so an unmapped/NULL amendment status can never silently vanish; the
    dropped rows are logged per-row to
    ``reports/orphans/amendment_unmapped_status.csv`` for SME disposition.
    Vacuously GREEN before the view is built.
    """
    name = "Amendment unmapped/NULL status"
    exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_amendment_unmapped_status') IS NOT NULL",
    )
    if not exists or not exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="view not built yet; no amendment statuses to validate (vacuously green)",
        )
    rows = psql_query(
        env,
        "SELECT amendment_uuid, demo_uuid, name, status_cd "
        "FROM migration._parity_amendment_unmapped_status ORDER BY amendment_uuid",
    )
    if not rows:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="every staged amendment with a loaded parent maps to a crosswalk status",
        )
    out: Path = REPORTS_DIR / "orphans" / "amendment_unmapped_status.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["amendment_uuid", "demo_uuid", "name", "status_cd"])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])
    n_null = sum(1 for r in rows if len(r) > 3 and r[3] is None)
    return CheckResult(
        name=name,
        status="RED",
        detail=(
            f"{len(rows)} staged amendment(s) with a loaded parent were dropped by the "
            f"loader's inner JOIN to crosswalk_amendment_status (status_cd NULL={n_null} "
            f"or unmapped); logged per-row to {rel(out)} (fail-closed). Define an SME "
            "status disposition for these rows, or they silently vanish from demos_app.amendment"
        ),
    )


def _medicaid_gov_1115_parity(env: Env) -> CheckResult:
    """Check 20: medicaid.gov 1115 outcome-fact cross-check (non-gating log).

    Loads the pre-matched snapshot CSV (``reports/medicaid_gov_1115_snapshot.csv``,
    produced by the document-ocr ``extract-facts`` command) into
    ``migration._medicaid_gov_1115_snapshot``, then reads the parity view
    ``migration._parity_medicaid_gov_1115`` which LEFT JOINs to the current
    ``demos_app.demonstration`` + ``application_date`` and surfaces any
    discrepancy between the published medicaid.gov facts (Status, Approval
    Date, Effective Date, Expiration Date) and the migrated target. Also
    surfaces ``mg_only`` (on medicaid.gov but not migrated) and
    ``migrated_only`` rows, plus ambiguous fuzzy-match runner-ups.

    All discrepancies are review signals, not build failures: medicaid.gov
    data may legitimately lag or differ from the internal CMS data. Per-row
    drift is logged to ``reports/orphans/medicaid_gov_1115_drift.csv`` and the
    status stays GREEN. Vacuously GREEN when the snapshot CSV is not committed.
    """
    import psycopg

    name = "20. Medicaid.gov 1115 outcome-fact parity"
    csv_path = REPORTS_DIR / "medicaid_gov_1115_snapshot.csv"
    if not csv_path.exists():
        return CheckResult(
            name=name,
            status="GREEN",
            detail="no medicaid.gov 1115 snapshot CSV committed; nothing to cross-check (vacuously green)",
        )

    # Load the snapshot CSV into the table (TRUNCATE + COPY for re-run safety).
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        conn.execute("TRUNCATE migration._medicaid_gov_1115_snapshot")
        copy_csv_into_table(conn, "migration", "_medicaid_gov_1115_snapshot", csv_path)

    view_exists = psql_query(
        env,
        "SELECT to_regclass('migration._parity_medicaid_gov_1115') IS NOT NULL",
    )
    if not view_exists or not view_exists[0][0]:
        return CheckResult(
            name=name,
            status="GREEN",
            detail="snapshot loaded but parity view not created (demos_app.demonstration absent); vacuously green",
        )

    rows = psql_query(
        env,
        "SELECT match_status, mg_state, mg_name, mg_status, "
        "mg_approval_date, mg_effective_date, mg_expiration_date, "
        "matched_medicaid_id, mig_name, discrepancy "
        "FROM migration._parity_medicaid_gov_1115 ORDER BY match_status, mg_state",
    )
    if not rows:
        # Read the scrape date for the detail string.
        manifest_path = csv_path.with_suffix(".meta.json")
        scrape_date = _read_snapshot_date(manifest_path)
        return CheckResult(
            name=name,
            status="GREEN",
            detail=f"medicaid.gov 1115 snapshot matches the migrated target (no discrepancies; scraped {scrape_date})",
        )

    out: Path = REPORTS_DIR / "orphans" / "medicaid_gov_1115_drift.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "match_status", "mg_state", "mg_name", "mg_status",
            "mg_approval_date", "mg_effective_date", "mg_expiration_date",
            "matched_medicaid_id", "mig_name", "discrepancy",
        ])
        for r in rows:
            w.writerow(["" if v is None else v for v in r])

    manifest_path = csv_path.with_suffix(".meta.json")
    scrape_date = _read_snapshot_date(manifest_path)
    counts: dict[str, int] = {}
    for r in rows:
        status = r[0] or "unknown"
        counts[status] = counts.get(status, 0) + 1
    summary = ", ".join(f"{k}={v}" for k, v in sorted(counts.items()))
    return CheckResult(
        name=name,
        status="GREEN",
        detail=(
            f"{len(rows)} discrepancy/discrepancies from medicaid.gov 1115 snapshot "
            f"(scraped {scrape_date}); logged per-row in {rel(out)} (non-gating); "
            f"breakdown: {summary}"
        ),
    )


def _read_snapshot_date(manifest_path: Path) -> str:
    """Read the scrape timestamp from the .meta.json sidecar; 'unknown' if absent."""
    if not manifest_path.exists():
        return "unknown"
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
        return str(data.get("generated_at", "unknown"))
    except (json.JSONDecodeError, OSError):
        return "unknown"


def build_parity_report(env: Env) -> ParityReport:
    """Apply parity SQL, run every check, write the report, and return it.

    Applies ``sql/99_parity/*`` so the views the Python checks read are
    current, aggregates the checks into a :class:`ParityReport`, and writes a
    timestamped markdown copy to ``reports/runs/parity_<stamp>.md``. This does NOT
    gate: it marks no gate and never :func:`die`s, so it is safe to call from
    the read-only ``diagnose`` command. The gating decision lives in
    :func:`run_parity`.
    """
    apply_dir(env, SQL_DIR / "99_parity")

    report = ParityReport(generated_at=ts())
    checks: tuple[tuple[str, Callable[[Env], CheckResult]], ...] = (
        ("row-count parity", _row_count_parity),
        ("numeric-sum parity", _numeric_sum_parity),
        ("jsonb shape", _jsonb_shape),
        ("pending/approved audit", _pending_approved_audit),
        ("orphans", _orphans),
        ("demonstration id provenance", _demonstration_id_provenance),
        ("users/person integrity", _users_person_integrity),
        ("demonstration completeness", _demonstration_completeness),
        ("demonstration phase derivation", _demonstration_phase_derived),
        ("system-role assignment integrity", _system_role_assignment_integrity),
        ("person/state integrity", _person_state_integrity),
        ("active-users coverage", _active_users_coverage),
        ("demonstration-role assignment integrity", _demonstration_role_assignment_integrity),
        ("approved demo held for division", _approved_demo_held_for_division),
        ("scope coverage", _scope_coverage),
        ("deliverable completeness", _deliverable_completeness),
        ("deliverable integrity", _deliverable_integrity),
        ("deliverable held", _deliverable_held),
        ("deliverable BN QA", _deliverable_bn_qa),
        ("pgm_dtl othr held", _pgm_dtl_tag_othr_held),
        ("pgm_dtl tag unseeded", _pgm_dtl_tag_unseeded),
        ("comment completeness", _comment_completeness),
        ("comment integrity", _comment_integrity),
        ("comment held", _comment_held),
        ("override-note completeness", _override_note_completeness),
        ("override-note held", _override_note_held),
        ("comment routing coverage", _comment_routing_coverage),
        ("state/region source drift", _state_region_source_drift),
        ("amendment load", _amendment_load),
        ("amendment unmapped status", _amendment_unmapped_status),
        ("medicaid.gov 1115 parity", _medicaid_gov_1115_parity),
        ("demonstration dup-medicaid hold-back", _demonstration_held_dup_medicaid),
    )
    with progress_for(len(checks), "parity") as p:
        for label, check in checks:
            p.step(label)
            report.checks.append(check(env))

    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    out: Path = RUNS_DIR / f"parity_{file_stamp()}.md"
    out.write_text(report.to_markdown(), encoding="utf-8")
    report.report_path = out
    log(f"wrote {rel(out)} -- OVERALL: {report.overall}")
    return report


def run_parity(accept_pending: bool = False) -> None:
    """Run P6: build the parity report, then conditionally mark the gate.

    Requires the ``constraints`` gate. Delegates the SQL apply + checks +
    report write to :func:`build_parity_report`, then gates on the rollup.

    The ``parity`` gate is marked when the overall status is GREEN, or
    when ``accept_pending`` is true and the overall status is PENDING
    (logged as a WARN listing the pending checks). RED never marks, and a
    non-GREEN outcome that does not mark the gate hard-fails via
    :func:`die` so a RED parity (or a PENDING one run without
    ``--accept-pending``) cannot exit 0 and let ``make rebuild`` or a CI
    job declare success over it (CODE_REVIEW H2).
    """
    env = Env.load()
    require_gate("constraints")

    report = build_parity_report(env)

    if report.overall == "GREEN":
        mark_gate("parity")
        return

    if report.overall == "PENDING" and accept_pending:
        log("WARN: parity gate accepted with PENDING checks: " + "; ".join(report.pending_checks))
        mark_gate("parity")
        return

    where = rel(report.report_path) if report.report_path is not None else "the latest reports/runs/parity_*.md"
    hint = "" if report.overall == "RED" else " (pass --accept-pending for a dress rehearsal)"
    die(f"parity gate not green ({report.overall}); review {where} and do not proceed{hint}")
