SELECT
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs.orgnl_fil_name,
    docs.mdcd_demo_aplctn_doc_desc,
    docs.created_at,
    docs.updated_at,
    doc_type.document_type_id,
    docs.mdcd_demo_aplctn_doc_type_cd,
    docs.creatd_user_id,
    docs.mdcd_pendg_demo_id
FROM {{ ref('docs_pmda_docs_rpstry') }} AS docs
LEFT JOIN {{ ref('crosswalk_mdcd_demo_aplctn_doc_type_cd_to_document_type') }} AS doc_type
    ON
        docs.mdcd_demo_aplctn_doc_type_cd = doc_type.mdcd_demo_aplctn_doc_type_cd
