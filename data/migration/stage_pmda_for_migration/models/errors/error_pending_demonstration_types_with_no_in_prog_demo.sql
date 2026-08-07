SELECT * FROM {{ ref('app_pmda_demonstration_types_in_prog_demos') }}
WHERE demonstration_id IS NULL
