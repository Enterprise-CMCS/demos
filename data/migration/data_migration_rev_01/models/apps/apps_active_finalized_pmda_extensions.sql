SELECT
    demos.id AS demonstration_id,
    demos.status_id AS demonstration_status_id,
    coalesce(extension.mdcd_demo_rnwl_name, 'Extension on ' || demos.name) AS mdcd_demo_rnwl_name,
    extension.rnwl_desc,
    coalesce(
        (extension.rnwl_prd_from_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
        demos.effective_date
    ) AS effective_date,
    'Approved' AS status_id,
    coalesce(extension.rnwl_stus_dt, app.mdcd_demo_aplctn_stus_dt) AS rnwl_stus_dt,
    extension.mdcd_demo_aplctn_sgntr_lvl_cd,
    extension.creatd_dt,
    extension.mdcd_demo_rnwl_id AS _legacy_mdcd_demo_rnwl_id,
    extension.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    app.mdcd_demo_aplctn_id AS _legacy_mdcd_demo_aplctn_id,
    extension.temp_extnsn_ind AS _legacy_temp_extnsn_ind
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo_rnwl') }} AS extension -- noqa: RF04
LEFT JOIN
    {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS app
    ON
        extension.mdcd_pendg_demo_id = app.mdcd_pendg_demo_id
LEFT JOIN
    {{ source('legacy_pmda_staged', 'final_demos_app_demonstration') }} AS demos
    ON
        extension.mdcd_demo_id = demos._legacy_mdcd_demo_id
WHERE
    extension.dltd_ind = 0
    AND (
        extension.mdcd_demo_rnwl_stus_cd = 2
        OR app.mdcd_demo_aplctn_stus_cd = 9
    )
