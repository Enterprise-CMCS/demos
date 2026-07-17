WITH valid_primary_assignments AS (
    SELECT udrac.*
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
),

duplicate_primary_groups AS (
    SELECT
        mdcd_demo_id,
        role_id,
        count(*) AS primary_count
    FROM
        valid_primary_assignments
    GROUP BY
        mdcd_demo_id,
        role_id
    HAVING
        count(*) > 1
)

SELECT
    vpa.mdcd_demo_id,
    vpa.state_id,
    vpa.source_column,
    vpa.legacy_user_id,
    vpa.person_id,
    vpa.person_type_id,
    vpa.role_id,
    dpg.primary_count
FROM
    valid_primary_assignments AS vpa
INNER JOIN
    duplicate_primary_groups AS dpg
    ON
        vpa.mdcd_demo_id = dpg.mdcd_demo_id
        AND vpa.role_id = dpg.role_id
