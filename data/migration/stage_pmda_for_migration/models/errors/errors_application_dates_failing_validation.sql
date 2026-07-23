SELECT
    id,
    mdcd_demo_aplctn_id,
    date_type,
    date_value,
    validation_failures
FROM {{ ref('apps_in_prog_dates_validated') }}
WHERE validation_failures IS NOT NULL
