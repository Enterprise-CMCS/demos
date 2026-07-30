SELECT
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs.orgnl_fil_name,
    docs.mdcd_demo_aplctn_doc_desc,
    person.id AS owner_user_id,
    docs.document_type_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    docs.mdcd_pendg_demo_id
FROM {{ ref('docs_pmda_docs_rpstry_doc_type_phase') }} AS docs
LEFT JOIN {{ ref('final_demos_app_person') }} AS person
    ON
        docs.creatd_user_id = person._legacy_users_id
