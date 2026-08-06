SELECT
    docs.name,
    docs.description,
    docs.owner_user_id,
    docs.document_type_id,
    application.id AS application_id,
    application.application_type_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
FROM {{ ref('docs_pmda_app_docs_with_person') }} AS docs
LEFT JOIN {{ ref('final_demos_app_application') }} AS application
    ON
        docs._legacy_mdcd_pendg_demo_id = application._legacy_mdcd_pendg_demo_id
