SELECT
    finalized_demo.id AS demonstration_id,
    finalized_demo.status_id AS demonstration_status_id,
    amendment_application.mdcd_demo_aplctn_stus_cd AS _legacy_mdcd_demo_aplctn_stus_cd,
    amendment_application.mdcd_demo_aplctn_stus_dt AS status_updated_at,
    amendment_application.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    finalized_demo._legacy_mdcd_demo_id
FROM {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS amendment_application
LEFT JOIN {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS finalized_demo
    ON
        amendment_application.mdcd_demo_id = finalized_demo._legacy_mdcd_demo_id
WHERE
    amendment_application.mdcd_demo_aplctn_type_cd = 2
    AND amendment_application.dltd_ind = 0
    AND amendment_application.mdcd_demo_aplctn_stus_cd NOT IN (6, 8, 9, 10)
