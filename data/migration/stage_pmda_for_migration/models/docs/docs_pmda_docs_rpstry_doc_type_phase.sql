SELECT
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs.orgnl_fil_name,
    docs.mdcd_demo_aplctn_doc_desc,
    docs.document_type_id,
    docs.created_at,
    docs.updated_at,
    phase_document_type.phase_id,
    docs.creatd_user_id,
    docs.mdcd_pendg_demo_id
FROM {{ ref('docs_pmda_docs_rpstry_doc_type_crosswalked') }} AS docs
-- documents types without phases and general files are intentionally mapped to a null phase_id 
LEFT JOIN {{ source('demos_app', 'phase_document_type') }} AS phase_document_type
    ON
        docs.document_type_id = phase_document_type.document_type_id
        AND docs.document_type_id != 'General File'
