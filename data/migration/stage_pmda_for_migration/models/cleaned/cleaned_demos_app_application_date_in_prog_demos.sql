SELECT
    demos.id AS application_id,
    dates.date_type AS date_type_id,
    dates.date_value,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('apps_in_prog_dates_unpivoted') }} AS dates
INNER JOIN
    {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS demos
    ON
        dates.id = demos.id
WHERE
    NOT EXISTS (
        SELECT 1
        FROM {{ ref('errors_application_dates_failing_validation') }} AS errors
        WHERE
            errors.id = dates.id
            AND errors.date_type = dates.date_type
    )
