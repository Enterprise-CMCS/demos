SELECT
    d.id AS application_id,
    p.id AS phase_id,
    'Completed' AS phase_status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS d
INNER JOIN
    {{ source('demos_app', 'phase') }} AS p
    ON
        TRUE
