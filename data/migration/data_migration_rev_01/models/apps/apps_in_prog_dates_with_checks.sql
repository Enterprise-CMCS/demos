WITH primary_validations AS (
    SELECT
        mdcd_demo_aplctn_id,

        -- All date columns from crosswalked
        concept_start_date,
        concept_completion_date,
        concept_skipped_date,
        application_intake_start_date,
        state_application_submitted_date,
        completeness_review_due_date,
        application_intake_completion_date,
        completeness_start_date,
        state_application_deemed_complete,
        federal_comment_period_start_date,
        federal_comment_period_end_date,
        completeness_completion_date,
        sdg_preparation_start_date,
        sdg_preparation_completion_date,
        expected_approval_date,
        sme_initial_review_date,
        frt_initial_meeting_date,
        review_start_date,
        receive_ogc_legal_clearance,
        receive_omb_concurrence,
        submit_approval_package_to_osora,
        cms_osora_clearance_end,
        package_sent_for_comms_clearance,
        comms_clearance_received,
        review_completion_date,
        approval_package_start_date,
        approval_package_completion_date,

        -- Validation columns (boolean - TRUE if validation failed)

        -- Concept Skipped Date validations
        (concept_skipped_date IS NOT NULL AND concept_start_date IS NULL)
            AS concept_skipped_date_missing_concept_start_date,
        (concept_skipped_date IS NOT NULL AND concept_skipped_date < concept_start_date)
            AS concept_skipped_date_before_concept_start_date,

        -- Application Intake Completion Date validations
        (
            application_intake_completion_date IS NOT NULL
            AND application_intake_completion_date < application_intake_start_date
        ) AS application_intake_completion_date_before_application_intake_start_date,
        (
            application_intake_completion_date IS NOT NULL
            AND application_intake_completion_date < state_application_submitted_date
        ) AS application_intake_completion_date_before_state_application_submitted,

        -- Completeness Completion Date validations
        (completeness_completion_date IS NOT NULL AND completeness_completion_date < completeness_start_date)
            AS completeness_completion_date_before_completeness_start_date,

        -- Approval Package Completion Date validations
        (approval_package_completion_date IS NOT NULL AND approval_package_start_date IS NULL)
            AS approval_package_completion_date_missing_approval_package_start_date,
        (
            approval_package_completion_date IS NOT NULL
            AND approval_package_completion_date < approval_package_start_date
        )
            AS approval_package_completion_date_before_approval_package_start_date,

        -- State Application Submitted Date and Completeness Review Due Date validations
        (state_application_submitted_date IS NOT NULL AND completeness_review_due_date IS NULL)
            AS state_application_submitted_date_missing_completeness_review_due_date,
        (
            state_application_submitted_date IS NOT NULL
            AND state_application_submitted_date::DATE != (completeness_review_due_date - INTERVAL '15 days')::DATE
        ) AS state_application_submitted_date_not_15_days_before_completeness_review_due,

        -- State Application Deemed Complete validations
        (state_application_deemed_complete IS NOT NULL AND state_application_submitted_date IS NULL)
            AS state_application_deemed_complete_missing_state_application_submitted_date,
        (
            state_application_deemed_complete IS NOT NULL
            AND state_application_deemed_complete < state_application_submitted_date
        ) AS state_application_deemed_complete_before_state_application_submitted,
        (state_application_deemed_complete IS NOT NULL AND federal_comment_period_start_date IS NULL)
            AS state_application_deemed_complete_missing_federal_comment_period_start_date,
        (
            state_application_deemed_complete IS NOT NULL
            AND state_application_deemed_complete::DATE != (federal_comment_period_start_date - INTERVAL '1 day')::DATE
        ) AS state_application_deemed_complete_not_1_day_before_federal_comment_period_start,

        -- Federal Comment Period Start Date validations

        (federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NULL)
            AS federal_comment_period_start_date_missing_federal_comment_period_end_date,
        (
            federal_comment_period_start_date IS NOT NULL
            AND federal_comment_period_start_date::DATE != (federal_comment_period_end_date - INTERVAL '30 days')::DATE
        ) AS federal_comment_period_start_date_not_30_days_before_federal_comment_period_end

    FROM
        {{ ref('apps_in_prog_dates_crosswalked') }}
)


SELECT
    *,
    -- Concept Completion Date: check required dates exist
    (
        concept_completion_date IS NOT NULL
        AND concept_start_date IS NULL
    ) AS concept_completion_date_missing_required_dates,

    (
        concept_completion_date IS NOT NULL
        AND concept_completion_date < concept_start_date
    ) AS concept_completion_date_before_concept_start_date,

    -- Application Intake Completion Date: check required dates exist and are valid
    (
        application_intake_completion_date IS NOT NULL
        AND (
            state_application_submitted_date IS NULL
            OR completeness_review_due_date IS NULL
            OR application_intake_start_date IS NULL
            OR state_application_submitted_date_missing_completeness_review_due_date
            OR state_application_submitted_date_not_15_days_before_completeness_review_due
        )
    ) AS application_intake_completion_date_missing_required_dates,

    -- State Application Deemed Complete: check if state_application_submitted_date is valid
    (
        state_application_deemed_complete IS NOT NULL
        AND (
            state_application_submitted_date_missing_completeness_review_due_date
            OR state_application_submitted_date_not_15_days_before_completeness_review_due
        )
    ) AS state_application_deemed_complete_has_invalid_submitted_date,

    -- Completeness Completion Date: check required dates exist and are valid
    (
        completeness_completion_date IS NOT NULL
        AND (
            completeness_start_date IS NULL
            OR state_application_deemed_complete IS NULL
            OR federal_comment_period_start_date IS NULL
            OR federal_comment_period_end_date IS NULL
            OR state_application_deemed_complete_missing_state_application_submitted_date
            OR state_application_deemed_complete_before_state_application_submitted
            OR state_application_deemed_complete_missing_federal_comment_period_start_date
            OR state_application_deemed_complete_not_1_day_before_federal_comment_period_start
            OR state_application_submitted_date_missing_completeness_review_due_date
            OR state_application_submitted_date_not_15_days_before_completeness_review_due
            OR federal_comment_period_start_date_missing_federal_comment_period_end_date
            OR federal_comment_period_start_date_not_30_days_before_federal_comment_period_end
        )
    ) AS completeness_completion_date_missing_required_dates

FROM primary_validations
