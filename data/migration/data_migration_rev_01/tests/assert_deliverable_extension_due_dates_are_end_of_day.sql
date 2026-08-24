SELECT *
FROM {{ ref('final_demos_app_deliverable_extension') }}
WHERE
    original_date_requested IS NOT NULL
    AND (original_date_requested AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
    AND (final_date_granted AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
