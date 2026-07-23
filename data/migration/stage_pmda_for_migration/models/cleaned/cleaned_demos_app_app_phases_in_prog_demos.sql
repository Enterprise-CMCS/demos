SELECT
    d.id AS application_id,
    psu.phase_id,
    psu.phase_status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS d
INNER JOIN
    {{ ref('apps_in_prog_phase_statuses_unpivoted') }} AS psu
    ON
        d.id = psu.id
