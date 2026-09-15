SELECT * FROM {{ ref('deliverables_deliverable_submission_events') }}
WHERE demos_deliverable_id IS NULL
