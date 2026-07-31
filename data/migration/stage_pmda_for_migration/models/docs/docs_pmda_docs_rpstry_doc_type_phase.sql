SELECT
    docs.name,
    docs.description,
    doc_type.document_type_id,
    phase_document_type.phase_id,
    docs.created_at,
    docs.updated_at,
    docs._legacy_mdcd_pendg_demo_id,
    docs._legacy_creatd_user_id,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
FROM {{ ref('docs_pmda_docs_rpstry') }} AS docs
LEFT JOIN {{ ref('crosswalk_mdcd_demo_aplctn_doc_type_cd_to_document_type') }} AS doc_type
    ON
        docs._legacy_mdcd_demo_aplctn_doc_type_cd = doc_type._legacy_mdcd_demo_aplctn_doc_type_cd
-- documents types without phases and general files are intentionally mapped to a null phase_id 
LEFT JOIN {{ source('demos_app', 'phase_document_type') }} AS phase_document_type
    ON
        doc_type.document_type_id = phase_document_type.document_type_id
        AND doc_type.document_type_id != 'General File'
