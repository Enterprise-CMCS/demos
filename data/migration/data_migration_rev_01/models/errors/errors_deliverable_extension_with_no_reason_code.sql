SELECT * FROM {{ ref('deliverables_due_date_change_request') }}
WHERE reason_code_id IS NULL
