SELECT
    *,

    -- All date columns - set to NULL if validation fails
    concept_start_date AS cleaned_concept_start_date,

    CASE
        WHEN
            concept_completion_date_missing_required_dates
            OR concept_completion_date_before_concept_start_date
            THEN NULL
        ELSE concept_completion_date
    END AS cleaned_concept_completion_date,
    CASE
        WHEN concept_skipped_date_missing_concept_start_date OR concept_skipped_date_before_concept_start_date
            THEN NULL
        ELSE concept_skipped_date
    END AS cleaned_concept_skipped_date,
    application_intake_start_date AS cleaned_application_intake_start_date,
    CASE
        WHEN
            state_application_submitted_date_missing_completeness_review_due_date
            OR state_application_submitted_date_not_15_days_before_completeness_review_due
            THEN NULL
        ELSE state_application_submitted_date
    END AS cleaned_state_application_submitted_date,
    CASE
        WHEN
            state_application_submitted_date_missing_completeness_review_due_date
            OR state_application_submitted_date_not_15_days_before_completeness_review_due
            THEN NULL
        ELSE completeness_review_due_date
    END AS cleaned_completeness_review_due_date,
    CASE
        WHEN
            application_intake_completion_date_missing_required_dates
            OR application_intake_completion_date_before_application_intake_start_date
            THEN NULL
        ELSE application_intake_completion_date
    END AS cleaned_application_intake_completion_date,

    completeness_start_date AS cleaned_completeness_start_date,
    CASE
        WHEN
            state_application_deemed_complete_missing_state_application_submitted_date
            OR state_application_deemed_complete_before_state_application_submitted
            OR state_application_deemed_complete_missing_federal_comment_period_start_date
            OR state_application_deemed_complete_not_1_day_before_federal_comment_period_start
            OR federal_comment_period_start_date_missing_federal_comment_period_end_date
            OR state_application_deemed_complete_has_invalid_submitted_date
            OR federal_comment_period_start_date_not_30_days_before_federal_comment_period_end
            THEN NULL
        ELSE state_application_deemed_complete
    END AS cleaned_state_application_deemed_complete,
    CASE
        WHEN
            state_application_deemed_complete_missing_state_application_submitted_date
            OR state_application_deemed_complete_before_state_application_submitted
            OR state_application_deemed_complete_missing_federal_comment_period_start_date
            OR state_application_deemed_complete_not_1_day_before_federal_comment_period_start
            OR federal_comment_period_start_date_missing_federal_comment_period_end_date
            OR state_application_deemed_complete_has_invalid_submitted_date
            OR federal_comment_period_start_date_not_30_days_before_federal_comment_period_end
            THEN NULL
        ELSE federal_comment_period_start_date
    END AS cleaned_federal_comment_period_start_date,
    CASE
        WHEN
            state_application_deemed_complete_missing_state_application_submitted_date
            OR state_application_deemed_complete_before_state_application_submitted
            OR state_application_deemed_complete_missing_federal_comment_period_start_date
            OR state_application_deemed_complete_not_1_day_before_federal_comment_period_start
            OR federal_comment_period_start_date_missing_federal_comment_period_end_date
            OR state_application_deemed_complete_has_invalid_submitted_date
            OR federal_comment_period_start_date_not_30_days_before_federal_comment_period_end
            THEN NULL
        ELSE federal_comment_period_end_date
    END AS cleaned_federal_comment_period_end_date,
    CASE
        WHEN
            completeness_completion_date_missing_required_dates
            OR completeness_completion_date_before_completeness_start_date
            THEN NULL
        ELSE completeness_completion_date
    END AS cleaned_completeness_completion_date,

    sdg_preparation_start_date AS cleaned_sdg_preparation_start_date,
    expected_approval_date AS cleaned_expected_approval_date,
    sme_initial_review_date AS cleaned_sme_initial_review_date,
    frt_initial_meeting_date AS cleaned_frt_initial_meeting_date,
    NULL::TIMESTAMPTZ AS cleaned_sdg_preparation_completion_date,

    review_start_date AS cleaned_review_start_date,
    receive_ogc_legal_clearance AS cleaned_receive_ogc_legal_clearance,
    receive_omb_concurrence AS cleaned_receive_omb_concurrence,
    submit_approval_package_to_osora AS cleaned_submit_approval_package_to_osora,
    cms_osora_clearance_end AS cleaned_cms_osora_clearance_end,
    package_sent_for_comms_clearance AS cleaned_package_sent_for_comms_clearance,
    comms_clearance_received AS cleaned_comms_clearance_received,
    NULL::TIMESTAMPTZ AS cleaned_review_completion_date,

    approval_package_start_date AS cleaned_approval_package_start_date,
    CASE
        WHEN
            approval_package_completion_date_missing_approval_package_start_date
            OR approval_package_completion_date_before_approval_package_start_date
            THEN NULL
        ELSE approval_package_completion_date
    END AS cleaned_approval_package_completion_date

FROM
    {{ ref('apps_in_prog_dates_with_checks') }}
