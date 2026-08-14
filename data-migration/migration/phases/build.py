"""P3: build stg + demos_app from mysql_raw."""

from __future__ import annotations

import json
from pathlib import Path

import psycopg
from psycopg import sql

from migration.lib import (
    PRISMA_SEEDED_TABLES_FILE,
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
    psql_file,
    psql_files,
    rel,
    require_gate,
    truncate_schema_data,
)

# Crosswalk completeness checks re-run against the post-delta source during
# build_stg. The crosswalks phase runs these once in Week 1, but the cutover
# chain (freeze -> delta -> build_stg) never revisits them, so a code that
# first appears in the final delta would otherwise map silently (H4).
CROSSWALK_CHECKS = (
    "04_crosswalks/11_demo_status_check.sql",
    "04_crosswalks/21_state_check.sql",
    "04_crosswalks/61_application_type_check.sql",
    "04_crosswalks/63_sdg_division_check.sql",
    "04_crosswalks/13_application_status_check.sql",
    "04_crosswalks/67_document_type_check.sql",
)

# Subdirectories of sql/ applied as one atomic unit during run_build_app.
APP_BUILD_DIRS = ("20_app", "21_app_associative", "23_app_derived")

# Fallback exclude patterns used only when the Prisma-seeded-tables
# capture (state/prisma_seeded_tables.json) is unavailable -- they cover
# the *_status / *_type lookup tables but NOT the many Prisma-seeded
# tables that match neither (state, role, phase, *_limit, ...). See B8.
_FALLBACK_EXCLUDE_PATTERNS = ("%_status", "%_type")

# entity -> (mysql_raw source table, source PK column) used to validate that
# every keep/drop override id actually exists. The contact entities are keyed
# at the demo grain (their tables have no surrogate id), matching the views.
_OVERRIDE_SOURCE = {
    "mdcd_demo": ("mdcd_demo", "mdcd_demo_id"),
    "mdcd_pendg_demo": ("mdcd_pendg_demo", "mdcd_pendg_demo_id"),
    "mdcd_demo_aplctn": ("mdcd_demo_aplctn", "mdcd_demo_aplctn_id"),
    "mdcd_demo_amndmt": ("mdcd_demo_amndmt", "mdcd_demo_amndmt_id"),
    "mdcd_demo_rnwl": ("mdcd_demo_rnwl", "mdcd_demo_rnwl_id"),
    "mdcd_dlvrbl": ("mdcd_dlvrbl", "mdcd_dlvrbl_id"),
    "mdcd_demo_cntct": ("mdcd_demo_cntct", "mdcd_demo_id"),
    "mdcd_pendg_demo_cntct": ("mdcd_pendg_demo_cntct", "mdcd_pendg_demo_id"),
    "users": ("users", "id"),
}

FILTER_DIR = REPORTS_DIR / "filter"


def _assert_overrides_exist(conn: psycopg.Connection) -> None:
    """Fail if any keep/drop override references an id absent from its source.

    A force-keep id that does not exist in ``mysql_raw`` would otherwise sail
    through the filter view's ``keep`` union and (for the demo anchors) mint a
    permanent UUID for a phantom row. Validated here, on the same connection
    that loaded the overrides, so the build dies loudly with the full offender
    list instead of silently fabricating data (CODE_REVIEW H5).
    """
    unknown: list[str] = []
    missing: list[str] = []
    for list_name, table in (("keep", "_keep_ids"), ("drop", "_drop_ids")):
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("SELECT DISTINCT entity FROM {}").format(sql.Identifier("stg", table))
            )
            entities = [r[0] for r in cur.fetchall()]
        for entity in entities:
            mapping = _OVERRIDE_SOURCE.get(entity)
            if mapping is None:
                unknown.append(f"  {list_name}: unknown entity {entity!r}")
                continue
            src_table, pk = mapping
            with conn.cursor() as cur:
                cur.execute(
                    sql.SQL(
                        "SELECT o.legacy_id FROM {ov} o WHERE o.entity = %s "
                        "AND NOT EXISTS (SELECT 1 FROM {src} s WHERE s.{pk} = o.legacy_id) "
                        "ORDER BY o.legacy_id"
                    ).format(
                        ov=sql.Identifier("stg", table),
                        src=sql.Identifier("mysql_raw", src_table),
                        pk=sql.Identifier(pk),
                    ),
                    (entity,),
                )
                missing.extend(
                    f"  {list_name}: {entity} legacy_id={legacy_id} not in mysql_raw.{src_table}"
                    for (legacy_id,) in cur.fetchall()
                )

    if unknown or missing:
        die("filter override(s) reference rows absent from the source:\n" + "\n".join(unknown + missing))


