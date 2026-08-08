WITH tag_names AS (
    SELECT DISTINCT tag_name_id FROM {{ ref('cleaned_demos_app_tag') }}
)

SELECT
    tag_name_id AS id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM tag_names
