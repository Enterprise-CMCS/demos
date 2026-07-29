SELECT * FROM {{ ref('apps_in_prog_dates_long') }}
WHERE date_value IS DISTINCT FROM date_value_cleaned
