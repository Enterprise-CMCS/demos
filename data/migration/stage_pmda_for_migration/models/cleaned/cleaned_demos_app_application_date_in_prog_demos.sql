SELECT
    demos.id AS application_id,
    dates.date_type AS date_type_id,
    dates.date_value_cleaned AS date_value,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('apps_in_prog_dates_long') }} AS dates
INNER JOIN
    {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS demos
    ON
        dates.mdcd_demo_aplctn_id = demos.mdcd_demo_aplctn_id
WHERE
    dates.date_value_cleaned IS NOT NULL
