SELECT pmda_tags.* FROM {{ ref('cleaned_demos_app_tag_name') }} AS pmda_tags
WHERE pmda_tags.id NOT IN (
    SELECT demos_tags.id FROM {{ source('demos_app', 'tag_name') }} AS demos_tags
)
