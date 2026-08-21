SELECT
    id AS deliverable_extension_id,
    deliverable_id,
    status_id
FROM {{ ref('final_demos_app_deliverable_extension') }}
WHERE status_id = 'Requested'
