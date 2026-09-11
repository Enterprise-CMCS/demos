SELECT * FROM {{ ref('deliverables_crosswalked_pmda_deliverables') }}
WHERE due_date IS NULL
