SELECT *
FROM {{ ref('final_demos_app_extension') }}
WHERE
    effective_date IS NOT NULL AND (effective_date AT TIME ZONE 'America/New_York')::TIME != TIME '00:00:00.000'
