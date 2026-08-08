SELECT * FROM {{ ref('apps_pmda_demo_types_with_demos_finalized') }}
WHERE demonstration_id IS NULL
