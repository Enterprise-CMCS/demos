SELECT
    tag_name_id AS id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM {{ ref('cleaned_demos_app_tag') }}
GROUP BY id
