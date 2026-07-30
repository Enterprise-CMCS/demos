SELECT
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs.mdcd_pendg_demo_id,
    docs.orgnl_fil_name,
    docs.mdcd_demo_aplctn_doc_desc,
    docs.owner_user_id,
    docs.document_type_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    apps.mdcd_demo_aplctn_id,
    apps.mdcd_demo_aplctn_type_cd
FROM {{ ref('docs_pmda_docs_with_person') }} AS docs
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS apps
    ON
        docs.mdcd_pendg_demo_id = apps.mdcd_pendg_demo_id
