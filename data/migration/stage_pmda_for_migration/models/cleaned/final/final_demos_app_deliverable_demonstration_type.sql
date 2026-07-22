SELECT
    id AS deliverable_id,
    demonstration_id,
    'Migrated From PMDA' AS demonstration_type_tag_name_id
FROM
    {{ ref('final_demos_app_deliverable') }}
WHERE
    deliverable_type_id IN ('Implementation Plan', 'Monitoring Protocol')
