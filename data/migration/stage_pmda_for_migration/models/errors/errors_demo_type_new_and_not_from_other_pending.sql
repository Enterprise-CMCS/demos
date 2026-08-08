SELECT pmda_tag_name.*
FROM {{ ref('app_pmda_demo_types_pending') }} AS pmda_tag_name
WHERE
    pmda_tag_name.tag_name_id NOT IN (
        SELECT demos_tag_name.id
        FROM {{ source('demos_app', 'tag_name') }} AS demos_tag_name
    )
    AND pmda_tag_name._is_other = FALSE
