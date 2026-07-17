{{ config(alias='errors_dra_missing_primary_project_officer') }}

WITH source_demonstrations AS (
    SELECT DISTINCT
        mdcd_demo_id,
        geo_ansi_state_cd AS demonstration_state_id
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_demo') }}
),

valid_primary_project_officer_assignments AS (
    SELECT udrac.*
    FROM
        {{ ref('users_demonstration_role_assignment_crosswalked') }} AS udrac
    WHERE
        udrac.role_id = 'Project Officer'
        AND udrac.is_primary
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

primary_project_officer_counts AS (
    SELECT
        sd.mdcd_demo_id,
        sd.demonstration_state_id,
        count(vppo.person_id) AS primary_project_officer_count
    FROM
        source_demonstrations AS sd
    LEFT JOIN
        valid_primary_project_officer_assignments AS vppo
        ON
            sd.mdcd_demo_id = vppo.mdcd_demo_id
            AND sd.demonstration_state_id = vppo.state_id
    GROUP BY
        sd.mdcd_demo_id,
        sd.demonstration_state_id
)

SELECT
    mdcd_demo_id,
    demonstration_state_id,
    primary_project_officer_count
FROM
    primary_project_officer_counts
WHERE
    primary_project_officer_count < 1
