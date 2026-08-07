SELECT pmda_tag_name.*
FROM {{ ref('app_pmda_demonstration_types_in_prog_demos') }} AS pmda_tag_name
LEFT JOIN {{ source('demos_app', 'tag_name') }} AS demos_tag_name
    ON
        pmda_tag_name.tag_name_id = demos_tag_name.id
WHERE
    demos_tag_name.id IS NULL
    AND pmda_tag_name._is_other = FALSE
