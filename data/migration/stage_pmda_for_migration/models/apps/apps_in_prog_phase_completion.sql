WITH phase_statuses AS (
    SELECT
        mdcd_demo_aplctn_id,
        application_intake_start_date,
        CASE
            WHEN cleaned_concept_completion_date IS NOT NULL
                THEN 'Completed'
            WHEN cleaned_concept_skipped_date IS NOT NULL
                THEN 'Skipped'
            ELSE 'Started'
        END AS concept_phase_status,
        CASE
            WHEN cleaned_application_intake_completion_date IS NOT NULL
                THEN 'Completed'
            WHEN cleaned_application_intake_start_date IS NOT NULL
                THEN 'Started'
            ELSE 'Not Started'
        END AS application_intake_phase_status,
        CASE
            WHEN cleaned_completeness_completion_date IS NOT NULL
                THEN 'Completed'
            WHEN cleaned_completeness_start_date IS NOT NULL
                THEN 'Started'
            ELSE 'Not Started'
        END AS completeness_phase_status,
        -- rely on stored proc to update fed comment period accordingly
        'Not Started' AS federal_comment_period_phase_status,
        CASE
            WHEN cleaned_sdg_preparation_start_date IS NOT NULL
                THEN 'Started'
            ELSE 'Not Started'
        END AS sdg_preparation_status,
        CASE
            WHEN cleaned_review_start_date IS NOT NULL
                THEN 'Started'
            ELSE 'Not Started'
        END AS review_phase_status,
        CASE
            WHEN cleaned_approval_package_start_date IS NOT NULL
                THEN 'Started'
            ELSE 'Not Started'
        END AS approval_package_phase_status,
        'Not Started' AS approval_summary_phase_status
    FROM {{ ref('apps_in_prog_dates_with_checks_cleaned') }}
)

SELECT
    *,
    CASE
        WHEN
            concept_phase_status <> 'Completed'
            AND concept_phase_status <> 'Skipped'
            AND application_intake_start_date IS NULL
            THEN 'Concept'
        WHEN application_intake_phase_status <> 'Completed' THEN 'Application Intake'
        WHEN completeness_phase_status <> 'Completed' THEN 'Completeness'
        WHEN federal_comment_period_phase_status <> 'Completed' THEN 'Federal Comment'
        ELSE 'SDG Preparation'
    END AS current_phase_id
FROM phase_statuses
