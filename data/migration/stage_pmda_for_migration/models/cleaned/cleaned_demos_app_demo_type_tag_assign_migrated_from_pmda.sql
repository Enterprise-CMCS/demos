SELECT
    id AS demonstration_id,
    'Migrated from PMDA' AS tag_name_id,
    'Demonstration Type' AS tag_type_id,
    effective_date,
    expiration_date,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demonstration_finalized_demos' ) }}
