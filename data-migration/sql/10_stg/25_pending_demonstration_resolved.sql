/*
 * Purpose:    Project each loadable ORPHAN pending demonstration into the column set the demos_app.application + demonstration loader consumes, deriving phase-by-date from the pending application rows.
 * Inputs:     stg._pendg_demo_fold, mysql_raw.mdcd_pendg_demo, mysql_raw.mdcd_demo_aplctn
 * Outputs:    CREATE OR REPLACE VIEW stg.pending_demonstration_resolved
 * Invariants: source-only (mysql_raw + the fold view only; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); orphan-loadable only (folded and held_no_project rows are excluded by the fold view); soft deletes already excluded upstream in stg._pendg_demo_fold; status is uniformly 'Under Review' (mdcd_pendg_demo has no status column) and is set by the loader; no chip_id (mdcd_pendg_demo has no secondary-number column).
 * Refs:       reports/narrative/pending_approved_decisions.md, sql/10_stg/22_demonstration_resolved.sql, sql/20_app/31_pending_demonstration.sql
 *
 * Staging projection of each loadable ORPHAN pending demonstration
 * (stg._pendg_demo_fold.disposition = 'orphan_loadable') into the column set the
 * demos_app.application + demonstration loader consumes
 * (sql/20_app/31_pending_demonstration.sql). One row per orphan carrying the
 * UUID minted in migration._id_map_mdcd_pendg_demo.
 *
 * Mirrors sql/10_stg/22_demonstration_resolved.sql (the approved-demo view) with
 * three differences dictated by the mdcd_pendg_demo shape:
 *   1. status: mdcd_pendg_demo has NO status column, so every pending demo is
 *      uniformly 'Under Review' (set by the loader, not carried here).
 *   2. chip_id: mdcd_pendg_demo has NO secondary-demonstration-number column, so
 *      chip_id is always NULL (never preserved, never minted).
 *   3. phase-by-date: the legacy application rows (mdcd_demo_aplctn) key a
 *      pending demo on mdcd_pendg_demo_id (the approved-demo aggregate keys on
 *      mdcd_demo_id); mdcd_pendg_demo carries no direct phase-date columns, so
 *      the derivation reads only the aggregated application rows and falls back
 *      to the Concept entry phase (never 'Approval Summary' -- a pending demo is
 *      not approved).
 *
 * Source-only by design (mysql_raw + the fold view, never crosswalks/seeds) so
 * it builds in the stg-only idempotency harness. The medicaid_id is the
 * canonical project number (present by construction: orphan_loadable requires
 * one); soft deletes were already excluded in stg._pendg_demo_fold.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.pending_demonstration_resolved AS
WITH aplctn AS (
  -- The original demonstration application (type 1), aggregated per pending demo
  -- to the furthest milestone reached across any non-deleted such row.
  SELECT
    a.mdcd_pendg_demo_id AS mdcd_pendg_demo_id,
    max(a.phase_2_rcvd_dt) AS phase_2_rcvd_dt,
    max(a.phase_2_cmpltns_rvw_dt) AS phase_2_cmpltns_rvw_dt,
    max(a.phase_2_state_aplctn_deemd_cmpltn_dt) AS phase_2_deemd_cmpltn_dt,
    max(a.phase_2_fed_cmt_prd_strt_dt) AS phase_2_fed_cmt_prd_strt_dt,
    max(COALESCE(a.phase_3_a_sme_strt_dt, a.phase_3_a_frvt_strt_dt, a.phase_3_b_cmcs_strt_dt, a.phase_3_b_ogc_strt_dt, a.phase_3_b_omb_strt_dt, a.phase_3_c_ogc_strt_dt, a.phase_3_c_omb_strt_dt)) AS phase_3_any_start,
    max(a.phase_4_strt_dt) AS phase_4_strt_dt,
    max(a.phase_5_strt_dt) AS phase_5_strt_dt,
    max(COALESCE(a.phase_6_strt_dt, a.phase_6_end_dt)) AS phase_6_any
  FROM
    mysql_raw.mdcd_demo_aplctn a
  WHERE
    a.mdcd_demo_aplctn_type_cd::int = 1
    AND (a.dltd_ind)::int IS DISTINCT FROM 1
    AND a.mdcd_pendg_demo_id IS NOT NULL
    AND a.mdcd_pendg_demo_id <> 0
  GROUP BY
    a.mdcd_pendg_demo_id
)
SELECT
  f.pending_uuid AS new_uuid,
  f.legacy_pendg_demo_id AS legacy_pendg_demo_id,
  btrim(p.mdcd_demo_name) AS name,
  NULLIF(btrim(p.mdcd_demo_desc), '') AS description,
  p.geo_ansi_state_cd AS state_id,
  p.mdcd_chip_div_cd::int AS sdg_division_cd,
  f.medicaid_id AS medicaid_id,
  migration.eastern_day_start(p.state_prfmnc_yr_strt_dt) AS effective_date,
  migration.eastern_day_end(p.state_prfmnc_yr_end_dt) AS expiration_date,
  p.creatd_dt::timestamptz AS created_at,
  COALESCE(p.updtd_dt, p.creatd_dt)::timestamptz AS updated_at,
  CASE WHEN ap.phase_6_any IS NOT NULL THEN
    'Approval Summary'
  WHEN ap.phase_5_strt_dt IS NOT NULL THEN
    'Approval Package'
  WHEN ap.phase_4_strt_dt IS NOT NULL THEN
    'Review'
  WHEN ap.phase_3_any_start IS NOT NULL THEN
    'SDG Preparation'
  WHEN ap.phase_2_fed_cmt_prd_strt_dt IS NOT NULL THEN
    'Federal Comment'
  WHEN ap.phase_2_cmpltns_rvw_dt IS NOT NULL
    OR ap.phase_2_deemd_cmpltn_dt IS NOT NULL THEN
    'Completeness'
  WHEN ap.phase_2_rcvd_dt IS NOT NULL THEN
    'Application Intake'
  ELSE
    NULL
  END AS current_phase_by_date
FROM
  stg._pendg_demo_fold f
  JOIN mysql_raw.mdcd_pendg_demo p ON p.mdcd_pendg_demo_id = f.legacy_pendg_demo_id
  LEFT JOIN aplctn ap ON ap.mdcd_pendg_demo_id = f.legacy_pendg_demo_id
WHERE
  f.disposition = 'orphan_loadable';
