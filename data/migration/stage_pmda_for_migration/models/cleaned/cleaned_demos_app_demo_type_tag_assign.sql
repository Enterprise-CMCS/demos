SELECT
    id AS demonstration_id,
    'Migrated From PMDA' AS tag_name_id,
    'Demonstration Type' AS tag_type_id,
    effective_date,
    expiration_date,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
UNION ALL
SELECT
    demonstration_id,
    tag_name_id,
    tag_type_id,
    effective_date,
    expiration_date,
    created_at,
    updated_at
FROM {{ ref('app_pmda_demo_types_with_demos_finalized') }} AS finalized_demo_types
WHERE
    finalized_demo_types._legacy_mdcd_demo_id NOT IN (
        SELECT e1._legacy_mdcd_demo_id FROM {{ ref('errors_demo_type_with_no_demo_finalized') }} AS e1
    )
    AND NOT EXISTS (
        SELECT 1
        FROM {{ ref('errors_demo_type_effective_expiration_dates') }} AS e2
        WHERE
            e2._legacy_mdcd_demo_id = finalized_demo_types._legacy_mdcd_demo_id
            AND e2.tag_name_id = finalized_demo_types.tag_name_id
    )
UNION ALL
SELECT
    demonstration_id,
    tag_name_id,
    tag_type_id,
    effective_date,
    expiration_date,
    created_at,
    updated_at
FROM {{ ref('app_pmda_demo_types_pending_with_demos_in_prog') }} AS in_prog_demo_types
WHERE
    in_prog_demo_types._legacy_mdcd_pendg_demo_id NOT IN (
        SELECT e1._legacy_mdcd_pendg_demo_id
        FROM {{ ref('errors_demo_type_with_no_demo_pending') }} AS e1
    )
    AND NOT EXISTS (
        SELECT 1
        FROM {{ ref('errors_demo_type_effective_expiration_dates_pending') }} AS e2
        WHERE
            e2._legacy_mdcd_pendg_demo_id = in_prog_demo_types._legacy_mdcd_pendg_demo_id
            AND e2.tag_name_id = in_prog_demo_types.tag_name_id
    )
