SELECT
    tag_name_id,
    'Application' AS tag_type_id,
    'System' AS source_id,
    'Approved' AS status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demo_type_tag_assign') }}
GROUP BY
    tag_name_id
UNION ALL
SELECT
    tag_name_id AS id,
    'Demonstration Type' AS tag_type_id,
    'System' AS source_id,
    'Approved' AS status_id,
    min(created_at) AS created_at,
    min(updated_at) AS updated_at
FROM
    {{ ref('cleaned_demos_app_demo_type_tag_assign') }}
GROUP BY
    tag_name_id
