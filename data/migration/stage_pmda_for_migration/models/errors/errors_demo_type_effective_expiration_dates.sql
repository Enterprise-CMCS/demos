SELECT * FROM {{ ref('apps_pmda_demo_types') }}
WHERE
    effective_date IS NULL OR expiration_date IS NULL
    OR effective_date > expiration_date
