WITH cleaned_wide AS (
    SELECT
        mdcd_demo_aplctn_id,
        max(CASE WHEN date_type = 'Concept Start Date' THEN date_value END) AS concept_start_date,
        max(CASE WHEN date_type = 'Concept Completion Date' THEN date_value END) AS concept_completion_date,
        max(CASE WHEN date_type = 'Concept Skipped Date' THEN date_value END) AS concept_skipped_date,
        max(CASE WHEN date_type = 'Application Intake Start Date' THEN date_value END) AS application_intake_start_date,
        max(CASE WHEN date_type = 'State Application Submitted Date' THEN date_value END)
            AS state_application_submitted_date,
        max(CASE WHEN date_type = 'Completeness Review Due Date' THEN date_value END) AS completeness_review_due_date,
        max(CASE WHEN date_type = 'Application Intake Completion Date' THEN date_value END)
            AS application_intake_completion_date,
        max(CASE WHEN date_type = 'Completeness Start Date' THEN date_value END) AS completeness_start_date,
        max(CASE WHEN date_type = 'State Application Deemed Complete' THEN date_value END)
            AS state_application_deemed_complete,
        max(CASE WHEN date_type = 'Federal Comment Period Start Date' THEN date_value END)
            AS federal_comment_period_start_date,
        max(CASE WHEN date_type = 'Federal Comment Period End Date' THEN date_value END)
            AS federal_comment_period_end_date,
        max(CASE WHEN date_type = 'Completeness Completion Date' THEN date_value END) AS completeness_completion_date,
        max(CASE WHEN date_type = 'SDG Preparation Start Date' THEN date_value END) AS sdg_preparation_start_date,
        max(CASE WHEN date_type = 'Expected Approval Date' THEN date_value END) AS expected_approval_date,
        max(CASE WHEN date_type = 'SME Initial Review Date' THEN date_value END) AS sme_initial_review_date,
        max(CASE WHEN date_type = 'FRT Initial Meeting Date' THEN date_value END) AS frt_initial_meeting_date,
        max(CASE WHEN date_type = 'SDG Preparation Completion Date' THEN date_value END)
            AS sdg_preparation_completion_date,
        max(CASE WHEN date_type = 'Review Start Date' THEN date_value END) AS review_start_date,
        max(CASE WHEN date_type = 'Receive OGC Legal Clearance' THEN date_value END) AS receive_ogc_legal_clearance,
        max(CASE WHEN date_type = 'Receive OMB Concurrence' THEN date_value END) AS receive_omb_concurrence,
        max(CASE WHEN date_type = 'Review Completion Date' THEN date_value END) AS review_completion_date,
        max(CASE WHEN date_type = 'Approval Package Start Date' THEN date_value END) AS approval_package_start_date,
        max(CASE WHEN date_type = 'Approval Package Completion Date' THEN date_value END)
            AS approval_package_completion_date
    FROM {{ ref('apps_in_prog_dates_validated') }}
    GROUP BY mdcd_demo_aplctn_id
),

phase_determination AS (
    SELECT
        *,

        -- Phase completion checks based on required dates from API
        coalesce(
            concept_start_date IS NOT NULL
            AND (concept_completion_date IS NOT NULL OR concept_skipped_date IS NOT NULL), FALSE
        ) AS concept_complete,

        coalesce(
            application_intake_start_date IS NOT NULL
            AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL
            AND application_intake_completion_date IS NOT NULL, FALSE
        ) AS application_intake_complete,

        coalesce(
            completeness_start_date IS NOT NULL
            AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL
            AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL, FALSE
        ) AS completeness_complete,

        coalesce(
            sdg_preparation_start_date IS NOT NULL
            AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL
            AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL, FALSE
        ) AS sdg_preparation_complete,

        coalesce(
            review_start_date IS NOT NULL
            AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL
            AND review_completion_date IS NOT NULL, FALSE
        ) AS review_complete,

        coalesce(
            approval_package_start_date IS NOT NULL
            AND approval_package_completion_date IS NOT NULL, FALSE
        ) AS approval_package_complete

    FROM cleaned_wide
)

SELECT
    mdcd_demo_aplctn_id,

    -- Determine current phase
    CASE
        WHEN NOT concept_complete THEN 'Concept'
        WHEN NOT application_intake_complete THEN 'Application Intake'
        WHEN NOT completeness_complete THEN 'Completeness'
        WHEN NOT sdg_preparation_complete THEN 'SDG Preparation'
        WHEN NOT review_complete THEN 'Review'
        WHEN NOT approval_package_complete THEN 'Approval Package'
        ELSE 'Approval Summary'
    END AS current_phase

FROM phase_determination
