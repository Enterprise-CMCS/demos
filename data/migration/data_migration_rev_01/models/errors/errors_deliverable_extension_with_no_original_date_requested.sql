SELECT * FROM {{ ref('deliverables_due_date_change_request') }}
WHERE original_date_requested IS NULL
