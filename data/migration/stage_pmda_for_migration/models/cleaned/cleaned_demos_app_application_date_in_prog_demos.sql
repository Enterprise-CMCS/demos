SELECT
    d.id AS application_id,
    dc.date_type AS date_type_id,
    dc.date_value,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS d
INNER JOIN
    {{ ref('apps_in_prog_dates_validated') }} AS dc
    ON
        d.id = dc.id
WHERE d.id NOT IN (
    SELECT e1.id FROM {{ ref('errors_application_dates_failing_validation') }} AS e1
)
