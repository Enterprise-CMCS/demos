SELECT
    finalized_demo.id AS demonstration_id,
    finalized_demo.status_id AS demonstration_status_id,
    amendment_application.mdcd_demo_aplctn_stus_cd AS _legacy_mdcd_demo_aplctn_stus_cd,
    amendment_application.mdcd_demo_aplctn_stus_dt AS status_updated_at,
    amendment_application.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    finalized_demo._legacy_mdcd_demo_id,
    amendment_application.mdcd_demo_aplctn_id AS _legacy_mdcd_demo_aplctn_id,
    amendment_application.phase_1_strt_dt,
    amendment_application.phase_1_end_dt,
    amendment_application.phase_2_rcvd_dt,
    amendment_application.phase_2_cmpltns_rvw_dt,
    amendment_application.phase_2_state_aplctn_deemd_cmpltn_dt,
    amendment_application.phase_2_fed_cmt_prd_strt_dt,
    amendment_application.phase_2_fed_cmt_prd_end_dt,
    amendment_application.phase_2_dsrd_aprvl_dt,
    amendment_application.phase_3_a_sme_strt_dt,
    amendment_application.phase_3_a_frvt_strt_dt,
    amendment_application.phase_3_c_ogc_strt_dt,
    amendment_application.phase_3_c_omb_strt_dt,
    amendment_application.phase_4_strt_dt,
    amendment_application.phase_4_end_dt,
    amendment_application.phase_5_strt_dt,
    amendment_application.phase_5_end_dt,
    amendment_application.phase_6_strt_dt,
    amendment_application.phase_6_end_dt
FROM {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS amendment_application
LEFT JOIN {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS finalized_demo
    ON
        amendment_application.mdcd_demo_id = finalized_demo._legacy_mdcd_demo_id
WHERE
    amendment_application.mdcd_demo_aplctn_type_cd = 2
    AND amendment_application.dltd_ind = 0
    AND amendment_application.mdcd_demo_aplctn_stus_cd NOT IN (6, 8, 9, 10)
