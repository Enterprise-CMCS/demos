WITH demos AS (
    (
        SELECT
            id,
            application_type_id,
            _legacy_mdcd_pendg_demo_id,
            NULL::UUID AS demonstration_id
        FROM {{ ref('final_demos_app_demonstration') }}
    )
    UNION ALL
    (
        SELECT
            id,
            application_type_id,
            _legacy_mdcd_pendg_demo_id,
            demonstration_id
        FROM {{ ref('final_demos_app_amendment') }}
    )
)

SELECT
    docs.name,
    docs.description,
    docs.owner_user_id,
    docs.document_type_id,
    demos.id AS application_id,
    demos.application_type_id,
    demos.demonstration_id,
    docs.phase_id,
    docs.created_at,
    docs.updated_at,
    docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
FROM {{ ref('docs_pmda_app_docs_with_person') }} AS docs
LEFT JOIN demos
    ON
        docs._legacy_mdcd_pendg_demo_id = demos._legacy_mdcd_pendg_demo_id
