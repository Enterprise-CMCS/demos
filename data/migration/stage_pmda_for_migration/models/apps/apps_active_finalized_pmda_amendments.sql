SELECT
    demos.id AS demonstration_id,
    demos.status_id AS demonstration_status_id,
    coalesce(amendment.mdcd_demo_amndmt_name, 'Amendment on ' || demos.name) AS mdcd_demo_amndmt_name,
    amendment.amndmt_desc,
    coalesce(
        (amendment.amndmt_prd_from_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
        demos.effective_date
    ) AS effective_date,
    'Approved' AS status_id,
    coalesce(amendment.amndmt_stus_dt, app.mdcd_demo_aplctn_stus_dt) AS amndmt_stus_dt,
    amendment.mdcd_demo_aplctn_sgntr_lvl_cd,
    amendment.creatd_dt,
    amendment.mdcd_demo_amndmt_id AS _legacy_mdcd_demo_amndmt_id,
    amendment.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo_amndmt') }} AS amendment
LEFT JOIN
    {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS app
    ON
        amendment.mdcd_pendg_demo_id = app.mdcd_pendg_demo_id
LEFT JOIN
    {{ ref('final_demos_app_demonstration') }} AS demos
    ON
        amendment.mdcd_demo_id = demos._legacy_mdcd_demo_id
WHERE
    amendment.dltd_ind = 0
    AND (
        amendment.mdcd_demo_amndmt_stus_cd = 2
        OR app.mdcd_demo_aplctn_stus_cd = 9
    )
