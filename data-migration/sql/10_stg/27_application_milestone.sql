/*
 * Purpose:    Project every high-confidence legacy phase-milestone date into the tall (application_id, date_type_id, date_value) shape the demos_app.application_date loader consumes, for approved and pending demonstrations.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.mdcd_demo_aplctn, stg._valid_demo_ids, stg._pendg_demo_fold, migration._id_map_mdcd_demo, migration._id_map_mdcd_pendg_demo
 * Outputs:    CREATE OR REPLACE VIEW stg.application_milestone
 * Invariants: source-only (mysql_raw + id maps + the source-only stg._pendg_demo_fold / stg._valid_demo_ids; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); one row per (application_id, date_type_id) with a non-null date; soft deletes excluded (dltd_ind = 1); pending demos carry no approval date (never 'Application Approval Date'); the loader filters to demonstrations actually loaded.
 * Refs:       docs/developer/reference-cross-cutting-derivations.adoc#phase-date-mapping, reports/narrative/milestone_date_mapping.md, sql/10_stg/22_demonstration_resolved.sql
 *
 * The §6.1 "legacy-date-column -> DEMOS-date-type" crosswalk in tall form. Each
 * legacy phase-milestone date column maps to exactly one seeded demos_app
 * date_type (the mapping is documented, with the deferred columns, in
 * reports/narrative/milestone_date_mapping.md). Only the high-confidence,
 * semantically-clear columns are mapped here; the granular phase_3 clearance
 * sub-dates and the application-status date are held for SME review (logged by
 * sql/99_parity/56_application_milestone_unmapped.sql), never invented as a
 * date_type.
 *
 * Both approved (mdcd_demo_id) and pending (mdcd_pendg_demo_id) demonstrations
 * draw their phase dates from the same mdcd_demo_aplctn table (type 1),
 * aggregated per demo to the furthest milestone reached across any non-deleted
 * application row -- mirroring the aggregation in 22/24. A pending demo is never
 * approved, so it carries no 'Application Approval Date'.
 *
 * Source-only by design (mysql_raw + id maps + the source-only fold/valid views,
 * never crosswalks/seeds) so it builds in the stg-only idempotency harness. The
 * loader (sql/20_app/36_application_date.sql) joins demos_app.demonstration to
 * keep only rows for demonstrations that actually loaded; a held-back demo
 * contributes no application_date row.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.application_milestone AS
WITH demo_ap AS (
  SELECT
    a.mdcd_demo_id AS mdcd_demo_id,
    max(a.phase_1_strt_dt) AS phase_1_strt_dt,
    max(a.phase_1_end_dt) AS phase_1_end_dt,
    max(a.phase_2_rcvd_dt) AS phase_2_rcvd_dt,
    max(a.phase_2_cmpltns_rvw_dt) AS phase_2_cmpltns_rvw_dt,
    max(a.phase_2_state_aplctn_deemd_cmpltn_dt) AS phase_2_deemd_cmpltn_dt,
    max(a.phase_2_fed_cmt_prd_strt_dt) AS phase_2_fed_cmt_prd_strt_dt,
    max(a.phase_2_fed_cmt_prd_end_dt) AS phase_2_fed_cmt_prd_end_dt,
    max(a.phase_2_dsrd_aprvl_dt) AS phase_2_dsrd_aprvl_dt,
    max(COALESCE(a.phase_3_a_sme_strt_dt, a.phase_3_a_frvt_strt_dt, a.phase_3_b_cmcs_strt_dt, a.phase_3_b_ogc_strt_dt, a.phase_3_b_omb_strt_dt, a.phase_3_c_ogc_strt_dt, a.phase_3_c_omb_strt_dt)) AS phase_3_any_start,
    max(a.phase_4_strt_dt) AS phase_4_strt_dt,
    max(a.phase_4_end_dt) AS phase_4_end_dt,
    max(a.phase_5_strt_dt) AS phase_5_strt_dt,
    max(a.phase_5_end_dt) AS phase_5_end_dt,
    max(a.phase_6_strt_dt) AS phase_6_strt_dt,
    max(a.phase_6_end_dt) AS phase_6_end_dt
  FROM
    mysql_raw.mdcd_demo_aplctn a
  WHERE
    a.mdcd_demo_aplctn_type_cd::int = 1
    AND (a.dltd_ind)::int IS DISTINCT FROM 1
    AND a.mdcd_demo_id IS NOT NULL
    AND a.mdcd_demo_id <> 0
  GROUP BY
    a.mdcd_demo_id
),

pend_ap AS (
  SELECT
    a.mdcd_pendg_demo_id AS mdcd_pendg_demo_id,
    max(a.phase_1_strt_dt) AS phase_1_strt_dt,
    max(a.phase_1_end_dt) AS phase_1_end_dt,
    max(a.phase_2_rcvd_dt) AS phase_2_rcvd_dt,
    max(a.phase_2_cmpltns_rvw_dt) AS phase_2_cmpltns_rvw_dt,
    max(a.phase_2_state_aplctn_deemd_cmpltn_dt) AS phase_2_deemd_cmpltn_dt,
    max(a.phase_2_fed_cmt_prd_strt_dt) AS phase_2_fed_cmt_prd_strt_dt,
    max(a.phase_2_fed_cmt_prd_end_dt) AS phase_2_fed_cmt_prd_end_dt,
    max(a.phase_2_dsrd_aprvl_dt) AS phase_2_dsrd_aprvl_dt,
    max(COALESCE(a.phase_3_a_sme_strt_dt, a.phase_3_a_frvt_strt_dt, a.phase_3_b_cmcs_strt_dt, a.phase_3_b_ogc_strt_dt, a.phase_3_b_omb_strt_dt, a.phase_3_c_ogc_strt_dt, a.phase_3_c_omb_strt_dt)) AS phase_3_any_start,
    max(a.phase_4_strt_dt) AS phase_4_strt_dt,
    max(a.phase_4_end_dt) AS phase_4_end_dt,
    max(a.phase_5_strt_dt) AS phase_5_strt_dt,
    max(a.phase_5_end_dt) AS phase_5_end_dt,
    max(a.phase_6_strt_dt) AS phase_6_strt_dt,
    max(a.phase_6_end_dt) AS phase_6_end_dt
  FROM
    mysql_raw.mdcd_demo_aplctn a
  WHERE
    a.mdcd_demo_aplctn_type_cd::int = 1
    AND (a.dltd_ind)::int IS DISTINCT FROM 1
    AND a.mdcd_pendg_demo_id IS NOT NULL
    AND a.mdcd_pendg_demo_id <> 0
  GROUP BY
    a.mdcd_pendg_demo_id
),

approved AS (
  SELECT
    m.new_uuid AS application_id,
    v.date_type_id,
    v.date_value
  FROM
    mysql_raw.mdcd_demo d
    JOIN stg._valid_demo_ids vd ON vd.demo_id = d.mdcd_demo_id
    JOIN migration._id_map_mdcd_demo m ON m.legacy_int_id = d.mdcd_demo_id
    LEFT JOIN demo_ap ap ON ap.mdcd_demo_id = d.mdcd_demo_id
    CROSS JOIN LATERAL (
      VALUES
        ('Concept Start Date', migration.eastern_day_start(ap.phase_1_strt_dt)),
        ('Concept Completion Date', migration.eastern_day_start(ap.phase_1_end_dt)),
        ('Application Intake Start Date', migration.eastern_day_start(COALESCE(ap.phase_2_rcvd_dt, d.phase_2_rcvd_dt, d.rcvd_dt))),
        ('State Application Submitted Date', migration.eastern_day_start(d.submsn_dt)),
        ('Completeness Review Due Date', migration.eastern_day_end(ap.phase_2_cmpltns_rvw_dt)),
        ('Completeness Completion Date', migration.eastern_day_start(COALESCE(ap.phase_2_deemd_cmpltn_dt, d.phase_2_state_aplctn_deemd_cmpltn_dt))),
        ('Federal Comment Period Start Date', migration.eastern_day_start(ap.phase_2_fed_cmt_prd_strt_dt)),
        ('Federal Comment Period End Date', migration.eastern_day_end(ap.phase_2_fed_cmt_prd_end_dt)),
        ('Expected Approval Date', migration.eastern_day_start(ap.phase_2_dsrd_aprvl_dt)),
        ('SDG Preparation Start Date', migration.eastern_day_start(ap.phase_3_any_start)),
        ('Review Start Date', migration.eastern_day_start(ap.phase_4_strt_dt)),
        ('Review Completion Date', migration.eastern_day_start(ap.phase_4_end_dt)),
        ('Approval Package Start Date', migration.eastern_day_start(ap.phase_5_strt_dt)),
        ('Approval Package Completion Date', migration.eastern_day_start(ap.phase_5_end_dt)),
        ('Approval Summary Start Date', migration.eastern_day_start(ap.phase_6_strt_dt)),
        ('Approval Summary Completion Date', migration.eastern_day_start(ap.phase_6_end_dt)),
        ('Application Approval Date', migration.eastern_day_start(d.aprvl_dt))
    ) v (date_type_id, date_value)
  WHERE (d.dltd_ind)::int IS DISTINCT FROM 1
),

pending AS (
  SELECT
    f.pending_uuid AS application_id,
    v.date_type_id,
    v.date_value
  FROM
    stg._pendg_demo_fold f
    LEFT JOIN pend_ap ap ON ap.mdcd_pendg_demo_id = f.legacy_pendg_demo_id
    CROSS JOIN LATERAL (
      VALUES
        ('Concept Start Date', migration.eastern_day_start(ap.phase_1_strt_dt)),
        ('Concept Completion Date', migration.eastern_day_start(ap.phase_1_end_dt)),
        ('Application Intake Start Date', migration.eastern_day_start(ap.phase_2_rcvd_dt)),
        ('Completeness Review Due Date', migration.eastern_day_end(ap.phase_2_cmpltns_rvw_dt)),
        ('Completeness Completion Date', migration.eastern_day_start(ap.phase_2_deemd_cmpltn_dt)),
        ('Federal Comment Period Start Date', migration.eastern_day_start(ap.phase_2_fed_cmt_prd_strt_dt)),
        ('Federal Comment Period End Date', migration.eastern_day_end(ap.phase_2_fed_cmt_prd_end_dt)),
        ('Expected Approval Date', migration.eastern_day_start(ap.phase_2_dsrd_aprvl_dt)),
        ('SDG Preparation Start Date', migration.eastern_day_start(ap.phase_3_any_start)),
        ('Review Start Date', migration.eastern_day_start(ap.phase_4_strt_dt)),
        ('Review Completion Date', migration.eastern_day_start(ap.phase_4_end_dt)),
        ('Approval Package Start Date', migration.eastern_day_start(ap.phase_5_strt_dt)),
        ('Approval Package Completion Date', migration.eastern_day_start(ap.phase_5_end_dt)),
        ('Approval Summary Start Date', migration.eastern_day_start(ap.phase_6_strt_dt)),
        ('Approval Summary Completion Date', migration.eastern_day_start(ap.phase_6_end_dt))
    ) v (date_type_id, date_value)
  WHERE
    f.disposition = 'orphan_loadable'
)

SELECT
  application_id,
  date_type_id,
  date_value
FROM
  approved
WHERE
  date_value IS NOT NULL
UNION ALL
SELECT
  application_id,
  date_type_id,
  date_value
FROM
  pending
WHERE
  date_value IS NOT NULL;
