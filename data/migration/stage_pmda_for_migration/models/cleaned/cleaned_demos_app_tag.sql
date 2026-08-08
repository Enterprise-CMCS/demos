WITH tag_names AS (
    SELECT DISTINCT tag_name_id FROM
        {{ ref('cleaned_demos_app_demo_type_tag_assign') }}
),

tag_types AS (
    (
        SELECT 'Application' AS tag_type_id
        UNION ALL
        SELECT 'Demonstration Type' AS tag_type_id
    )
)

SELECT
    tag_names.tag_name_id,
    tag_types.tag_type_id,
    'System' AS source_id,
    'Approved' AS status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    tag_names
INNER JOIN
    tag_types
    ON
        tag_types.tag_type_id = 'Application'
