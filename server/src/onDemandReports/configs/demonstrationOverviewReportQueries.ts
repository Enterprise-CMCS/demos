const dataFetchQuery = `
WITH active_extensions AS (
    SELECT
        demonstration_id,
        'Yes' AS extension_in_progress
    FROM
        demos_app.extension
    WHERE
        status_id IN ('Pre-Submission', 'Under Review', 'On-hold')
    GROUP BY
        demonstration_id
),

active_approved_amendments AS (
    SELECT
        demonstration_id,
        CASE
            WHEN
                max(CASE WHEN status_id IN ('Pre-Submission', 'Under Review', 'On-hold') THEN 1 ELSE 0 END) = 1
                THEN 'Yes'
            ELSE 'No'
        END AS amendment_in_progress,
        sum(CASE WHEN status_id = 'Approved' THEN 1 ELSE 0 END) AS approved_amendment_applications
    FROM
        demos_app.amendment
    GROUP BY
        demonstration_id
),

role_assignments AS (
    SELECT
        p.first_name || ' ' || p.last_name AS full_name,
        dra.demonstration_id,
        dra.role_id,
        prda.person_id IS NOT NULL AS is_primary
    FROM
        demos_app.demonstration_role_assignment AS dra
    LEFT JOIN
        demos_app.primary_demonstration_role_assignment AS prda
        ON
            dra.person_id = prda.person_id
            AND dra.demonstration_id = prda.demonstration_id
            AND dra.role_id = prda.role_id
    INNER JOIN
        demos_app.person AS p
        ON
            dra.person_id = p.id
),

flattened_role_assignments AS (
    SELECT
        demonstration_id,
        role_id,
        string_agg(full_name, ', ' ORDER BY full_name) AS people_assigned
    FROM
        role_assignments
    WHERE
        NOT is_primary
    GROUP BY
        demonstration_id,
        role_id
)

SELECT
    demo.state_id AS state_territory,
    demo.name AS demonstration_title,
    demo.medicaid_id AS demonstration_number,
    CASE WHEN demo_type.demonstration_id IS NOT NULL THEN demo.chip_id ELSE '-' END AS chip_id,
    demo.status_id AS status,
    to_char(demo.status_updated_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS status_update_date,
    coalesce(demo.sdg_division_id, '-') AS sdg_division,
    coalesce(demo.signature_level_id, '-') AS signature_level,
    to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS effective_date,
    to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS expiration_date,
    coalesce(active_extensions.extension_in_progress, 'No') AS extension_in_progress,
    coalesce(active_approved_amendments.amendment_in_progress, 'No') AS amendment_in_progress,
    coalesce(active_approved_amendments.approved_amendment_applications::INT, 0) AS approved_amendment_applications,
    primary_project_officer.full_name AS primary_project_officer,
    coalesce(project_officers.people_assigned, '-') AS project_officers,
    coalesce(primary_policy_tech_director.full_name, '-') AS primary_policy_tech_director,
    coalesce(primary_ddme_analyst.full_name, '-') AS primary_ddme_analyst,
    coalesce(ddme_analysts.people_assigned, '-') AS ddme_analysts,
    coalesce(primary_state_poc.full_name, '-') AS primary_state_poc,
    coalesce(state_pocs.people_assigned, '-') AS state_pocs,
    coalesce(primary_monitoring_evaluation_tech_director.full_name, '-') AS primary_monitoring_evaluation_tech_director,
    coalesce(to_char(app_date.date_value AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS application_approval_date
FROM
    demos_app.demonstration AS demo

-- This identifies when the parent demo has CHIP
LEFT JOIN
    demos_app.demonstration_type_tag_assignment AS demo_type
    ON
        demo.id = demo_type.demonstration_id
        AND demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)'

-- Not all demonstrations have extensions in progress
LEFT JOIN
    active_extensions
    ON
        demo.id = active_extensions.demonstration_id

-- Not all demonstrations have amendments
LEFT JOIN
    active_approved_amendments
    ON
        demo.id = active_approved_amendments.demonstration_id

-- All demonstrations guaranteed to have one and only one project officer
INNER JOIN
    role_assignments AS primary_project_officer
    ON
        demo.id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'
        AND primary_project_officer.is_primary

-- Not all demonstrations have additional project officers
LEFT JOIN
    flattened_role_assignments AS project_officers
    ON
        demo.id = project_officers.demonstration_id
        AND project_officers.role_id = 'Project Officer'

-- Not all demonstrations have a primary policy technical director
LEFT JOIN
    role_assignments AS primary_policy_tech_director
    ON
        demo.id = primary_policy_tech_director.demonstration_id
        AND primary_policy_tech_director.role_id = 'Policy Technical Director'
        AND primary_policy_tech_director.is_primary

-- Not all demonstrations have a primary DDME Analyst
-- However, only ever one primary at a time
LEFT JOIN
    role_assignments AS primary_ddme_analyst
    ON
        demo.id = primary_ddme_analyst.demonstration_id
        AND primary_ddme_analyst.role_id = 'DDME Analyst'
        AND primary_ddme_analyst.is_primary

-- Not all demonstrations have additional DDME analysts
LEFT JOIN
    flattened_role_assignments AS ddme_analysts
    ON
        demo.id = ddme_analysts.demonstration_id
        AND ddme_analysts.role_id = 'DDME Analyst'

-- Not all demonstrations have a state point of contact
-- However, only ever one primary at a time
LEFT JOIN
    role_assignments AS primary_state_poc
    ON
        demo.id = primary_state_poc.demonstration_id
        AND primary_state_poc.role_id = 'State Point of Contact'
        AND primary_state_poc.is_primary

-- Not all demonstrations have additional state points of contact
LEFT JOIN
    flattened_role_assignments AS state_pocs
    ON
        demo.id = state_pocs.demonstration_id
        AND state_pocs.role_id = 'State Point of Contact'

-- Not all demonstrations have a monitoring and evaluation director
-- However, only ever one primary at a time
LEFT JOIN
    role_assignments AS primary_monitoring_evaluation_tech_director
    ON
        demo.id = primary_monitoring_evaluation_tech_director.demonstration_id
        AND primary_monitoring_evaluation_tech_director.role_id = 'Monitoring & Evaluation Technical Director'
        AND primary_monitoring_evaluation_tech_director.is_primary

-- Not all demonstrations have an approval date
-- Note every application / date_type pair exists once, making cardinality fine
LEFT JOIN
    demos_app.application_date AS app_date
    ON
        demo.id = app_date.application_id
        AND app_date.date_type_id = 'Application Approval Date';
`;

export const demonstrationOverviewReportQueries = [dataFetchQuery];