def _load_override_csv(conn: psycopg.Connection, table: str, csv_path: Path) -> int:
    """COPY a single override CSV into `stg.<table>`. Returns row count.

    A missing CSV is a legitimate no-op (the operator may not have overrides);
    a present-but-malformed CSV dies via ``copy_csv_into_table`` (CODE_REVIEW
    M2: never silently skip a file the operator intended to use).
    """
    if not csv_path.exists():
        log(f"override csv not present, skipping: {rel(csv_path)}")
        return 0
    return copy_csv_into_table(
        conn,
        "stg",
        table,
        csv_path,
        header_expect=["entity", "legacy_id", "reason"],
    )


def load_filter_overrides(env: Env) -> None:
    """Load reports/filter/{keep,drop}_ids.csv into stg._keep_ids / stg._drop_ids.

    The tables are created and truncated by sql/10_stg/00_keep_drop_ids.sql
    earlier in the build; this step populates them. Empty CSVs (header only)
    are a no-op. After loading, every override id is validated to exist in
    its source table (see :func:`_assert_overrides_exist`).
    """
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        keep_n = _load_override_csv(conn, "_keep_ids", FILTER_DIR / "keep_ids.csv")
        drop_n = _load_override_csv(conn, "_drop_ids", FILTER_DIR / "drop_ids.csv")
        _assert_overrides_exist(conn)
    log(f"filter overrides loaded: keep={keep_n} drop={drop_n}")


_TABLE_HEADER = (
    "| entity | legacy_id | failed_rule | source_value | severity | restored_by |\n"
    "| --- | --- | --- | --- | --- | --- |"
)


