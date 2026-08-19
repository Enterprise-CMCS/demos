WITH liz_hill AS (
    SELECT id
    FROM
        {{ source('legacy_pmda_staged', 'final_demos_app_person') }}
    WHERE
        _legacy_users_id = 828
)

select 
    gen_random_uuid() AS id,
    f_deliv.
 from
    {{ ref('final_demos_app_deliverable') }} AS f_deliv
    
-- Just putting the ID on every row
INNER JOIN
    liz_hill
    ON
        TRUE
