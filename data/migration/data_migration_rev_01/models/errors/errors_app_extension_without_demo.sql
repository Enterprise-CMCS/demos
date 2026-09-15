SELECT * FROM {{ ref('apps_active_finalized_pmda_extensions') }}
WHERE demonstration_id IS NULL
