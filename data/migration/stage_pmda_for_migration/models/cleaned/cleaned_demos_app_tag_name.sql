SELECT
    tag_name_id AS id,
    min(created_at) AS created_at,
    min(updated_at) AS updated_at
FROM {{ ref('cleaned_demos_app_tag') }}
GROUP BY id
