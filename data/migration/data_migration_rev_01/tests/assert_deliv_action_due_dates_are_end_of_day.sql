SELECT *
FROM {{ ref('final_demos_app_deliverable_action') }}
WHERE
    ((old_due_date AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999')
    OR ((new_due_date AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999')
