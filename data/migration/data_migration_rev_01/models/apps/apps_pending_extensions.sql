SELECT
    extension_application.demonstration_id,
    extension_application.demonstration_status_id,
    pending_demo.mdcd_demo_name AS name, -- noqa: RF04
    pending_demo.mdcd_demo_desc AS description,
    (pending_demo.state_prfmnc_yr_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    extension_application.status_updated_at,
    pending_demo.mdcd_demo_aplctn_sgntr_lvl_cd AS _legacy_signature_level_id,
    coalesce(pending_demo.creatd_dt, current_timestamp) AS created_at,
    coalesce(pending_demo.updtd_dt, pending_demo.creatd_dt, current_timestamp) AS updated_at,
    pending_demo.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    extension_application._legacy_mdcd_demo_aplctn_id,
    extension_application._legacy_mdcd_demo_aplctn_stus_cd,
    extension_application.phase_1_strt_dt,
    extension_application.phase_1_end_dt,
    extension_application.phase_2_rcvd_dt,
    extension_application.phase_2_cmpltns_rvw_dt,
    extension_application.phase_2_state_aplctn_deemd_cmpltn_dt,
    extension_application.phase_2_fed_cmt_prd_strt_dt,
    extension_application.phase_2_fed_cmt_prd_end_dt,
    extension_application.phase_2_dsrd_aprvl_dt,
    extension_application.phase_3_a_sme_strt_dt,
    extension_application.phase_3_a_frvt_strt_dt,
    extension_application.phase_3_c_ogc_strt_dt,
    extension_application.phase_3_c_omb_strt_dt,
    extension_application.phase_4_strt_dt,
    extension_application.phase_4_end_dt,
    extension_application.phase_5_strt_dt,
    extension_application.phase_5_end_dt,
    extension_application.phase_6_strt_dt,
    extension_application.phase_6_end_dt
FROM
    {{ ref('apps_extension_applications') }} AS extension_application
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pending_demo
    ON
        extension_application._legacy_mdcd_pendg_demo_id = pending_demo.mdcd_pendg_demo_id
