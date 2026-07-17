SELECT
    gen_random_uuid() AS id,
    'Demonstration' AS application_type_id,
    d.mdcd_demo_name AS name, -- noqa: RF04
    trim(d.mdcd_demo_desc) AS description,
    (d.state_prfmnc_yr_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS effective_date,
    (d.state_prfmnc_yr_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York' AS expiration_date,
    cw1.sdg_division_id,
    'OA' AS signature_levle_id,
    cw2.status_id,
    (d.demo_stus_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS status_updated_at,
    d.mdcd_demo_id AS _mdcd_demo_id
FROM
    {{ ref('apps_active_pmda_demos') }} AS d
LEFT JOIN
    {{ ref('crosswalk_mdcd_chip_dv_cd_to_sdg_division_id') }} AS cw1
    ON
        d.mdcd_chip_div_cd = cw1.mdcd_chip_div_cd
LEFT JOIN
    {{ ref('crosswalk_mdcd_demo_stus_cd_to_status_id') }} AS cw2
    ON
        d.mdcd_demo_stus_cd = cw2.mdcd_demo_stus_cd
WHERE
    d.mdcd_demo_id NOT IN (
        SELECT e1.mdcd_demo_id FROM {{ ref('errors_demos_with_invalid_medicaid_chip_id_numbers') }} AS e1
    )
    AND d.mdcd_demo_id NOT IN (
        SELECT e2.mdcd_demo_id FROM {{ ref('errors_demos_with_missing_invalid_state_code') }} AS e2
    )
