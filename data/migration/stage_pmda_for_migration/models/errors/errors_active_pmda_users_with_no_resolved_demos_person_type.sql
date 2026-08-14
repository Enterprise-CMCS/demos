SELECT *
FROM
    {{ ref('users_active_pmda_users') }}
WHERE
    resolved_person_type_id IS NULL
