/*
 * Purpose:    Project each PMDA-valid demonstration into the application + demonstration loader column set, deriving current_phase_by_date from legacy phase milestones.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.mdcd_demo_aplctn, stg._valid_demo_ids, migration._id_map_mdcd_demo
 * Outputs:    CREATE OR REPLACE VIEW stg.demonstration_resolved
 * Invariants: source-only (mysql_raw + id map + stg only; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); soft-delete exclusion (dltd_ind = 1); phase mapping is a best-effort §6.1 approximation pending SME ratification.
 * Refs:       reports/narrative/p1_demonstration_mapping_worksheet.md, docs/specs/pmda-cross-cutting-derivation-spec.md
 *
 * Staging projection of each PMDA-valid demonstration (mysql_raw.mdcd_demo)
 * into the column set the demos_app.application + demos_app.demonstration
 * loaders consume (sql/20_app/30_demonstration.sql). One row per kept demo
 * (stg._valid_demo_ids), carrying the shared UUID minted in
 * migration._id_map_mdcd_demo.
 *
 * Source-only by design: this view references ONLY mysql_raw source tables,
 * the id map, and stg._valid_demo_ids -- never the crosswalks (04) or
 * seeds (02) -- so it builds in the stg-only idempotency harness
 * (tests/sql/test_stg_idempotency.py). The status crosswalk join, the
 * state-region lookup, the chip_id fallback mint and the status-based phase
 * fallback all live in the loader, which runs after crosswalks + seeds.
 *
 * current_phase_by_date implements the DEMOS "highest started phase by date"
 * rule (server applicationPhaseConstants.ts; reports/narrative/p1_demonstration_mapping_worksheet.md
 * §6.1) against the legacy phase milestones. The rich lifecycle lives on the
 * demonstration's own application row (mysql_raw.mdcd_demo_aplctn,
 * mdcd_demo_aplctn_type_cd = 1), aggregated per demo so multiple/again rows
 * collapse to the furthest milestone reached. NULL here means "no phase date
 * signal"; the loader then falls back to the status (Approved -> Approval
 * Summary) and finally to the Concept entry phase.
 *
 * Legacy(mdcd_demo_aplctn) -> DEMOS phase mapping used below. The phase_2/phase_3
 * milestones carry semantic sub-columns that map confidently; the generic
 * phase_4/5/6 start/end dates map by ordinal position (legacy is a 6-phase
 * lifecycle, DEMOS an 8-phase one whose back half lines up). This is the
 * §6.1 "legacy-date-column -> DEMOS-date-type" crosswalk and remains a
 * best-effort approximation pending SME ratification:
 *   aprvl_dt | phase_6_{strt,end}_dt        -> Approval Summary (8)
 *   phase_5_strt_dt                          -> Approval Package (7)
 *   phase_4_strt_dt                          -> Review            (6)
 *   phase_3_*_strt_dt                        -> SDG Preparation   (5)
 *   phase_2_fed_cmt_prd_strt_dt              -> Federal Comment   (4)
 *   phase_2_cmpltns_rvw / deemd_cmpltn_dt    -> Completeness      (3)
 *   phase_2_rcvd_dt | rcvd_dt | submsn_dt    -> Application Intake(2)
 *
 * Soft deletes (mdcd_demo.dltd_ind = 1) are excluded: demonstration has no
 * target "Deleted" lifecycle state, so resurrecting them as live rows would be
 * wrong. Representing soft-deleted demonstrations is a deferred SME decision
 * (docs/specs/pmda-cross-cutting-derivation-spec.md, Soft Deletes).
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.demonstration_resolved AS
WITH aplctn AS (
  -- The original demonstration application (type 1), aggregated per demo to
  -- the furthest milestone reached across any non-deleted such row.
  SELECT
    a.mdcd_demo_id AS mdcd_demo_id,
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
    AND a.mdcd_demo_id IS NOT NULL
  GROUP BY
    a.mdcd_demo_id
)
SELECT
  m.new_uuid AS new_uuid,
  m.legacy_int_id AS legacy_demo_id,
  btrim(d.mdcd_demo_name) AS name,
  NULLIF(btrim(d.mdcd_demo_desc), '') AS description,
  d.mdcd_demo_stus_cd::int AS status_cd,
  d.geo_ansi_state_cd AS state_id,
  d.mdcd_chip_div_cd::int AS sdg_division_cd,
  NULLIF(btrim(d.mdcd_demo_num), '') AS medicaid_id,
  NULLIF(btrim(d.mdcd_scndry_demo_num), '') AS chip_id_legacy,
  d.state_prfmnc_yr_strt_dt::timestamptz AS effective_date,
  d.state_prfmnc_yr_end_dt::timestamptz AS expiration_date,
  d.creatd_dt::timestamptz AS created_at,
  COALESCE(d.updtd_dt, d.creatd_dt)::timestamptz AS updated_at,
  d.aprvl_dt::timestamptz AS approval_date,
  CASE WHEN d.aprvl_dt IS NOT NULL
    OR ap.phase_6_any IS NOT NULL THEN
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
    OR ap.phase_2_deemd_cmpltn_dt IS NOT NULL
    OR d.phase_2_state_aplctn_deemd_cmpltn_dt IS NOT NULL THEN
    'Completeness'
  WHEN ap.phase_2_rcvd_dt IS NOT NULL
    OR d.phase_2_rcvd_dt IS NOT NULL
    OR d.rcvd_dt IS NOT NULL
    OR d.submsn_dt IS NOT NULL THEN
    'Application Intake'
  ELSE
    NULL
  END AS current_phase_by_date
FROM
  mysql_raw.mdcd_demo d
  JOIN stg._valid_demo_ids v ON v.demo_id = d.mdcd_demo_id
  JOIN migration._id_map_mdcd_demo m ON m.legacy_int_id = d.mdcd_demo_id
  LEFT JOIN aplctn ap ON ap.mdcd_demo_id = d.mdcd_demo_id
WHERE (d.dltd_ind)::int IS DISTINCT FROM 1;

