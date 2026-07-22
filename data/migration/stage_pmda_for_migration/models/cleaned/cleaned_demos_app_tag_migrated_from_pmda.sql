SELECT
    id AS tag_name_id,
    'Application' AS tag_type_id,
    'System' AS source_id,
    'Approved' AS status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_tag_name_migrated_from_pmda') }}
UNION ALL
SELECT
    id AS tag_name_id,
    'Demonstration Type' AS tag_type_id,
    'System' AS source_id,
    'Approved' AS status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_tag_name_migrated_from_pmda') }}
