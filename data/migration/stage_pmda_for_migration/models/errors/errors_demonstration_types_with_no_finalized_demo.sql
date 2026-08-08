SELECT * FROM {{ ref('app_pmda_demonstration_types_finalized_demos') }}
WHERE demonstration_id IS NULL
