SELECT
    au.new_id AS id,
    CASE
        WHEN role_pivot.has_demos_admin = 1 THEN 'demos-admin'
        WHEN role_pivot.has_demos_cms_user = 1 THEN 'demos-cms-user'
        WHEN role_pivot.has_demos_state_user = 1 THEN 'demos-state-user'
        WHEN role_pivot.has_non_user_contact = 1 THEN 'non-user-contact'
    END AS person_type_id,
    au.email,
    au.firstname AS first_name,
    au.lastname AS last_name,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('active_pmda_users') }} AS au
LEFT JOIN
    {{ ref('pmda_user_role_assignment_pivot') }} AS role_pivot
    ON
        au.original_id = role_pivot.user_id
