SELECT * FROM {{ ref('deliverables_pmda_dlvrbl_comment') }}
WHERE deliverable_id IS NULL
