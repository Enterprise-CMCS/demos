WITH applications AS (
    SELECT
        id,
        application_type_id
    FROM {{ ref('final_demos_app_demonstration') }}
    UNION ALL
    SELECT
        id,
        application_type_id
    FROM {{ ref('final_demos_app_amendment') }}
)

SELECT
    applications.*,
    TRUE AS is_migrated_from_pmda
FROM
    applications
