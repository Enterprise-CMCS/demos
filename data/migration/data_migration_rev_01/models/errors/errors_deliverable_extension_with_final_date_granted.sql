SELECT * FROM {{ ref('deliverables_active_due_date_change_request') }}
WHERE final_date_granted IS NOT NULL
