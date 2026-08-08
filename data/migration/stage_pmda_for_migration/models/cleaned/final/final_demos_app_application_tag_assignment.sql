SELECT
    id AS application_id,
    'Migrated From PMDA' AS tag_name_id,
    'Application' AS tag_type_id
FROM {{ ref('final_demos_app_application') }}
