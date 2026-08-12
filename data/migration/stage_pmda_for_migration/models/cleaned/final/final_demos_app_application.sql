<<<<<<< HEAD
SELECT
    id,
    application_type_id,
    TRUE AS is_migrated_from_pmda
FROM
    {{ ref('final_demos_app_demonstration') }}
=======
WITH applications AS (
    SELECT
        id,
        application_type_id,
        _legacy_mdcd_demo_id,
        _legacy_mdcd_pendg_demo_id

    FROM {{ ref('final_demos_app_demonstration') }}
    UNION ALL
    SELECT
        id,
        application_type_id,
        NULL::INTEGER AS _legacy_mdcd_demo_id,
        _legacy_mdcd_pendg_demo_id
    FROM {{ ref('final_demos_app_amendment') }}
)

SELECT
    applications.*,
    TRUE AS is_migrated_from_pmda
FROM
    applications
>>>>>>> main
