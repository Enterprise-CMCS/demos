WITH demos AS (
    (
        SELECT id
        FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }}
    )
    UNION ALL
    (
        SELECT id
        FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
    )
)

SELECT
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id,
    docs.orgnl_fil_name,
    docs.mdcd_demo_aplctn_doc_desc,
    docs.owner_user_id,
    docs.document_type_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    demos.id AS application_id
FROM {{ ref('docs_pmda_docs_with_person') }} AS docs
LEFT JOIN demos
    ON
        docs.mdcd_pendg_demo_id = demos.mdcd_pendg_demo_id
