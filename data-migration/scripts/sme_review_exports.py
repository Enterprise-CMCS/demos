"""Branch 5 SME-review exports: held "Other" names, comments + authorities snapshots.

SME-facing exports that close open SME action items. All read the migration
*target* Postgres (the same DSN the phases use, ``Env``/``PG_URL``) and write
run-stamped CSVs into the gitignored ``reports/runs/`` directory:

  ``othr-names``           -- the free-text "Other" program-detail names held
                             back from the demonstration-type tag fold, read
                             from the parity view
                             ``migration._parity_pgm_dtl_tag_othr_held`` (one row
                             per held name + the reason + the migrated parent
                             demonstration's name, NULL when that parent did not
                             migrate). Sent to SDG for review: each is a 1115
                             demonstration name, not a category tag.
  ``comments-snapshot``    -- a reach-back snapshot of the seven non-deliverable
                             comment tables PMDA hangs off demonstrations,
                             amendments, renewals, programs, final decisions,
                             monitoring docs, and BN file docs. DEMOS keeps
                             comments only on deliverables, so these are left in
                             PMDA; the snapshot normalizes all seven
                             heterogeneous tables into one column set (with a
                             ``deleted`` column so soft-deleted rows stay
                             visible).
  ``authorities-snapshot`` -- an all-tier reach-back snapshot of the PMDA waiver
                             / expenditure authority corpus (workflow 5). DEMOS
                             has no authority entity (verified across the Prisma
                             models and ``server/src``) and the BN workbook path
                             is a separate, DEMOS-owned concern, so no loader is
                             built; the authorities are left in PMDA and a
                             full-fidelity snapshot suffices. One CSV per source
                             table (verbatim ``SELECT *``, all rows incl.
                             soft-deleted) plus a manifest that flags each
                             table's tier / history / pending / program-detail
                             overlap for SME triage. The SME cover note that
                             ships with these CSVs is
                             ``reports/narrative/authorities_snapshot_sme_note.md``.
  ``comment-route-diff``   -- per (cmt_orgn_cd, author person_type), the route
                             the crosswalk authored, the row volume, and how many
                             comments a flip to public would make state-visible.
                             The review artifact for the private-by-default
                             routing decision: codes 'R' and 'B' are
                             CMS-authored but sit in state threads, and they are
                             routed private because the source cannot prove they
                             are state-facing. Reads stg.comment_resolved so the
                             denominator includes held-back rows.
  ``softdeleted-demos``    -- (``softdeleted-demos-snapshot``) every soft-deleted
                             PMDA demonstration, approved and pending. The
                             migration drops ``dltd_ind = 1`` rows outright, so
                             this is the SME's last look at what disappears;
                             ``project_number_lost_entirely`` marks the set that
                             reaches DEMOS by no other row.
  ``dup-medicaid``         -- the demonstrations held back because two live rows
                             shared a ``mdcd_demo_num``, with BOTH sides named
                             (``held_name`` / ``kept_name``). The loader picks a
                             winner mechanically (region suffix, then lowest
                             legacy id), which cannot know which program is
                             which, so parity check 21 is fail-closed until an
                             SME signs each hold-back off.
  ``all`` (default)        -- run every export above. An export that cannot
                             produce its artifact is reported (``SKIPPED`` when
                             its inputs are absent, ``FAILED`` with the error when
                             it breaks) and the rest still run, but the run then
                             exits non-zero so a partial set is never mistaken
                             for a complete one.
  ``both``                 -- DEPRECATED alias for othr-names +
                             comments-snapshot, kept because runbooks and the
                             decision docs record it. Use ``all``.

Security: the connection DSN is built by ``migration.lib`` (credentials are
URL-encoded and never logged; ``lib.log`` redacts). The comment + authority
snapshots carry raw free-text and potentially sensitive data, so outputs land
only under the gitignored ``reports/runs/`` and are shared with SDG out-of-band
-- never committed. The source table names are hard-coded constants (not user
input) and identifiers are composed via ``psycopg.sql.Identifier``; only literal
DSN/paths come from the CLI.

Run from the repo root::

    uv run python scripts/sme_review_exports.py \\
        [othr-names|comments-snapshot|authorities-snapshot|comment-route-diff\\
         |softdeleted-demos-snapshot|dup-medicaid|all|both]
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Callable

    import psycopg

from migration.lib import RUNS_DIR, Env, die, file_stamp, log, rel

# --- held "Other" program names -------------------------------------------- #

OTHR_HELD_VIEW = "migration._parity_pgm_dtl_tag_othr_held"
OTHR_HELD_COLUMNS = [
    "legacy_id",
    "legacy_demo_id",
    "demonstration_id",
    "demonstration_name",
    "othr_name",
    "reason",
]

# --- non-deliverable comments snapshot ------------------------------------- #

COMMENT_COLUMNS = [
    "source_table",
    "parent_kind",
    "legacy_comment_id",
    "parent_legacy_id",
    "demo_legacy_id",
    "author_legacy_user_id",
    "origin_cd",
    "deleted",
    "created_at",
    "content",
]

# One projection per non-deliverable comment table, normalizing each
# heterogeneous source into COMMENT_COLUMNS. Author lives under different columns
# (proj_ofcr_user_id / user_id / creatd_user_id / none); comment text is cmt_txt
# except bdgt_ntrlty_fil_doc_cmt.gnrl_cmt_txt; only amendment + renewal comments
# carry a soft-delete flag (others read 0).
_COMMENT_PROJECTIONS: dict[str, str] = {
    "mdcd_demo_cmt": """
        SELECT 'mdcd_demo_cmt' AS source_table, 'demonstration' AS parent_kind,
               mdcd_demo_cmt_id AS legacy_comment_id, mdcd_demo_id AS parent_legacy_id,
               mdcd_demo_id AS demo_legacy_id, proj_ofcr_user_id AS author_legacy_user_id,
               NULL::text AS origin_cd, 0 AS deleted,
               creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_demo_cmt""",
    "mdcd_demo_amndmt_cmt": """
        SELECT 'mdcd_demo_amndmt_cmt' AS source_table, 'amendment' AS parent_kind,
               mdcd_demo_amndmt_cmt_id AS legacy_comment_id,
               mdcd_demo_amndmt_id AS parent_legacy_id, NULL::int AS demo_legacy_id,
               user_id AS author_legacy_user_id, cmt_orgn_cd::text AS origin_cd,
               COALESCE(dltd_ind, 0)::int AS deleted,
               creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_demo_amndmt_cmt""",
    "mdcd_demo_rnwl_cmt": """
        SELECT 'mdcd_demo_rnwl_cmt' AS source_table, 'renewal' AS parent_kind,
               mdcd_demo_rnwl_cmt_id AS legacy_comment_id,
               mdcd_demo_rnwl_id AS parent_legacy_id, NULL::int AS demo_legacy_id,
               user_id AS author_legacy_user_id, cmt_orgn_cd::text AS origin_cd,
               COALESCE(dltd_ind, 0)::int AS deleted,
               creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_demo_rnwl_cmt""",
    "mdcd_pgm_cmt": """
        SELECT 'mdcd_pgm_cmt' AS source_table, 'program' AS parent_kind,
               mdcd_pgm_cmt_id AS legacy_comment_id, mdcd_pgm_id AS parent_legacy_id,
               mdcd_demo_id AS demo_legacy_id, user_id AS author_legacy_user_id,
               NULL::text AS origin_cd, 0 AS deleted,
               creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_pgm_cmt""",
    "mdcd_demo_finl_dcsn_dtl_cmt": """
        SELECT 'mdcd_demo_finl_dcsn_dtl_cmt' AS source_table, 'final_decision' AS parent_kind,
               mdcd_demo_finl_dcsn_dtl_cmt_id AS legacy_comment_id,
               mdcd_demo_id AS parent_legacy_id, mdcd_demo_id AS demo_legacy_id,
               user_id AS author_legacy_user_id, cmt_orgn_cd::text AS origin_cd,
               0 AS deleted, creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_demo_finl_dcsn_dtl_cmt""",
    "mdcd_demo_pgm_mntrg_doc_cmt": """
        SELECT 'mdcd_demo_pgm_mntrg_doc_cmt' AS source_table, 'monitoring_doc' AS parent_kind,
               mdcd_demo_pgm_mntrg_doc_cmt_id AS legacy_comment_id,
               mdcd_demo_pgm_mntrg_doc_id AS parent_legacy_id, NULL::int AS demo_legacy_id,
               creatd_user_id AS author_legacy_user_id, NULL::text AS origin_cd,
               0 AS deleted, creatd_dt AS created_at, cmt_txt AS content
        FROM mysql_raw.mdcd_demo_pgm_mntrg_doc_cmt""",
    "bdgt_ntrlty_fil_doc_cmt": """
        SELECT 'bdgt_ntrlty_fil_doc_cmt' AS source_table, 'bn_file_doc' AS parent_kind,
               bdgt_ntrlty_fil_doc_cmt_id AS legacy_comment_id,
               mdcd_dlvrbl_fil_doc_id AS parent_legacy_id, NULL::int AS demo_legacy_id,
               NULL::int AS author_legacy_user_id, NULL::text AS origin_cd,
               0 AS deleted, creatd_dt AS created_at, gnrl_cmt_txt AS content
        FROM mysql_raw.bdgt_ntrlty_fil_doc_cmt""",
}

# Stable order used for the UNION + as the public "which tables" list.
COMMENT_SOURCE_TABLES: list[str] = list(_COMMENT_PROJECTIONS)

# --- waiver / expenditure authorities snapshot ----------------------------- #

# The workflow-5 corpus, grouped by tier. DEMOS models authorities nowhere, so
# every present table is snapshotted verbatim; the manifest flags each table's
# tier and whether it is a technical history/load mirror, a pending mirror, or a
# program-detail table that overlaps workflow-4's demonstration-type tags -- the
# two open questions the SME resolves *from* the snapshot, not decided in code.
# The set is drift-guarded against reports/schema_snapshot/table_stats.csv by
# tests/test_sme_review_exports_cli.py::test_authority_tables_cover_schema_snapshot.
_AUTH_INSTANCE = [
    "mdcd_demo_wvr_authrty",
    "mdcd_demo_wvr_authrty_sect",
    "mdcd_demo_expndtr_authrty",
    "mdcd_demo_expndtr_authrty_cap",
    "mdcd_demo_expndtr_authrty_cap_link",
    "mdcd_demo_na_expndtr_authrty",
    "mdcd_demo_na_expndtr_authrty_sect",
]
_AUTH_INSTANCE_HISTORY = [
    "mdcd_demo_expndtr_authrty_hstry",
    "mdcd_demo_expndtr_authrty_load",
    "mdcd_demo_expndtr_authrty_cap_hstry",
]
_AUTH_REFERENCE = [
    "expndtr_authrty_ctgry_rfrnc",
    "expndtr_authrty_title_rfrnc",
    "mdcd_emer_wvr_authrty_type_rfrnc",
    "wvr_authrty_title_rfrnc",
    "wvr_authrty_qlfyr_prex_rfrnc",
    "wvr_authrty_rfrnc",
    "na_expndtr_authrty_title_rfrnc",
    "na_expndtr_authrty_qlfyr_prex_rfrnc",
]
_AUTH_LIBRARY = [
    "wvr_authrty",
    "wvr_authrty_sect",
    "wvr_authrty_sect_asctn",
    "wvr_authrty_cart",
    "expndtr_authrty",
    "expndtr_authrty_cart",
    "na_expndtr_authrty",
    "na_expndtr_authrty_sect",
    "na_expndtr_authrty_sect_asctn",
    "mltss_pgm_wvr_authrty",
]
_AUTH_BENE_LINK = [
    "bene_grp_asctd_wvr",
    "bene_grp_asctd_expndtr_authrty",
]
_AUTH_PGM_DTL = [  # workflow-4 tag overlap
    "mdcd_emer_wvr_authrty_pgm_dtl",
    "mdcd_expndtr_cap_pgm_dtl",
]
_AUTH_PGM_DTL_HISTORY = [
    "mdcd_emer_wvr_authrty_pgm_dtl_hstry",
    "mdcd_expndtr_cap_pgm_dtl_hstry",
]
_AUTH_PENDING = [  # pending mirrors of the pgm_dtl overlap
    "mdcd_pendg_emer_wvr_authrty_pgm_dtl",
    "mdcd_pendg_expndtr_cap_pgm_dtl",
]
_AUTH_PENDING_HISTORY = [
    "mdcd_pendg_emer_wvr_authrty_pgm_dtl_hstry",
    "mdcd_pendg_expndtr_cap_pgm_dtl_hstry",
]


def _auth_meta(
    tier: str,
    *,
    is_history: bool = False,
    is_pending: bool = False,
    pgm_dtl_overlap: bool = False,
) -> dict[str, Any]:
    return {
        "tier": tier,
        "is_history": is_history,
        "is_pending": is_pending,
        "pgm_dtl_overlap": pgm_dtl_overlap,
    }


# Insertion order drives the manifest row order (instance -> ... -> pending).
AUTHORITY_TABLES: dict[str, dict[str, Any]] = {
    **{t: _auth_meta("instance") for t in _AUTH_INSTANCE},
    **{t: _auth_meta("instance", is_history=True) for t in _AUTH_INSTANCE_HISTORY},
    **{t: _auth_meta("reference") for t in _AUTH_REFERENCE},
    **{t: _auth_meta("library") for t in _AUTH_LIBRARY},
    **{t: _auth_meta("bene_link") for t in _AUTH_BENE_LINK},
    **{t: _auth_meta("pgm_dtl", pgm_dtl_overlap=True) for t in _AUTH_PGM_DTL},
    **{
        t: _auth_meta("pgm_dtl", is_history=True, pgm_dtl_overlap=True)
        for t in _AUTH_PGM_DTL_HISTORY
    },
    **{
        t: _auth_meta("pgm_dtl", is_pending=True, pgm_dtl_overlap=True)
        for t in _AUTH_PENDING
    },
    **{
        t: _auth_meta("pgm_dtl", is_history=True, is_pending=True, pgm_dtl_overlap=True)
        for t in _AUTH_PENDING_HISTORY
    },
}

AUTHORITY_MANIFEST_COLUMNS = [
    "source_table",
    "tier",
    "is_history",
    "is_pending",
    "pgm_dtl_overlap",
    "present",
    "row_count",
    "deleted_row_count",
    "csv_file",
]

# The demo id map used to resolve a source mdcd_demo_id to its migrated UUID.
_ID_MAP_MDCD_DEMO = "migration._id_map_mdcd_demo"


# --- query tier (takes a live connection; DB-testable via pg_db) ----------- #


def _table_exists(conn: Any, qualified: str) -> bool:
    row = conn.execute("SELECT to_regclass(%s)", (qualified,)).fetchone()
    return row is not None and row[0] is not None


def fetch_othr_held(conn: Any) -> list[dict[str, Any]]:
    """Return the held "Other" program names from the parity view.

    Dies (non-zero) when the view is absent: that means the migration's parity
    phase has not run, so an empty CSV would be a silent, misleading export.
    """
    if not _table_exists(conn, OTHR_HELD_VIEW):
        die(f"{OTHR_HELD_VIEW} not found; run the migration parity phase before exporting")
    cols = ", ".join(OTHR_HELD_COLUMNS)
    rows = conn.execute(
        f"SELECT {cols} FROM {OTHR_HELD_VIEW} ORDER BY othr_name, legacy_id"
    ).fetchall()
    return [dict(zip(OTHR_HELD_COLUMNS, r, strict=True)) for r in rows]


SOFTDELETED_DEMO_COLUMNS = [
    "source_table",
    "source_id",
    "project_number_source",
    "project_number_normalized",
    "demonstration_name",
    "state_cd",
    "status_cd",
    "deleted_by_user_id",
    "deleted_date",
    "created_date",
    "performance_year_start",
    "performance_year_end",
    "has_loaded_counterpart",
    "project_number_lost_entirely",
]


DUP_MEDICAID_VIEW = "migration._parity_demonstration_held_dup_medicaid_id"
DUP_MEDICAID_COLUMNS = [
    "held_legacy_demo_id",
    "held_name",
    "held_state_id",
    "held_status_id",
    "held_effective_date",
    "held_expiration_date",
    "medicaid_id",
    "kept_legacy_demo_id",
    "kept_name",
    "disposition",
    "gating",
    "reason",
]


def fetch_dup_medicaid(conn: Any) -> list[dict[str, Any]]:
    """Return the demonstrations held back for a duplicate medicaid_id, named.

    DEMOS enforces ``demonstration_medicaid_id_key`` UNIQUE; PMDA does not. When
    two live demonstrations share a project number the loader keeps one by a
    mechanical rule (region suffix matching the state's CMS region, then lowest
    legacy id) and holds the rest. Only an SME can say whether that was the right
    row, and they can only do that if they can see WHICH DEMONSTRATIONS are
    involved.

    The 2026-07-28 SDG review is the cautionary case this export exists for. It
    was run off an artifact carrying ids, ``medicaid_id``, state and status but
    no name, so the reviewer answered about "Healthy Texas Women" (legacy 2477,
    Approved through 2030, already correct on ``11-W-00326/6``) when the row
    actually colliding with Louisiana on ``11-W-00232/6`` is legacy 2513 "Texas
    Women's Health Waiver" (Expired 2007-2012). Both sides of every collision are
    therefore named here: ``held_name`` and ``kept_name``.

    Dies (non-zero) when the parity view is absent: that means the parity phase
    has not run, and an empty CSV would read as "no collisions" -- the most
    dangerous possible misreport for a check that exists to stop a silent drop.
    """
    if not _table_exists(conn, DUP_MEDICAID_VIEW):
        die(f"{DUP_MEDICAID_VIEW} not found; run the migration parity phase before exporting")
    rows = conn.execute(
        """
        SELECT legacy_demo_id, name, state_id, status_id, effective_date,
               expiration_date, medicaid_id, kept_legacy_demo_id, kept_name,
               disposition, gating, reason
        FROM migration._parity_demonstration_held_dup_medicaid_id
        ORDER BY medicaid_id, legacy_demo_id
        """
    ).fetchall()
    return [dict(zip(DUP_MEDICAID_COLUMNS, r, strict=True)) for r in rows]


def fetch_softdeleted_demos(conn: Any) -> list[dict[str, Any]]:
    """Return every soft-deleted PMDA demonstration, approved and pending.

    The migration drops ``dltd_ind = 1`` rows outright: DEMOS has no soft-delete
    concept, so a deleted demonstration has nowhere to land. That is the agreed
    behaviour, but it is irreversible at cutover, so the SME needs to see what
    is being dropped while there is still time to object.

    Two columns carry the judgement:

    ``has_loaded_counterpart``
        the same normalized project number reached DEMOS by some other row
        (a live approved demo, or a pending demo that folded into one). The
        deleted row's *content* is still lost, but the demonstration exists.
    ``project_number_lost_entirely``
        no row with that project number reached DEMOS at all. This is the set
        that actually disappears, and the only one worth arguing about.

    A soft-deleted row with a NULL/unnormalizable project number cannot be
    matched to anything, so it is reported with ``has_loaded_counterpart`` false
    and ``project_number_lost_entirely`` false -- neither claim is supportable,
    and asserting either would be a guess.
    """
    if not _table_exists(conn, "mysql_raw.mdcd_demo"):
        die("mysql_raw.mdcd_demo not found; run the load before exporting")
    if not _table_exists(conn, "demos_app.demonstration"):
        die("demos_app.demonstration not found; run build_app before exporting")

    sql = """
    WITH soft AS (
      SELECT
        'mdcd_demo'::text                                       AS source_table,
        d.mdcd_demo_id::text                                    AS source_id,
        d.mdcd_demo_num                                         AS project_number_source,
        migration.normalize_medicaid_id(d.mdcd_demo_num)        AS project_number_normalized,
        d.mdcd_demo_name                                        AS demonstration_name,
        d.geo_ansi_state_cd::text                               AS state_cd,
        d.mdcd_demo_stus_cd::text                               AS status_cd,
        d.dltd_user_id::text                                    AS deleted_by_user_id,
        d.dltd_dt::text                                         AS deleted_date,
        d.creatd_dt::text                                       AS created_date,
        d.state_prfmnc_yr_strt_dt::text                         AS performance_year_start,
        d.state_prfmnc_yr_end_dt::text                          AS performance_year_end
      FROM mysql_raw.mdcd_demo d
      WHERE (d.dltd_ind)::int = 1
      UNION ALL
      SELECT
        'mdcd_pendg_demo',
        p.mdcd_pendg_demo_id::text,
        p.mdcd_demo_num,
        migration.normalize_medicaid_id(p.mdcd_demo_num),
        p.mdcd_demo_name,
        p.geo_ansi_state_cd::text,
        NULL,
        p.dltd_user_id::text,
        p.dltd_dt::text,
        p.creatd_dt::text,
        p.state_prfmnc_yr_strt_dt::text,
        p.state_prfmnc_yr_end_dt::text
      FROM mysql_raw.mdcd_pendg_demo p
      WHERE (p.dltd_ind)::int = 1
    )
    SELECT
      s.source_table,
      s.source_id,
      s.project_number_source,
      s.project_number_normalized,
      s.demonstration_name,
      s.state_cd,
      s.status_cd,
      s.deleted_by_user_id,
      s.deleted_date,
      s.created_date,
      s.performance_year_start,
      s.performance_year_end,
      (s.project_number_normalized IS NOT NULL AND EXISTS (
         SELECT 1 FROM demos_app.demonstration t
         WHERE t.medicaid_id = s.project_number_normalized))     AS has_loaded_counterpart,
      (s.project_number_normalized IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM demos_app.demonstration t
         WHERE t.medicaid_id = s.project_number_normalized))     AS project_number_lost_entirely
    FROM soft s
    ORDER BY s.project_number_normalized NULLS LAST, s.source_table, s.source_id
    """
    rows = conn.execute(sql).fetchall()
    return [dict(zip(SOFTDELETED_DEMO_COLUMNS, r, strict=True)) for r in rows]


COMMENT_ROUTE_DIFF_COLUMNS = [
    "origin_cd",
    "authored_route",
    "author_person_type_id",
    "rows",
    "route_if_public",
    "route_if_private",
    "would_change_visibility",
]


def fetch_comment_route_diff(conn: Any) -> list[dict[str, Any]]:
    """Return, per (origin code, author person_type), what each candidate route does.

    The comment-origin crosswalk decides whether a state can read a CMS comment,
    and 'R' and 'B' are routed private on the fail-safe rule rather than on a
    positive SME determination (sql/04_crosswalks/68_comment_origin.sql). This
    export is what an SME needs to overturn that: for every origin code it shows
    the authored route, the volume, and how many rows would become state-visible
    if the code were flipped to public.

    Reads the staging projection (``stg.comment_resolved``) rather than the loaded
    tables, so it reports the full candidate population including rows currently
    held back -- an SME reviewing a disclosure decision needs the denominator, not
    just what happened to load.
    """
    if not _table_exists(conn, "stg.comment_resolved"):
        die("stg.comment_resolved not found; run the migration build phase before exporting")
    crosswalk = "mysql_raw.crosswalk_comment_origin"
    has_crosswalk = _table_exists(conn, crosswalk)
    route_expr = "COALESCE(co.demos_route, 'private')" if has_crosswalk else "'private'"
    join = f"LEFT JOIN {crosswalk} co ON co.legacy_cd = r.origin_cd" if has_crosswalk else ""
    rows = conn.execute(
        f"""
        SELECT
          COALESCE(r.origin_cd, '(none)')                AS origin_cd,
          {route_expr}                                   AS authored_route,
          COALESCE(r.author_person_type_id, '(unresolved)') AS author_person_type_id,
          count(*)                                       AS rows
        FROM stg.comment_resolved r
        {join}
        GROUP BY 1, 2, 3
        ORDER BY 1, 3
        """
    ).fetchall()
    out: list[dict[str, Any]] = []
    for origin_cd, authored_route, person_type, n in rows:
        # A private->public flip is the only direction that discloses anything, so
        # that is the column an SME actually has to sign off on.
        cms_authored = person_type in ("demos-admin", "demos-cms-user")
        out.append(
            {
                "origin_cd": origin_cd,
                "authored_route": authored_route,
                "author_person_type_id": person_type,
                "rows": n,
                "route_if_public": "public",
                "route_if_private": "private",
                "would_change_visibility": (
                    f"flipping {origin_cd} to public would make {n} "
                    f"{'CMS-authored ' if cms_authored else ''}comment(s) state-visible"
                    if authored_route == "private"
                    else f"already public: {n} comment(s) are state-visible"
                ),
            }
        )
    return out


def fetch_comments_snapshot(conn: Any) -> list[dict[str, Any]]:
    """Return the normalized snapshot across every present non-deliverable table.

    Absent tables are skipped (a partially-loaded target must not error), but if
    none of the seven exist the load has not run -- die rather than emit an empty
    CSV.
    """
    present = [t for t in COMMENT_SOURCE_TABLES if _table_exists(conn, f"mysql_raw.{t}")]
    if not present:
        die("no non-deliverable comment tables found in mysql_raw; run the load before exporting")
    union = "\nUNION ALL\n".join(_COMMENT_PROJECTIONS[t] for t in present)
    cols = ", ".join(COMMENT_COLUMNS)
    rows = conn.execute(
        f"SELECT {cols} FROM (\n{union}\n) s ORDER BY source_table, legacy_comment_id"
    ).fetchall()
    return [dict(zip(COMMENT_COLUMNS, r, strict=True)) for r in rows]


def _present_authority_tables(conn: Any) -> list[str]:
    """Authority tables that actually exist in mysql_raw (insertion order)."""
    return [t for t in AUTHORITY_TABLES if _table_exists(conn, f"mysql_raw.{t}")]


def _table_has_mdcd_demo_id(conn: Any, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_schema = 'mysql_raw' AND table_name = %s AND column_name = 'mdcd_demo_id'",
        (table,),
    ).fetchone()
    return row is not None


def fetch_authority_table(conn: Any, table: str) -> tuple[list[str], list[dict[str, Any]]]:
    """Read one authority table verbatim (``SELECT *``, all rows incl. soft-deleted).

    Where the source carries mdcd_demo_id (and the demo id map is present), a
    resolved ``demonstration_id`` column is appended so the SME can tie a row to
    a migrated demonstration (NULL when the parent demo did not migrate). Table
    names come from the hard-coded AUTHORITY_TABLES constant and are composed via
    psycopg.sql.Identifier, never string-interpolated.
    """
    from psycopg import sql

    enrich_demo = _table_has_mdcd_demo_id(conn, table) and _table_exists(conn, _ID_MAP_MDCD_DEMO)
    if enrich_demo:
        query = sql.SQL(
            "SELECT s.*, m.new_uuid AS demonstration_id "
            "FROM {src} AS s "
            "LEFT JOIN migration._id_map_mdcd_demo AS m ON m.legacy_int_id = s.mdcd_demo_id"
        ).format(src=sql.Identifier("mysql_raw", table))
    else:
        query = sql.SQL("SELECT * FROM {src}").format(src=sql.Identifier("mysql_raw", table))
    cur = conn.execute(query)
    columns = [desc[0] for desc in cur.description]
    rows = [dict(zip(columns, r, strict=True)) for r in cur.fetchall()]
    return columns, rows


def _deleted_count(rows: list[dict[str, Any]]) -> int:
    """Rows flagged soft-deleted via dltd_ind (retained, not dropped)."""
    return sum(1 for r in rows if r.get("dltd_ind") in (1, "1", True))


# --- I/O tier (CSV + connection + CLI) ------------------------------------- #


def write_csv(rows: list[dict[str, Any]], path: Path, columns: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def stamped_path(out_dir: Path, prefix: str) -> Path:
    return out_dir / f"{prefix}_{file_stamp()}.csv"


def export_othr_names(conn: Any, out_dir: Path) -> tuple[Path, int]:
    rows = fetch_othr_held(conn)
    path = stamped_path(out_dir, "sme_review_othr_names")
    write_csv(rows, path, OTHR_HELD_COLUMNS)
    return path, len(rows)


def export_comments_snapshot(conn: Any, out_dir: Path) -> tuple[Path, int]:
    rows = fetch_comments_snapshot(conn)
    path = stamped_path(out_dir, "sme_review_comments_snapshot")
    write_csv(rows, path, COMMENT_COLUMNS)
    return path, len(rows)


def export_comment_route_diff(conn: Any, out_dir: Path) -> tuple[Path, int]:
    rows = fetch_comment_route_diff(conn)
    path = stamped_path(out_dir, "sme_review_comment_route_diff")
    write_csv(rows, path, COMMENT_ROUTE_DIFF_COLUMNS)
    return path, len(rows)


def export_softdeleted_demos(conn: Any, out_dir: Path) -> tuple[Path, int]:
    rows = fetch_softdeleted_demos(conn)
    path = stamped_path(out_dir, "sme_review_softdeleted_demos")
    write_csv(rows, path, SOFTDELETED_DEMO_COLUMNS)
    return path, len(rows)


def export_dup_medicaid(conn: Any, out_dir: Path) -> tuple[Path, int]:
    rows = fetch_dup_medicaid(conn)
    path = stamped_path(out_dir, "sme_review_dup_medicaid")
    write_csv(rows, path, DUP_MEDICAID_COLUMNS)
    return path, len(rows)


def export_authorities_snapshot(conn: Any, out_dir: Path) -> tuple[Path, int]:
    """Write one verbatim CSV per present authority table plus a manifest.

    Returns ``(manifest_path, total_rows)``. Absent tables are still catalogued
    in the manifest (present=0) so the SME sees the full corpus; if none of the
    tables exist the load has not run -- die rather than emit an empty snapshot.
    """
    present = set(_present_authority_tables(conn))
    if not present:
        die("no waiver/expenditure authority tables found in mysql_raw; run the load before exporting")

    stamp = file_stamp()
    manifest_rows: list[dict[str, Any]] = []
    total = 0
    for table, meta in AUTHORITY_TABLES.items():
        row = {
            "source_table": table,
            "tier": meta["tier"],
            "is_history": int(meta["is_history"]),
            "is_pending": int(meta["is_pending"]),
            "pgm_dtl_overlap": int(meta["pgm_dtl_overlap"]),
            "present": int(table in present),
            "row_count": 0,
            "deleted_row_count": 0,
            "csv_file": "",
        }
        if table in present:
            columns, rows = fetch_authority_table(conn, table)
            path = out_dir / f"sme_review_authorities_{table}_{stamp}.csv"
            write_csv(rows, path, columns)
            row["row_count"] = len(rows)
            row["deleted_row_count"] = _deleted_count(rows)
            row["csv_file"] = path.name
            total += len(rows)
        manifest_rows.append(row)

    manifest_path = out_dir / f"sme_review_authorities_manifest_{stamp}.csv"
    write_csv(manifest_rows, manifest_path, AUTHORITY_MANIFEST_COLUMNS)
    return manifest_path, total


def _connect(dsn: str | None) -> psycopg.Connection:
    import psycopg

    return psycopg.connect(dsn or Env.load().pg_dsn(), autocommit=True)


# --- subcommand registry ---------------------------------------------------- #
#
# One runner per export, each logging its own result line. The registry is what
# `all` iterates, so a new export becomes reachable from the default invocation
# by being added here -- the failure mode this replaced was `dup-medicaid` being
# implemented, tested and documented yet unreachable from `make
# sme_review_exports`, because the aggregate was a hard-coded pair.


def _run_othr_names(conn: Any, out_dir: Path) -> None:
    path, n = export_othr_names(conn, out_dir)
    log(f"held Other program names: {n} row(s) -> {rel(path)}")


def _run_comments_snapshot(conn: Any, out_dir: Path) -> None:
    path, n = export_comments_snapshot(conn, out_dir)
    log(f"non-deliverable comments snapshot: {n} row(s) -> {rel(path)}")


def _run_authorities_snapshot(conn: Any, out_dir: Path) -> None:
    path, n = export_authorities_snapshot(conn, out_dir)
    log(f"waiver/expenditure authorities snapshot: {n} row(s) -> {rel(path)}")


def _run_comment_route_diff(conn: Any, out_dir: Path) -> None:
    path, n = export_comment_route_diff(conn, out_dir)
    log(f"comment route diff: {n} row(s) -> {rel(path)}")


def _run_softdeleted_demos(conn: Any, out_dir: Path) -> None:
    rows = fetch_softdeleted_demos(conn)
    path = stamped_path(out_dir, "sme_review_softdeleted_demos")
    write_csv(rows, path, SOFTDELETED_DEMO_COLUMNS)
    lost = len({r["project_number_normalized"] for r in rows if r["project_number_lost_entirely"]})
    log(
        f"soft-deleted demonstrations: {len(rows)} row(s) -> {rel(path)}; "
        f"{lost} project number(s) reach DEMOS by no other row"
    )


def _run_dup_medicaid(conn: Any, out_dir: Path) -> None:
    path, n = export_dup_medicaid(conn, out_dir)
    log(
        f"duplicate-medicaid_id hold-backs: {n} row(s) -> {rel(path)}; "
        f"both sides of each collision are named (held_name / kept_name)"
    )


EXPORTS: dict[str, Callable[[Any, Path], None]] = {
    "othr-names": _run_othr_names,
    "comments-snapshot": _run_comments_snapshot,
    "authorities-snapshot": _run_authorities_snapshot,
    "comment-route-diff": _run_comment_route_diff,
    "softdeleted-demos-snapshot": _run_softdeleted_demos,
    "dup-medicaid": _run_dup_medicaid,
}

# 'both' predates the other four exports and means exactly these two. It is kept
# as a deprecated alias so existing runbooks and the ARGS= invocations recorded
# in the decision docs keep working; 'all' is the aggregate to use.
BOTH_EXPORTS: tuple[str, ...] = ("othr-names", "comments-snapshot")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="sme_review_exports",
        description="Export SME-review artifacts (held Other names, comments snapshot).",
    )
    parser.add_argument(
        "command",
        nargs="?",
        default="all",
        choices=[*EXPORTS, "all", "both"],
        help=(
            "which export to run (default: all = every export; 'both' is a "
            "deprecated alias for othr-names + comments-snapshot)"
        ),
    )
    parser.add_argument(
        "--dsn",
        default=None,
        help="target Postgres DSN (default: Env/PG_URL, same as the phases)",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help="output directory (default: reports/runs/)",
    )
    return parser.parse_args(argv)


def _selected_exports(command: str) -> list[str]:
    """Resolve a subcommand to the ordered list of exports to run."""
    if command == "all":
        return list(EXPORTS)
    if command == "both":
        log(
            "note: 'both' is a deprecated alias for othr-names + comments-snapshot; "
            "use 'all' to run every export"
        )
        return list(BOTH_EXPORTS)
    return [command]


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    out_dir = Path(args.out_dir) if args.out_dir else RUNS_DIR
    selected = _selected_exports(args.command)
    conn = _connect(args.dsn)
    # In a multi-export run one bad export must not suppress the artifacts that
    # CAN be built, but the run still has to fail: a partial set that exited 0
    # would let an operator believe an artifact was produced when it was not.
    # 'Inputs absent' (die()) and 'blew up' (anything else, e.g. schema drift
    # past the existence check) are reported distinctly so a real defect is never
    # filed as a benign skip. A single explicit subcommand keeps its original
    # behaviour, traceback and exit code.
    failures: list[str] = []
    try:
        for cmd in selected:
            try:
                EXPORTS[cmd](conn, out_dir)
            except SystemExit:
                if len(selected) == 1:
                    raise
                failures.append(f"{cmd} (inputs absent)")
                log(f"SKIPPED {cmd}: inputs absent (see the FATAL line above)")
            except Exception as exc:  # broad on purpose: reported, then re-raised as exit 1
                if len(selected) == 1:
                    raise
                failures.append(f"{cmd} (error)")
                log(f"FAILED {cmd}: {type(exc).__name__}: {exc}")
    finally:
        conn.close()
    if failures:
        log(f"{len(failures)} of {len(selected)} export(s) did not produce an artifact: {', '.join(failures)}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
