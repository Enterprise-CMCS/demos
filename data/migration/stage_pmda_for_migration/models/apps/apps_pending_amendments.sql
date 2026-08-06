SELECT
    amendment_application.demonstration_id,
    amendment_application.demonstration_status_id,
    pending_demo.mdcd_demo_name AS name, -- noqa: RF04
    pending_demo.mdcd_demo_desc AS description,
    pending_demo.state_prfmnc_yr_strt_dt AS effective_date,
    amendment_application.status_updated_at,
    pending_demo.mdcd_demo_aplctn_sgntr_lvl_cd AS _legacy_signature_level_id,
    coalesce(pending_demo.creatd_dt, current_timestamp) AS created_at,
    coalesce(pending_demo.updtd_dt, pending_demo.creatd_dt, current_timestamp) AS updated_at,
    pending_demo.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    amendment_application._legacy_mdcd_demo_aplctn_stus_cd
FROM
    {{ ref('apps_amendment_applications') }} AS amendment_application
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pending_demo
    ON
        amendment_application._legacy_mdcd_pendg_demo_id = pending_demo.mdcd_pendg_demo_id
