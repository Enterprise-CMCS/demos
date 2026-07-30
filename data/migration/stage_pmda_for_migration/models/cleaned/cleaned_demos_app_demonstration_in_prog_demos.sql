SELECT
    gen_random_uuid() AS id,
    mdcd_pendg_demo_id,
    mdcd_demo_aplctn_id,
    application_type_id,
    name, -- noqa: RF04
    description,
    effective_date,
    expiration_date,
    sdg_division_id,
    signature_level_id,
    status_id,
    status_updated_at,
    NULL AS current_phase_id,
    state_id,
    'CMS (OSORA)' AS clearance_level_id,
    medicaid_id,
    chip_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at,
    creatd_dt,
    phase_1_strt_dt,
    phase_1_end_dt,
    phase_2_rcvd_dt,
    phase_2_cmpltns_rvw_dt,
    phase_2_state_aplctn_deemd_cmpltn_dt,
    phase_2_fed_cmt_prd_strt_dt,
    phase_2_fed_cmt_prd_end_dt,
    phase_2_dsrd_aprvl_dt,
    phase_3_a_sme_strt_dt,
    phase_3_a_frvt_strt_dt,
    phase_3_c_ogc_strt_dt,
    phase_3_c_omb_strt_dt,
    phase_4_strt_dt,
    phase_4_end_dt,
    phase_5_strt_dt,
    phase_5_end_dt,
    phase_6_strt_dt,
    phase_6_end_dt,
    proj_ofcr_user_id AS _legacy_proj_ofcr_user_id,
    mdcd_demo_aplctn_type_cd
FROM
    {{ ref('apps_unfiltered_staged_in_prog_pmda_demos') }}
WHERE
    mdcd_pendg_demo_id NOT IN (
        SELECT e1.mdcd_pendg_demo_id FROM {{ ref('errors_invalid_demo_nums_in_in_prog_pmda_demos') }} AS e1
    )
