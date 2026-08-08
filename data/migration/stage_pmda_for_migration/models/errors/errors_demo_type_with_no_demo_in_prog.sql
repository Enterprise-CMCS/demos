SELECT * FROM {{ ref('app_pmda_demo_types_pending_with_demos_in_prog') }}
WHERE demonstration_id IS NULL
