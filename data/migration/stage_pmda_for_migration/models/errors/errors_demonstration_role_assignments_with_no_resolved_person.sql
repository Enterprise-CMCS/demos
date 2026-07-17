SELECT
    udrac.mdcd_demo_id,
    udrac.state_id,
    udrac.source_column,
    udrac.legacy_user_id,
    udrac.role_id,
    udrac.is_primary
FROM
    {{ ref('users_demonstration_role_assignment_crosswalked') }} AS udrac
WHERE
    udrac.person_id IS NULL
