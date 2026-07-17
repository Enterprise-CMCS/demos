SELECT DISTINCT
    udrac.person_id,
    udrac.mdcd_demo_id AS _legacy_mdcd_demo_id,
    udrac.role_id
FROM
    {{ ref('users_demonstration_role_assignment_crosswalked') }} AS udrac
WHERE
    udrac.is_primary
    AND NOT EXISTS (
        SELECT 1
        FROM
            {{ ref('errors_demonstration_role_assignments_with_no_resolved_person') }} AS unresolved_person
        WHERE
            udrac.mdcd_demo_id = unresolved_person.mdcd_demo_id
            AND udrac.state_id = unresolved_person.state_id
            AND udrac.source_column = unresolved_person.source_column
            AND udrac.legacy_user_id = unresolved_person.legacy_user_id
            AND udrac.role_id = unresolved_person.role_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM
            {{ ref('errors_demonstration_role_assignments_mismatched_state_assignment') }} AS mismatched_state
        WHERE
            udrac.mdcd_demo_id = mismatched_state.mdcd_demo_id
            AND udrac.state_id = mismatched_state.state_id
            AND udrac.source_column = mismatched_state.source_column
            AND udrac.legacy_user_id = mismatched_state.legacy_user_id
            AND udrac.role_id = mismatched_state.role_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM
            {{ ref('errors_demonstration_role_assignments_mismatched_role_person_type') }}
                AS mismatched_role_person_type
        WHERE
            udrac.mdcd_demo_id = mismatched_role_person_type.mdcd_demo_id
            AND udrac.state_id = mismatched_role_person_type.state_id
            AND udrac.source_column = mismatched_role_person_type.source_column
            AND udrac.legacy_user_id = mismatched_role_person_type.legacy_user_id
            AND udrac.role_id = mismatched_role_person_type.role_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM
            {{ ref('errors_demonstration_role_assignments_with_multiple_primaries') }} AS multiple_primaries
        WHERE
            udrac.mdcd_demo_id = multiple_primaries.mdcd_demo_id
            AND udrac.state_id = multiple_primaries.state_id
            AND udrac.source_column = multiple_primaries.source_column
            AND udrac.legacy_user_id = multiple_primaries.legacy_user_id
            AND udrac.role_id = multiple_primaries.role_id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM
            {{ ref('errors_demonstration_role_assignments_without_primary_project_officer') }}
                AS missing_primary_project_officer
        WHERE
            udrac.role_id = 'Project Officer'
            AND udrac.mdcd_demo_id = missing_primary_project_officer.mdcd_demo_id
            AND udrac.state_id = missing_primary_project_officer.demonstration_state_id
    )
