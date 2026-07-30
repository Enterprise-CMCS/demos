SELECT
    doc_detail.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    doc_file.mdcd_demo_aplctn_doc_rpstry_fil_id,
    doc_file.orgnl_fil_name,
    doc_detail.mdcd_demo_aplctn_doc_desc,
    doc_detail.creatd_dt AS created_at,
    coalesce(doc_detail.updtd_dt, doc_detail.creatd_dt) AS updated_at,
    doc_detail.mdcd_demo_aplctn_doc_type_cd,
    doc_detail.creatd_user_id,
    doc_detail.mdcd_pendg_demo_id
FROM {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn_doc_rpstry_dtl') }} AS doc_detail
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn_doc_rpstry_fil') }} AS doc_file
    ON
        doc_detail.mdcd_demo_aplctn_doc_rpstry_dtl_id = doc_file.mdcd_demo_aplctn_doc_rpstry_dtl_id
