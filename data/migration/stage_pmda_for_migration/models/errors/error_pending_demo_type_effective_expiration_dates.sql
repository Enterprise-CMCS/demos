SELECT * FROM {{ ref('app_pmda_pending_demonstration_types') }}
WHERE
    effective_date IS NULL OR expiration_date IS NULL
    OR effective_date > expiration_date
