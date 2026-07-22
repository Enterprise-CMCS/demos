SELECT
    fd.mdcd_demo_id,
    fd.proj_ofcr_user_id,
    'Demonstration' AS application_type_id,
    fd.mdcd_demo_name AS name, -- noqa: RF04
    trim(fd.mdcd_demo_desc) AS description,
    (fd.state_prfmnc_yr_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    (fd.state_prfmnc_yr_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS expiration_date,
    cw1.sdg_division_id,
    'OA' AS signature_level_id,
    cw2.status_id,
    (fd.demo_stus_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS status_updated_at,
    'Approval Summary' AS current_phase_id,
    fd.geo_ansi_state_cd AS state_id,
    fdnum.cleaned_mdcd_demo_num AS medicaid_id,
    fdnum.cleaned_mdcd_scndry_demo_num AS chip_id,
    fd.creatd_dt,
    fd.updtd_dt
FROM
    {{ ref('apps_active_finalized_pmda_demos') }} AS fd
LEFT JOIN
    {{ ref('crosswalk_mdcd_chip_dv_cd_to_sdg_division_id') }} AS cw1
    ON
        fd.mdcd_chip_div_cd = cw1.mdcd_chip_div_cd
LEFT JOIN
    {{ ref('crosswalk_mdcd_demo_stus_cd_to_application_status_id') }} AS cw2
    ON
        fd.mdcd_demo_stus_cd = cw2.mdcd_demo_stus_cd
LEFT JOIN
    {{ ref('apps_active_finalized_pmda_demos_mdcd_num_validations') }} AS fdnum
    ON
        fd.mdcd_demo_id = fdnum.mdcd_demo_id