def emit_filter_report(env: Env) -> Path:
    """Run the report query in 99_filter_report.sql and write the markdown file.

    The report has two sections: "Flagged for review" (severity
    ``review-required``) listed first for SME triage, then "Auto-dropped
    (test data)" (severity ``auto-drop``) for completeness. Rows kept by
    ``keep_ids.csv`` are listed in their natural severity section with a
    ``restored_by`` marker; they do not count toward the excluded total.
    """
    report = RUNS_DIR / f"filter_{file_stamp()}.md"
    report.parent.mkdir(parents=True, exist_ok=True)

    review_rows: list[str] = []
    autodrop_rows: list[str] = []
    review_excluded = 0
    autodrop_excluded = 0
    force_kept = 0

    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT
              v.entity,
              v.legacy_id,
              v.failed_rule,
              v.source_value,
              v.severity,
              CASE
                WHEN k.legacy_id IS NOT NULL THEN 'keep_ids.csv'
                WHEN d.legacy_id IS NOT NULL THEN 'drop_ids.csv'
                ELSE ''
              END AS restored_by
            FROM stg._filter_violations v
            LEFT JOIN stg._keep_ids k
              ON k.entity = v.entity AND k.legacy_id = v.legacy_id
            LEFT JOIN stg._drop_ids d
              ON d.entity = v.entity AND d.legacy_id = v.legacy_id
            ORDER BY v.severity, v.entity, v.legacy_id, v.failed_rule
        """)
        for entity, legacy_id, rule, source_value, severity, restored_by in cur.fetchall():
            kept_by_override = restored_by == "keep_ids.csv"
            if kept_by_override:
                force_kept += 1
            elif severity == "auto-drop":
                autodrop_excluded += 1
            else:
                review_excluded += 1
            src = (source_value or "").replace("|", r"\|")
            row = f"| {entity} | {legacy_id} | {rule} | {src} | {severity} | {restored_by} |"
            if severity == "auto-drop":
                autodrop_rows.append(row)
            else:
                review_rows.append(row)

    lines: list[str] = [
        "# Row-level filter report",
        "",
        "Generated by `migrate build-stg`. One row per excluded legacy id.",
        "",
        "## Flagged for review",
        "",
        "Non-`test` values that fail the canonical regex (or violate any other",
        "review-required rule). SME triage: confirm exclusion, force-keep via",
        "`reports/filter/keep_ids.csv`, or fix the rule.",
        "",
        _TABLE_HEADER,
    ]
    lines.extend(review_rows)
    lines += [
        "",
        "## Auto-dropped (test data)",
        "",
        "Project-number values containing the substring `test`",
        "(case-insensitive). Silently excluded; listed here only for",
        "completeness.",
        "",
        _TABLE_HEADER,
    ]
    lines.extend(autodrop_rows)
    lines += [
        "",
        f"**Flagged for review:** {review_excluded}",
        f"**Auto-dropped (test):** {autodrop_excluded}",
        f"**Force-kept by `keep_ids.csv`:** {force_kept}",
        "",
        "## Sign-off",
        "",
        "- Reviewer: __________________",
        "- Date: __________________",
        "- Notes: __________________",
        "",
    ]
    report.write_text("\n".join(lines), encoding="utf-8")
    log(f"filter report written: {rel(report)}")
    return report


def run_build_stg() -> None:
    """Run P3a: rebuild ``stg.*`` from ``mysql_raw`` and emit the filter report.

    Requires the ``delta`` gate: the cutover chain must not build (and
    ultimately flip) on a pre-freeze snapshot. This is the first check so
    it hard-fails before any DB I/O when the final delta load has not run.

    Re-runs the crosswalk completeness checks against the post-delta
    source (the cutover chain never revisits the crosswalks phase), then
    truncates ``stg`` data tables, applies the id-map and stg SQL
    directories, loads keep/drop ID overrides, writes a timestamped
    filter report, and marks the ``build_stg`` gate.
    """
    require_gate("delta")
    env = Env.load()

    log("re-validating crosswalk completeness against post-delta data")
    for rel_path in CROSSWALK_CHECKS:
        psql_file(env, SQL_DIR / rel_path)

    log("truncating stg.* data tables")
    truncate_schema_data(env, "stg")

    apply_dir(env, SQL_DIR / "05_id_maps")
    apply_dir(env, SQL_DIR / "10_stg")

    # Per-anchor filter views are now defined in stg; CSV overrides are
    # populated here, after the override tables exist and are truncated by
    # 00_keep_drop_ids.sql. The filter report is regenerated from the
    # current state of mysql_raw plus the just-loaded overrides.
    load_filter_overrides(env)
    emit_filter_report(env)

    mark_gate("build_stg")


def _collect_app_files() -> list[Path]:
    """Return the lexically sorted ``*.sql`` files from every demos_app build dir."""
    files: list[Path] = []
    for sub in APP_BUILD_DIRS:
        d = SQL_DIR / sub
        if d.is_dir():
            files.extend(sorted(d.glob("*.sql")))
        else:
            log(f"skip: directory not present: {d}")
    return files


def _load_seeded_tables() -> list[str]:
    """Return the Prisma-seeded reference tables captured at ddl time.

    Empty list when the capture file is absent (e.g. ddl predates this
    guard); callers fall back to the coarse exclude patterns.
    """
    if not PRISMA_SEEDED_TABLES_FILE.exists():
        return []
    data = json.loads(PRISMA_SEEDED_TABLES_FILE.read_text(encoding="utf-8"))
    return [str(t) for t in data]


def _drop_demos_app_fks(env: Env) -> None:
    """Drop every live ``demos_app.*`` FK before the build_app truncation (H1).

    On a re-run after the constraints phase has re-added and VALIDATEd the
    Prisma FKs, ``truncate_schema_data``'s ``TRUNCATE ... CASCADE`` would
    cascade through those FKs into the *excluded* Prisma-seeded lookups,
    wiping data the seeded-table guard exists to protect (CODE_REVIEW H1).
    Dropping the FKs first leaves CASCADE nothing to follow. Symmetric with
    ``init_pg.run_ddl``'s capture-then-drop; the constraints phase re-adds them
    from ``state/prisma_fks.json``. On the first build (FKs already dropped at
    ddl time) this is a no-op.
    """
    from migration.phases import init_pg

    init_pg._drop_fks(env, init_pg._capture_fks(env))


def run_build_app() -> None:
    """Run P3b: rebuild ``demos_app.*`` from ``stg`` in one transaction.

    Requires the ``build_stg`` gate. First drops any re-added ``demos_app``
    FKs so the truncation cannot cascade into excluded seeded lookups (H1).
    Truncates ``demos_app`` *data* tables while preserving the Prisma-seeded
    reference tables captured at ddl time
    (``state/prisma_seeded_tables.json``); the bulk build only repopulates
    the data tables and references those lookups, so wiping them would break
    every FK at the constraints phase (B8). Then applies every collected SQL
    file in a single deferred-constraint transaction and marks the
    ``build_app`` gate on success.
    """
    env = Env.load()
    require_gate("build_stg")

    # Drop any re-added demos_app FKs first so the truncation below cannot
    # cascade through a validated FK into an excluded seeded lookup (H1).
    _drop_demos_app_fks(env)

    seeded = _load_seeded_tables()
    if seeded:
        log(
            f"truncating demos_app.* data tables; preserving {len(seeded)} "
            "Prisma-seeded reference tables"
        )
        truncate_schema_data(env, "demos_app", exclude_tables=seeded)
    else:
        log(
            "WARNING: state/prisma_seeded_tables.json missing; run `migrate ddl` "
            "to refresh it. Falling back to %_status/%_type exclude patterns, "
            "which may truncate Prisma-seeded lookups (see CODE_REVIEW B8)."
        )
        truncate_schema_data(env, "demos_app", exclude_patterns=_FALLBACK_EXCLUDE_PATTERNS)

    files = _collect_app_files()
    log(f"applying {len(files)} demos_app build files in a single transaction")
    psql_files(env, files, pre_sql="SET CONSTRAINTS ALL DEFERRED")

    mark_gate("build_app")


def run_build() -> None:
    """Run P3 end-to-end: :func:`run_build_stg` followed by :func:`run_build_app`."""
    run_build_stg()
    run_build_app()
