{{ config(alias='errors_dra_bad_state_assignment') }}

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
    {{ ref('cleaned_demos_app_person_state') }} AS cps
    ON
        udrac.legacy_user_id = cps._legacy_id
        AND udrac.state_id = cps.state_id
WHERE
    udrac.person_type_id = 'demos-state-user'
    AND cps.person_id IS NULL
