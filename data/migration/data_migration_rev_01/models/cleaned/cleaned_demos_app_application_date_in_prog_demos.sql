WITH applications AS (
    SELECT
        id,
        _legacy_mdcd_demo_aplctn_id
    FROM {{ ref('cleaned_demos_app_in_prog_extension') }}
)

SELECT
    applications.id AS application_id,
    dates.date_type AS date_type_id,
    dates.date_value_cleaned AS date_value,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('apps_in_prog_dates_long') }} AS dates
INNER JOIN
    applications
    ON
        dates.mdcd_demo_aplctn_id = applications._legacy_mdcd_demo_aplctn_id
WHERE
    dates.date_value_cleaned IS NOT NULL
