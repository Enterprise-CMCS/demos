WITH demos AS (
    (
        SELECT
            id,
            mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id
        FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }}
    )
    UNION ALL
    (
        SELECT
            id,
            _legacy_mdcd_pendg_demo_id
        FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
    )
)

SELECT
    docs.name,
    docs.description,
    docs.owner_user_id,
    docs.document_type_id,
    demos.id AS application_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
FROM {{ ref('docs_pmda_app_docs_with_person') }} AS docs
LEFT JOIN demos
    ON
        docs._legacy_mdcd_pendg_demo_id = demos._legacy_mdcd_pendg_demo_id
