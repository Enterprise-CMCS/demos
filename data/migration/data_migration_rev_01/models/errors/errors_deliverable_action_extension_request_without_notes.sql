SELECT * FROM {{ ref('deliverables_deliverable_extension_requested_events') }}
WHERE note IS NULL
