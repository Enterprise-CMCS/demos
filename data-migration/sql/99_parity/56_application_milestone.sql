/*
 * Purpose:    Parity for the milestone-date / application_phase load: a NON-GATING SME log of legacy date columns deliberately NOT mapped to a DEMOS date_type (including the high-confidence phase_* columns dropped for Amendment/Extension applications because every milestone view filters type_cd=1), and a GATING invariant that the Federal Comment past-window failsafe held.
 * Inputs:     mysql_raw.mdcd_demo_aplctn, mysql_raw.mdcd_demo_amndmt; demos_app.application_phase, demos_app.application_date.
 * Outputs:    migration._parity_application_milestone_unmapped; migration._parity_application_phase_fed_comment_guard.
 * Invariants: unmapped log is NON-GATING (surfaces, per deferred source column, how many in-scope rows carry a value SME still needs to place); the fed-comment guard is GATING (fail-closed: after the loader, no application whose loaded Federal Comment Period End Date is before cutover 2026-08-13 may still be 'Not Started'/'Started'); conditional-DDL guarded so each view is created only when its inputs exist (the app-layers idempotency harness applies both as no-ops); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py; reports/narrative/milestone_date_mapping.md; sql/10_stg/27_application_milestone.sql; sql/23_app_derived/50_application_phase.sql.
 *
 * Parity: milestone-date coverage + Federal Comment guard.
 *
 *   migration._parity_application_milestone_unmapped (NON-GATING) -- one row per
 *     legacy date column the milestone crosswalk deliberately did NOT map to a
 *     DEMOS date_type, with the count of non-null occurrences among in-scope
 *     source rows. These are the granular phase_3 clearance sub-dates (SME /
 *     FRVT / CMCS / OGC / OMB start+end), the application-status date, and the
 *     amendment application/status dates -- deferred to SME because their
 *     semantic target (SDG-prep sub-dates vs Review clearances) is not
 *     high-confidence. It ALSO surfaces, per type, the high-confidence
 *     phase-milestone columns that ARE mapped for type_cd=1 (Demonstration) but
 *     are currently dropped for type_cd=2 (Amendment) and type_cd=3 (Extension):
 *     every milestone view filters type_cd=1, so the amendment/extension
 *     application rows carry a populated phase_* timeline that no application_date
 *     row captures. This was invisible until now and is the evidence behind the
 *     re-opened amendment-milestone-date SME decision. Reported, not gated: the
 *     counts tell SME how much data awaits placement (see
 *     reports/narrative/milestone_date_mapping.md).
 *
 *   migration._parity_application_phase_fed_comment_guard (GATING) -- one row per
 *     application whose loaded 'Federal Comment Period End Date' is before
 *     cutover (2026-08-13) yet whose Federal Comment phase is still
 *     'Not Started'/'Started'. The loader forces such rows to 'Completed' so the
 *     DEMOS nightly cron cannot spuriously advance a window that closed by
 *     cutover; any row here means the failsafe did not hold. Expected empty.
 *
 * Conditional DDL: the inputs exist only in the full pipeline, so each view is
 * guarded and the app-layers idempotency harness applies this file as a clean
 * no-op; re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo_aplctn') IS NULL OR to_regclass('mysql_raw.mdcd_demo_amndmt') IS NULL THEN
    RAISE NOTICE 'parity application milestone unmapped: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_application_milestone_unmapped AS
      WITH ap AS (
        SELECT
          count(phase_3_a_sme_strt_dt)  AS phase_3_a_sme_strt_dt,
          count(phase_3_a_sme_end_dt)   AS phase_3_a_sme_end_dt,
          count(phase_3_a_frvt_strt_dt) AS phase_3_a_frvt_strt_dt,
          count(phase_3_a_frvt_end_dt)  AS phase_3_a_frvt_end_dt,
          count(phase_3_b_cmcs_strt_dt) AS phase_3_b_cmcs_strt_dt,
          count(phase_3_b_cmcs_end_dt)  AS phase_3_b_cmcs_end_dt,
          count(phase_3_b_ogc_strt_dt)  AS phase_3_b_ogc_strt_dt,
          count(phase_3_b_ogc_end_dt)   AS phase_3_b_ogc_end_dt,
          count(phase_3_b_omb_strt_dt)  AS phase_3_b_omb_strt_dt,
          count(phase_3_b_omb_end_dt)   AS phase_3_b_omb_end_dt,
          count(phase_3_c_ogc_strt_dt)  AS phase_3_c_ogc_strt_dt,
          count(phase_3_c_ogc_end_dt)   AS phase_3_c_ogc_end_dt,
          count(phase_3_c_omb_strt_dt)  AS phase_3_c_omb_strt_dt,
          count(phase_3_c_omb_end_dt)   AS phase_3_c_omb_end_dt,
          count(mdcd_demo_aplctn_stus_dt) AS mdcd_demo_aplctn_stus_dt
        FROM mysql_raw.mdcd_demo_aplctn
        WHERE mdcd_demo_aplctn_type_cd::int = 1
          AND (dltd_ind)::int IS DISTINCT FROM 1
      ),
      amdt AS (
        SELECT
          count(amndmt_aplctn_dt) AS amndmt_aplctn_dt,
          count(amndmt_stus_dt)   AS amndmt_stus_dt
        FROM mysql_raw.mdcd_demo_amndmt
        WHERE (dltd_ind)::int IS DISTINCT FROM 1
      ),
      -- The high-confidence phase-milestone columns 27_application_milestone
      -- maps for type_cd=1 (Demonstration) are dropped for type_cd=2 (Amendment)
      -- and type_cd=3 (Extension): every milestone view filters type_cd=1, so the
      -- amendment/extension application rows carry a populated phase_* timeline
      -- that no application_date row captures. Count them per type so SME sees
      -- how much amendment/extension timeline data awaits a coverage decision.
      phase23 AS (
        SELECT
          mdcd_demo_aplctn_type_cd::int AS tc,
          count(phase_1_strt_dt) AS phase_1_strt_dt,
          count(phase_1_end_dt) AS phase_1_end_dt,
          count(phase_2_rcvd_dt) AS phase_2_rcvd_dt,
          count(phase_2_cmpltns_rvw_dt) AS phase_2_cmpltns_rvw_dt,
          count(phase_2_state_aplctn_deemd_cmpltn_dt) AS phase_2_state_aplctn_deemd_cmpltn_dt,
          count(phase_2_fed_cmt_prd_strt_dt) AS phase_2_fed_cmt_prd_strt_dt,
          count(phase_2_fed_cmt_prd_end_dt) AS phase_2_fed_cmt_prd_end_dt,
          count(phase_2_dsrd_aprvl_dt) AS phase_2_dsrd_aprvl_dt,
          count(phase_4_strt_dt) AS phase_4_strt_dt,
          count(phase_4_end_dt) AS phase_4_end_dt,
          count(phase_5_strt_dt) AS phase_5_strt_dt,
          count(phase_5_end_dt) AS phase_5_end_dt,
          count(phase_6_strt_dt) AS phase_6_strt_dt,
          count(phase_6_end_dt) AS phase_6_end_dt
        FROM mysql_raw.mdcd_demo_aplctn
        WHERE mdcd_demo_aplctn_type_cd::int IN (2, 3)
          AND (dltd_ind)::int IS DISTINCT FROM 1
        GROUP BY 1
      )
      SELECT
        source_table,
        source_column,
        non_null_count
      FROM (
        VALUES
          ('mdcd_demo_aplctn', 'phase_3_a_sme_strt_dt',  (SELECT phase_3_a_sme_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_a_sme_end_dt',   (SELECT phase_3_a_sme_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_a_frvt_strt_dt', (SELECT phase_3_a_frvt_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_a_frvt_end_dt',  (SELECT phase_3_a_frvt_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_cmcs_strt_dt', (SELECT phase_3_b_cmcs_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_cmcs_end_dt',  (SELECT phase_3_b_cmcs_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_ogc_strt_dt',  (SELECT phase_3_b_ogc_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_ogc_end_dt',   (SELECT phase_3_b_ogc_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_omb_strt_dt',  (SELECT phase_3_b_omb_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_b_omb_end_dt',   (SELECT phase_3_b_omb_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_c_ogc_strt_dt',  (SELECT phase_3_c_ogc_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_c_ogc_end_dt',   (SELECT phase_3_c_ogc_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_c_omb_strt_dt',  (SELECT phase_3_c_omb_strt_dt FROM ap)),
          ('mdcd_demo_aplctn', 'phase_3_c_omb_end_dt',   (SELECT phase_3_c_omb_end_dt FROM ap)),
          ('mdcd_demo_aplctn', 'mdcd_demo_aplctn_stus_dt', (SELECT mdcd_demo_aplctn_stus_dt FROM ap)),
          ('mdcd_demo_amndmt', 'amndmt_aplctn_dt', (SELECT amndmt_aplctn_dt FROM amdt)),
          ('mdcd_demo_amndmt', 'amndmt_stus_dt',   (SELECT amndmt_stus_dt FROM amdt))
      ) t (source_table, source_column, non_null_count)
      WHERE non_null_count > 0
      UNION ALL
      SELECT
        'mdcd_demo_aplctn (' || CASE p.tc WHEN 2 THEN 'Amendment' ELSE 'Extension' END || ', type_cd=' || p.tc::text || ')' AS source_table,
        u.source_column,
        u.non_null_count
      FROM phase23 p
      CROSS JOIN LATERAL (
        VALUES ('phase_1_strt_dt', p.phase_1_strt_dt),
          ('phase_1_end_dt', p.phase_1_end_dt),
          ('phase_2_rcvd_dt', p.phase_2_rcvd_dt),
          ('phase_2_cmpltns_rvw_dt', p.phase_2_cmpltns_rvw_dt),
          ('phase_2_state_aplctn_deemd_cmpltn_dt', p.phase_2_state_aplctn_deemd_cmpltn_dt),
          ('phase_2_fed_cmt_prd_strt_dt', p.phase_2_fed_cmt_prd_strt_dt),
          ('phase_2_fed_cmt_prd_end_dt', p.phase_2_fed_cmt_prd_end_dt),
          ('phase_2_dsrd_aprvl_dt', p.phase_2_dsrd_aprvl_dt),
          ('phase_4_strt_dt', p.phase_4_strt_dt),
          ('phase_4_end_dt', p.phase_4_end_dt),
          ('phase_5_strt_dt', p.phase_5_strt_dt),
          ('phase_5_end_dt', p.phase_5_end_dt),
          ('phase_6_strt_dt', p.phase_6_strt_dt),
          ('phase_6_end_dt', p.phase_6_end_dt)) u (source_column, non_null_count)
      WHERE u.non_null_count > 0;
    $v$;
  END IF;

  IF to_regclass('demos_app.application_phase') IS NULL OR to_regclass('demos_app.application_date') IS NULL THEN
    RAISE NOTICE 'parity application phase fed-comment guard: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_application_phase_fed_comment_guard AS
      SELECT
        ap.application_id,
        ad.date_value        AS fed_comment_end,
        ap.phase_status_id
      FROM demos_app.application_phase ap
      JOIN demos_app.application_date ad
        ON ad.application_id = ap.application_id
        AND ad.date_type_id = 'Federal Comment Period End Date'
      WHERE ap.phase_id = 'Federal Comment'
        AND ap.phase_status_id IN ('Not Started', 'Started')
        -- Eastern-midnight cutover instant; must match sql/23_app_derived/50_application_phase.sql.
        AND ad.date_value < TIMESTAMPTZ '2026-08-13 00:00:00-04:00';
    $v$;
  END IF;
END
$$;
