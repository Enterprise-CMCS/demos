<<<<<<< HEAD
SELECT * FROM {{ ref('cleaned_demos_app_tag_migrated_from_pmda') }}
=======
SELECT pmda_tags.* FROM {{ ref('cleaned_demos_app_tag') }} AS pmda_tags
WHERE
    NOT EXISTS (
        SELECT 1 FROM {{ source('demos_app', 'tag') }} AS demos_tags
        WHERE
            pmda_tags.tag_name_id = demos_tags.tag_name_id
            AND pmda_tags.tag_type_id = demos_tags.tag_type_id
    )
>>>>>>> main
