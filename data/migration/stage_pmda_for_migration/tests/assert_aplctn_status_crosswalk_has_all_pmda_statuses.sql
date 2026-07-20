-- Error in cases where we did not map a mdcd_demo_aplctn_stus_cd to a application_status_id

SELECT pmda.mdcd_demo_aplctn_stus_cd
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn_stus_rfrnc') }} AS pmda
WHERE
    pmda.mdcd_demo_aplctn_stus_cd NOT IN (
        SELECT cw.mdcd_demo_aplctn_stus_cd
        FROM {{ ref('crosswalk_mdcd_demo_aplctn_stus_cd_to_application_status_id') }} AS cw
    )
