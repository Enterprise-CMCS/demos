SELECT
    'Amendment' AS application_type_id,
    amendment.demonstration_id,
    amendment.demonstration_status_id,
    amendment.name, -- noqa: RF04
    amendment.description,
    amendment.effective_date,
    cw2.status_id,
    amendment.status_updated_at,
    cw1.signature_level_id,
    amendment.created_at,
    amendment.updated_at,
    amendment._legacy_mdcd_pendg_demo_id,
    amendment._legacy_mdcd_demo_aplctn_id,
    amendment.phase_1_strt_dt,
    amendment.phase_1_end_dt,
    amendment.phase_2_rcvd_dt,
    amendment.phase_2_cmpltns_rvw_dt,
    amendment.phase_2_state_aplctn_deemd_cmpltn_dt,
    amendment.phase_2_fed_cmt_prd_strt_dt,
    amendment.phase_2_fed_cmt_prd_end_dt,
    amendment.phase_2_dsrd_aprvl_dt,
    amendment.phase_3_a_sme_strt_dt,
    amendment.phase_3_a_frvt_strt_dt,
    amendment.phase_3_c_ogc_strt_dt,
    amendment.phase_3_c_omb_strt_dt,
    amendment.phase_4_strt_dt,
    amendment.phase_4_end_dt,
    amendment.phase_5_strt_dt,
    amendment.phase_5_end_dt,
    amendment.phase_6_strt_dt,
    amendment.phase_6_end_dt
FROM
    {{ ref('apps_pending_amendments') }} AS amendment
LEFT JOIN
    {{ ref('crosswalk_mdcd_demo_aplctn_sgntr_lvl_cd_to_signature_level_id') }} AS cw1
    ON
        amendment._legacy_signature_level_id = cw1.mdcd_demo_aplctn_sgntr_lvl_cd
LEFT JOIN
    {{ ref('crosswalk_mdcd_demo_aplctn_stus_cd_to_application_status_id') }} AS cw2
    ON
        amendment._legacy_mdcd_demo_aplctn_stus_cd = cw2.mdcd_demo_aplctn_stus_cd
