SELECT *
FROM {{ ref('final_demos_app_demonstration') }}
WHERE
    expiration_date IS NOT NULL AND (expiration_date AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
