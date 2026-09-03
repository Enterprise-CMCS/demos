SELECT
    gen_random_uuid() AS id,
    application_type_id,
    demonstration_id,
    demonstration_status_id,
    name, -- noqa: RF04
    description,
    effective_date,
    status_id,
    status_updated_at,
    'CMS (OSORA)' AS clearance_level_id,
    signature_level_id,
    created_at,
    updated_at,
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
    NULL::INTEGER AS _legacy_mdcd_demo_rnwl_id,
    _legacy_mdcd_pendg_demo_id,
    _legacy_mdcd_demo_aplctn_id,
    _legacy_temp_extnsn_ind
FROM
    {{ ref('apps_unfiltered_staged_in_prog_extensions') }}
WHERE _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e1._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_apps_pendg_extensions_with_no_applications') }} AS e1
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e2._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_extension_applications_with_no_demo') }} AS e2
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e3._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_app_in_prog_extension_invalid_signature_level') }} AS e3
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e6._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_extension_applications_with_no_temp_status') }} AS e6
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e5._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_extension_applications_that_are_temp') }} AS e5
)
