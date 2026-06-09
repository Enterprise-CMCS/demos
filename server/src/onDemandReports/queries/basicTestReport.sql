SELECT
    id,
    name,
    description,
    state_id AS state,
    status_id AS status
FROM
    demos_app.demonstration
ORDER BY
    created_at DESC
LIMIT 5;
