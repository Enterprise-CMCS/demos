SELECT
    gen_random_uuid() AS id,
    au.resolved_person_type_id AS person_type_id,
    au.email,
    au.firstname AS first_name,
    au.lastname AS last_name,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    {{ ref('users_active_pmda_users') }} AS au
WHERE
    au.id NOT IN (SELECT e1.id FROM {{ ref('errors_active_pmda_users_with_no_email_firstname_lastname') }} AS e1)
    AND au.id NOT IN (SELECT e2.id FROM {{ ref('errors_active_pmda_users_with_no_resolved_demos_person_type') }} AS e2)
