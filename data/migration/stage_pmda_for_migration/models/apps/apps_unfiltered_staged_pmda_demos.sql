SELECT
    fd.mdcd_demo_id,
    NULL AS mdcd_pendg_demo_id,
    'Demonstration' AS application_type_id,
    fd.mdcd_demo_name AS name, -- noqa: RF04
    trim(fd.mdcd_demo_desc) AS description,
    (fd.state_prfmnc_yr_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    (fd.state_prfmnc_yr_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS expiration_date,
    cw1.sdg_division_id,
    'OA' AS signature_level_id,
    cw2.status_id,
    (fd.demo_stus_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS status_updated_at,
    fdnum.cleaned_mdcd_demo_num AS medicaid_id,
    fdnum.cleaned_mdcd_scndry_demo_num AS chip_id
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
UNION ALL
SELECT
    NULL AS mdcd_demo_id,
    ipd.mdcd_pendg_demo_id,
    'Demonstration' AS application_type_id,
    ipd.mdcd_demo_name AS name, -- noqa: RF04
    trim(ipd.mdcd_demo_desc) AS description,
    CASE
        WHEN ipd.state_prfmnc_yr_strt_dt = '2099-01-01'::DATE THEN NULL
        ELSE (ipd.state_prfmnc_yr_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
    END AS effective_date,
    CASE
        WHEN ipd.state_prfmnc_yr_end_dt = '2099-01-31'::DATE THEN NULL
        ELSE (ipd.state_prfmnc_yr_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
    END AS expiration_date,
    cw1.sdg_division_id,
    'OA' AS signature_level_id,
    cw2.status_id,
    (ipd.mdcd_demo_aplctn_stus_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS status_updated_at,
    ipdnum.cleaned_mdcd_demo_num AS medicaid_id,
    NULL AS chip_id
FROM
    {{ ref('apps_active_in_progress_pmda_demos') }} AS ipd
LEFT JOIN
    {{ ref('crosswalk_mdcd_chip_dv_cd_to_sdg_division_id') }} AS cw1
    ON
        ipd.mdcd_chip_div_cd = cw1.mdcd_chip_div_cd
LEFT JOIN
    {{ ref('crosswalk_mdcd_demo_aplctn_stus_cd_to_application_status_id') }} AS cw2
    ON
        ipd.mdcd_demo_aplctn_stus_cd = cw2.mdcd_demo_aplctn_stus_cd
LEFT JOIN
    {{ ref('apps_active_in_progress_pmda_demos_mdcd_num_validations') }} AS ipdnum
    ON
        ipd.mdcd_pendg_demo_id = ipdnum.mdcd_pendg_demo_id
