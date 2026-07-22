-- Determine status for each phase (one row per application with status columns)
-- Statuses: not-started, skipped, started, completed
-- Only Concept phase can be skipped

WITH cleaned_wide AS (
    SELECT
        id,
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
    FROM {{ ref('apps_in_prog_dates_cleaned') }}
    GROUP BY id, mdcd_demo_aplctn_id
)

SELECT
    id,
    mdcd_demo_aplctn_id,

    -- Concept Phase Status (always at least 'Started')
    CASE
        WHEN concept_skipped_date IS NOT NULL THEN 'Skipped'
        WHEN concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL THEN 'Completed'
        ELSE 'Started'
    END AS concept_phase_status,

    -- Application Intake Phase Status (complete only if concept is also complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL
            AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL
            AND application_intake_completion_date IS NOT NULL THEN 'Completed'
        WHEN application_intake_start_date IS NOT NULL THEN 'Started'
        WHEN
            concept_skipped_date IS NOT NULL OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            THEN 'Started'
        ELSE 'Not Started'
    END AS application_intake_phase_status,

    -- Completeness Phase Status (complete only if all previous phases complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL THEN 'Completed'
        WHEN completeness_start_date IS NOT NULL THEN 'Started'
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            THEN 'Started'
        ELSE 'Not Started'
    END AS completeness_phase_status,

    -- SDG Preparation Phase Status (complete only if all previous phases complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL THEN 'Completed'
        WHEN sdg_preparation_start_date IS NOT NULL THEN 'Started'
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS sdg_preparation_phase_status,

    -- Review Phase Status (complete only if all previous phases complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND review_completion_date IS NOT NULL THEN 'Completed'
        WHEN review_start_date IS NOT NULL THEN 'Started'
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS review_phase_status,

    -- Approval Package Phase Status (complete only if all previous phases complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND review_completion_date IS NOT NULL
            AND approval_package_start_date IS NOT NULL AND approval_package_completion_date IS NOT NULL
            THEN 'Completed'
        WHEN approval_package_start_date IS NOT NULL THEN 'Started'
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND review_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS approval_package_phase_status,

    -- Approval Summary Phase Status (started only if approval package complete)
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND review_completion_date IS NOT NULL
            AND approval_package_start_date IS NOT NULL AND approval_package_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS approval_summary_phase_status,

    -- Current Phase (first phase that isn't completed)
    CASE
        WHEN
            concept_skipped_date IS NULL AND (concept_start_date IS NULL OR concept_completion_date IS NULL)
            THEN 'Concept'
        WHEN
            application_intake_start_date IS NULL OR state_application_submitted_date IS NULL
            OR completeness_review_due_date IS NULL OR application_intake_completion_date IS NULL
            THEN 'Application Intake'
        WHEN
            completeness_start_date IS NULL OR state_application_deemed_complete IS NULL
            OR federal_comment_period_start_date IS NULL OR federal_comment_period_end_date IS NULL
            OR completeness_completion_date IS NULL THEN 'Completeness'
        WHEN
            sdg_preparation_start_date IS NULL OR expected_approval_date IS NULL
            OR sme_initial_review_date IS NULL OR frt_initial_meeting_date IS NULL
            OR sdg_preparation_completion_date IS NULL THEN 'SDG Preparation'
        WHEN
            review_start_date IS NULL OR receive_ogc_legal_clearance IS NULL
            OR receive_omb_concurrence IS NULL OR review_completion_date IS NULL THEN 'Review'
        WHEN approval_package_start_date IS NULL OR approval_package_completion_date IS NULL THEN 'Approval Package'
        ELSE 'Approval Summary'
    END AS current_phase

FROM cleaned_wide
