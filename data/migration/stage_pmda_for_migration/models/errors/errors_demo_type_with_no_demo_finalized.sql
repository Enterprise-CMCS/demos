SELECT * FROM {{ ref('app_pmda_demo_types_with_demos_finalized') }}
WHERE demonstration_id IS NULL
