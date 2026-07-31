WITH documents AS (
    SELECT * FROM {{ ref('cleaned_demos_app_deliverable_docs') }}
    UNION ALL
    SELECT * FROM {{ ref('cleaned_demos_app_application_docs') }}
)

SELECT
    *,
    TRUE AS is_migrated_from_pmda
FROM documents
