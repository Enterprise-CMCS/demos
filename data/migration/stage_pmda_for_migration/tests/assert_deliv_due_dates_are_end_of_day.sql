SELECT *
FROM {{ ref('final_demos_app_deliverable') }}
WHERE
    (due_date AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
