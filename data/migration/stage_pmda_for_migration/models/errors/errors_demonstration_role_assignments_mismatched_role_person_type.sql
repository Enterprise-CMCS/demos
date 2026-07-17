{{ config(alias='errors_dra_bad_role_person_type') }}

SELECT
    udrac.mdcd_demo_id,
    udrac.state_id,
    udrac.source_column,
    udrac.legacy_user_id,
    udrac.person_id,
    udrac.person_type_id,
    udrac.role_id,
    udrac.is_primary
FROM
    {{ ref('users_demonstration_role_assignment_crosswalked') }} AS udrac
LEFT JOIN
    {{ source('demos_app', 'role_person_type') }} AS rpt
    ON
        udrac.role_id = rpt.role_id
        AND udrac.person_type_id = rpt.person_type_id
WHERE
    rpt.role_id IS NULL
