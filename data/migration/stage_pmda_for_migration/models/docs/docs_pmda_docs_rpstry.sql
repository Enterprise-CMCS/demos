SELECT
    trim(doc_file.orgnl_fil_name) AS name, -- noqa: RF04
    trim(doc_detail.mdcd_demo_aplctn_doc_desc) AS description,
    doc_detail.creatd_dt AS created_at,
    coalesce(doc_detail.updtd_dt, doc_detail.creatd_dt) AS updated_at,
    doc_detail.mdcd_demo_aplctn_doc_type_cd AS _legacy_mdcd_demo_aplctn_doc_type_cd,
    doc_detail.creatd_user_id AS _legacy_creatd_user_id,
    doc_detail.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id,
    doc_detail.mdcd_demo_aplctn_doc_rpstry_dtl_id AS _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
    doc_file.mdcd_demo_aplctn_doc_rpstry_fil_id AS _legacy_mdcd_demo_aplctn_doc_rpstry_fil_id
FROM {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn_doc_rpstry_dtl') }} AS doc_detail
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn_doc_rpstry_fil') }} AS doc_file
    ON
        doc_detail.mdcd_demo_aplctn_doc_rpstry_dtl_id = doc_file.mdcd_demo_aplctn_doc_rpstry_dtl_id
