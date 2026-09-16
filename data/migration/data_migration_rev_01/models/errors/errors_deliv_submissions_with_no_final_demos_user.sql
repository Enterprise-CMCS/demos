SELECT * FROM {{ ref('deliverables_deliverable_submission_events') }}
WHERE demos_user_id IS NULL
