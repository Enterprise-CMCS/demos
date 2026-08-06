SELECT * FROM {{ ref('apps_active_finalized_pmda_amendments') }}
WHERE demonstration_id IS NULL
