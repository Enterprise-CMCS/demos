SELECT pmda_tags.* FROM {{ ref('cleaned_demos_app_tag') }} AS pmda_tags
WHERE pmda_tags.tag_name_id NOT IN (
    SELECT demos_tags.tag_name_id FROM {{ source('demos_app', 'tag') }} AS demos_tags
)
