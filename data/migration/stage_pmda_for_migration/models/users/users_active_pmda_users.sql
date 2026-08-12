SELECT
    u.id,
    u.username,
    u.firstname,
    u.lastname,
    u.email,
    CASE
        WHEN role_pivot.has_demos_admin = 1 THEN 'demos-admin'
        WHEN role_pivot.has_demos_cms_user = 1 THEN 'demos-cms-user'
        WHEN role_pivot.has_demos_state_user = 1 THEN 'demos-state-user'
        WHEN role_pivot.has_non_user_contact = 1 THEN 'non-user-contact'
    END AS resolved_person_type_id
FROM
    {{ source('legacy_pmda_raw', 'users') }} AS u
LEFT JOIN
    {{ ref('users_pmda_user_role_assignment_pivot') }} AS role_pivot
    ON
        u.id = role_pivot.user_id
WHERE
    u.active = 1
