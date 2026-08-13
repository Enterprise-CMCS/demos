SELECT
    docs.name,
    docs.description,
    person.id AS owner_user_id,
    docs.document_type_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    docs._legacy_mdcd_demo_aplctn_doc_type_cd,
    docs._legacy_creatd_user_id,
    docs._legacy_mdcd_pendg_demo_id,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_fil_id,
    docs._legacy_upldd_fil_name,
    docs.pmda_s3_file_id
FROM {{ ref('docs_pmda_app_docs_rpstry_doc_type_phase') }} AS docs
LEFT JOIN {{ ref('final_demos_app_person') }} AS person
    ON
        docs._legacy_creatd_user_id = person._legacy_users_id
