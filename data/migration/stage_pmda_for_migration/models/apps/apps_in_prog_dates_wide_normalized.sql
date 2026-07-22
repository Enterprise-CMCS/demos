WITH base_applications AS (
    SELECT
        valid_in_progress.mdcd_demo_aplctn_id,
        mdcd_demo_aplctn.phase_1_strt_dt,
        mdcd_demo_aplctn.phase_1_end_dt,
        mdcd_demo_aplctn.phase_2_rcvd_dt,
        mdcd_demo_aplctn.phase_2_cmpltns_rvw_dt,
        mdcd_demo_aplctn.phase_2_state_aplctn_deemd_cmpltn_dt,
        mdcd_demo_aplctn.phase_2_fed_cmt_prd_strt_dt,
        mdcd_demo_aplctn.phase_2_fed_cmt_prd_end_dt,
        mdcd_demo_aplctn.phase_2_dsrd_aprvl_dt,
        mdcd_demo_aplctn.phase_3_a_sme_strt_dt,
        mdcd_demo_aplctn.phase_3_a_sme_end_dt,
        mdcd_demo_aplctn.phase_3_a_frvt_strt_dt,
        mdcd_demo_aplctn.phase_3_a_frvt_end_dt,
        mdcd_demo_aplctn.phase_3_b_cmcs_strt_dt,
        mdcd_demo_aplctn.phase_3_b_cmcs_end_dt,
        mdcd_demo_aplctn.phase_3_b_ogc_strt_dt,
        mdcd_demo_aplctn.phase_3_b_ogc_end_dt,
        mdcd_demo_aplctn.phase_3_b_omb_strt_dt,
        mdcd_demo_aplctn.phase_3_b_omb_end_dt,
        mdcd_demo_aplctn.phase_3_c_ogc_strt_dt,
        mdcd_demo_aplctn.phase_3_c_ogc_end_dt,
        mdcd_demo_aplctn.phase_3_c_omb_strt_dt,
        mdcd_demo_aplctn.phase_3_c_omb_end_dt,
        mdcd_demo_aplctn.phase_4_strt_dt,
        mdcd_demo_aplctn.phase_4_end_dt,
        mdcd_demo_aplctn.phase_5_strt_dt,
        mdcd_demo_aplctn.phase_5_end_dt,
        mdcd_demo_aplctn.phase_6_strt_dt,
        mdcd_demo_aplctn.phase_6_end_dt
    FROM
        {{ ref('apps_active_in_progress_pmda_demos') }} AS valid_in_progress
    INNER JOIN
        {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS mdcd_demo_aplctn
        ON
            valid_in_progress.mdcd_demo_aplctn_id = mdcd_demo_aplctn.mdcd_demo_aplctn_id
)

SELECT
    mdcd_demo_aplctn_id,

    (phase_1_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_1_strt_dt,
    (phase_1_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_1_end_dt,
    (phase_2_rcvd_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_2_rcvd_dt,
    (phase_2_cmpltns_rvw_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_2_cmpltns_rvw_dt,
    (phase_2_state_aplctn_deemd_cmpltn_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS phase_2_state_aplctn_deemd_cmpltn_dt,
    (phase_2_fed_cmt_prd_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_2_fed_cmt_prd_strt_dt,
    (phase_2_fed_cmt_prd_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_2_fed_cmt_prd_end_dt,
    (phase_2_dsrd_aprvl_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_2_dsrd_aprvl_dt,
    (phase_3_a_sme_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_a_sme_strt_dt,
    (phase_3_a_sme_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_a_sme_end_dt,
    (phase_3_a_frvt_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_a_frvt_strt_dt,
    (phase_3_a_frvt_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_a_frvt_end_dt,
    (phase_3_b_cmcs_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_b_cmcs_strt_dt,
    (phase_3_b_cmcs_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_b_cmcs_end_dt,
    (phase_3_b_ogc_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_b_ogc_strt_dt,
    (phase_3_b_ogc_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_b_ogc_end_dt,
    (phase_3_b_omb_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_b_omb_strt_dt,
    (phase_3_b_omb_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_b_omb_end_dt,
    (phase_3_c_ogc_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_c_ogc_strt_dt,
    (phase_3_c_ogc_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_c_ogc_end_dt,
    (phase_3_c_omb_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_3_c_omb_strt_dt,
    (phase_3_c_omb_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_3_c_omb_end_dt,
    (phase_4_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_4_strt_dt,
    (phase_4_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_4_end_dt,
    (phase_5_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_5_strt_dt,
    (phase_5_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_5_end_dt,
    (phase_6_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS phase_6_strt_dt,
    (phase_6_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS phase_6_end_dt
FROM base_applications
