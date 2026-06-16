const dataFetchQuery = `
WITH primary_roles AS (
    SELECT
        p.first_name || ' ' || p.last_name AS full_name,
        pdra.demonstration_id,
        pdra.role_id
    FROM
        demos_app.primary_demonstration_role_assignment AS pdra
    INNER JOIN
        demos_app.person AS p
        ON
            pdra.person_id = p.id
)

SELECT
    demo.state_id AS state_territory,
    demo.name AS demonstration_title,
    demo.medicaid_id AS demonstration_number,
    coalesce(
        max(CASE WHEN demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)' THEN demo.chip_id END)
            OVER (PARTITION BY demo_type.demonstration_id),
        '-'
    ) AS chip_id,
    demo.status_id AS status,
    to_char(demo.status_updated_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS status_update_date,
    to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS demonstration_effective_date,
    to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS demonstration_expiration_date,
    primary_project_officer.full_name AS primary_project_officer,
    coalesce(primary_state_poc.full_name, '-') AS primary_state_poc,
    coalesce(to_char(app_date.date_value AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS application_approval_date,
    demo_type.tag_name_id AS demonstration_type,
    to_char(demo_type.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')
        AS demonstration_type_effective_date,
    to_char(demo_type.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')
        AS demonstration_type_expiration_date
FROM
    demos_app.demonstration_type_tag_assignment AS demo_type

-- Almost by definition, demonstration types have demonstrations
INNER JOIN
    demos_app.demonstration AS demo
    ON
        demo_type.demonstration_id = demo.id

-- Every demonstration has a primary project officer
INNER JOIN
    primary_roles AS primary_project_officer
    ON
        demo_type.demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'

-- Every demonstration not guaranteed to have state POC
LEFT JOIN
    primary_roles AS primary_state_poc
    ON
        demo_type.demonstration_id = primary_state_poc.demonstration_id
        AND primary_state_poc.role_id = 'State Point of Contact'

-- Not all demonstrations have an approval date
LEFT JOIN
    demos_app.application_date AS app_date
    ON
        demo_type.demonstration_id = app_date.application_id
        AND app_date.date_type_id = 'Approval Summary Completion Date';
`;

export const demonstrationTypesReportQueries = [dataFetchQuery];
