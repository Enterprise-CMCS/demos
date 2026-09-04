SELECT * FROM {{ ref('deliverables_active_due_date_change_request') }}
WHERE deliverable_id IS NULL
