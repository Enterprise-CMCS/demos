WITH finalized_applications AS (
    SELECT demo.id
    FROM
        {{ ref('cleaned_demos_app_demonstration_finalized_demos') }} AS demo
    UNION ALL
    SELECT amendment.id
    FROM
        {{ ref('cleaned_demos_app_finalized_amendment') }} AS amendment
)

SELECT
    finalized_applications.id AS application_id,
    phase.id AS phase_id,
    'Completed' AS phase_status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    finalized_applications
INNER JOIN
    {{ source('demos_app', 'phase') }} AS phase
    ON
        TRUE
