SELECT
    'Extension' AS application_type_id,
    extension.demonstration_id,
    extension.demonstration_status_id,
    extension.name, -- noqa: RF04
    extension.description,
    extension.effective_date,
    cw2.status_id,
    extension.status_updated_at,
    cw1.signature_level_id,
    extension.created_at,
    extension.updated_at,
    extension._legacy_mdcd_pendg_demo_id,
    extension._legacy_mdcd_demo_aplctn_id,
    extension.phase_1_strt_dt,
    extension.phase_1_end_dt,
    extension.phase_2_rcvd_dt,
    extension.phase_2_cmpltns_rvw_dt,
    extension.phase_2_state_aplctn_deemd_cmpltn_dt,
    extension.phase_2_fed_cmt_prd_strt_dt,
    extension.phase_2_fed_cmt_prd_end_dt,
    extension.phase_2_dsrd_aprvl_dt,
    extension.phase_3_a_sme_strt_dt,
    extension.phase_3_a_frvt_strt_dt,
    extension.phase_3_c_ogc_strt_dt,
    extension.phase_3_c_omb_strt_dt,
    extension.phase_4_strt_dt,
    extension.phase_4_end_dt,
    extension.phase_5_strt_dt,
    extension.phase_5_end_dt,
    extension.phase_6_strt_dt,
    extension.phase_6_end_dt
FROM
    {{ ref('apps_pending_extensions') }} AS extension -- noqa: RF04
LEFT JOIN
    {{ source('legacy_pmda_staged','crosswalk_mdcd_demo_aplctn_sgntr_lvl_cd_to_signature_level_id') }} AS cw1
    ON
        extension._legacy_signature_level_id = cw1.mdcd_demo_aplctn_sgntr_lvl_cd
LEFT JOIN
    {{ source('legacy_pmda_staged','crosswalk_mdcd_demo_aplctn_stus_cd_to_application_status_id') }} AS cw2
    ON
        extension._legacy_mdcd_demo_aplctn_stus_cd = cw2.mdcd_demo_aplctn_stus_cd
