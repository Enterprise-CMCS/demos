-- This test validates that phase statuses are consistent with their dates.
-- If any rows are returned, the test fails.
-- Rules:
-- - If phase status is 'Started', phase must have a start date
-- - If phase status is 'Completed', phase must have both start and completion dates
-- - If previous phase is 'Completed', next phase must be 'Started' (except Completeness → Federal Comment Period)
-- - If dates exist for a phase, the phase must have a start date and be 'Started' (inverse check)

WITH phase_data AS (
    SELECT
        pc.mdcd_demo_aplctn_id,
        pc.concept_phase_status,
        pc.application_intake_phase_status,
        pc.completeness_phase_status,
        pc.federal_comment_period_phase_status,
        pc.sdg_preparation_status,
        pc.review_phase_status,
        pc.approval_package_phase_status,
        dates.cleaned_concept_start_date,
        dates.cleaned_concept_completion_date,
        dates.cleaned_concept_skipped_date,
        dates.cleaned_application_intake_start_date,
        dates.cleaned_state_application_submitted_date,
        dates.cleaned_completeness_review_due_date,
        dates.cleaned_application_intake_completion_date,
        dates.cleaned_completeness_start_date,
        dates.cleaned_state_application_deemed_complete,
        dates.cleaned_completeness_completion_date,
        dates.cleaned_federal_comment_period_start_date,
        dates.cleaned_federal_comment_period_end_date,
        dates.cleaned_sdg_preparation_start_date,
        dates.cleaned_sdg_preparation_completion_date,
        dates.cleaned_expected_approval_date,
        dates.cleaned_sme_initial_review_date,
        dates.cleaned_frt_initial_meeting_date,
        dates.cleaned_review_start_date,
        dates.cleaned_review_completion_date,
        dates.cleaned_receive_ogc_legal_clearance,
        dates.cleaned_receive_omb_concurrence,
        dates.cleaned_submit_approval_package_to_osora,
        dates.cleaned_cms_osora_clearance_end,
        dates.cleaned_package_sent_for_comms_clearance,
        dates.cleaned_comms_clearance_received,
        dates.cleaned_approval_package_start_date,
        dates.cleaned_approval_package_completion_date
    FROM {{ ref('apps_in_prog_phase_completion') }} AS pc
    INNER JOIN {{ ref('apps_in_prog_dates_with_checks_cleaned') }} AS dates
        ON
            pc.mdcd_demo_aplctn_id = dates.mdcd_demo_aplctn_id
)

-- Concept Phase
SELECT
    mdcd_demo_aplctn_id,
    'Concept' AS phase,
    concept_phase_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    concept_phase_status = 'Started'
    AND cleaned_concept_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Concept' AS phase,
    concept_phase_status AS status,
    'Completed status without start date' AS violation
FROM phase_data
WHERE
    concept_phase_status = 'Completed'
    AND cleaned_concept_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Concept' AS phase,
    concept_phase_status AS status,
    'Completed status without completion date' AS violation
FROM phase_data
WHERE
    concept_phase_status = 'Completed'
    AND cleaned_concept_completion_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Concept' AS phase,
    concept_phase_status AS status,
    'Skipped status without start date' AS violation
FROM phase_data
WHERE
    concept_phase_status = 'Skipped'
    AND cleaned_concept_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Concept' AS phase,
    concept_phase_status AS status,
    'Skipped status without skipped date' AS violation
FROM phase_data
WHERE
    concept_phase_status = 'Skipped'
    AND cleaned_concept_skipped_date IS NULL

UNION ALL

-- Application Intake Phase
SELECT
    mdcd_demo_aplctn_id,
    'Application Intake' AS phase,
    application_intake_phase_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    application_intake_phase_status = 'Started'
    AND cleaned_application_intake_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Application Intake' AS phase,
    application_intake_phase_status AS status,
    'Completed status without start date' AS violation
FROM phase_data
WHERE
    application_intake_phase_status = 'Completed'
    AND cleaned_application_intake_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Application Intake' AS phase,
    application_intake_phase_status AS status,
    'Completed status without completion date' AS violation
FROM phase_data
WHERE
    application_intake_phase_status = 'Completed'
    AND cleaned_application_intake_completion_date IS NULL

UNION ALL

-- Completeness Phase
SELECT
    mdcd_demo_aplctn_id,
    'Completeness' AS phase,
    completeness_phase_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    completeness_phase_status = 'Started'
    AND cleaned_completeness_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Completeness' AS phase,
    completeness_phase_status AS status,
    'Completed status without start date' AS violation
FROM phase_data
WHERE
    completeness_phase_status = 'Completed'
    AND cleaned_completeness_start_date IS NULL

UNION ALL

SELECT
    mdcd_demo_aplctn_id,
    'Completeness' AS phase,
    completeness_phase_status AS status,
    'Completed status without completion date' AS violation
FROM phase_data
WHERE
    completeness_phase_status = 'Completed'
    AND cleaned_completeness_completion_date IS NULL

UNION ALL

-- SDG Preparation Phase
SELECT
    mdcd_demo_aplctn_id,
    'SDG Preparation' AS phase,
    sdg_preparation_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    sdg_preparation_status = 'Started'
    AND cleaned_sdg_preparation_start_date IS NULL

UNION ALL

-- Review Phase
SELECT
    mdcd_demo_aplctn_id,
    'Review' AS phase,
    review_phase_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    review_phase_status = 'Started'
    AND cleaned_review_start_date IS NULL

UNION ALL

-- Approval Package Phase
SELECT
    mdcd_demo_aplctn_id,
    'Approval Package' AS phase,
    approval_package_phase_status AS status,
    'Started status without start date' AS violation
FROM phase_data
WHERE
    approval_package_phase_status = 'Started'
    AND cleaned_approval_package_start_date IS NULL

UNION ALL

-- Phase cascading validations: if previous phase is completed, next phase must be started
-- Concept Completed/Skipped → Application Intake must be Started
SELECT
    mdcd_demo_aplctn_id,
    'Application Intake' AS phase,
    application_intake_phase_status AS status,
    'Not Started when Concept is Completed/Skipped' AS violation
FROM phase_data
WHERE
    (concept_phase_status = 'Completed' OR concept_phase_status = 'Skipped')
    AND application_intake_phase_status = 'Not Started'

UNION ALL

-- Application Intake Completed → Completeness must be Started
SELECT
    mdcd_demo_aplctn_id,
    'Completeness' AS phase,
    completeness_phase_status AS status,
    'Not Started when Application Intake is Completed' AS violation
FROM phase_data
WHERE
    application_intake_phase_status = 'Completed'
    AND completeness_phase_status = 'Not Started'

UNION ALL

-- Federal Comment Period Completed → SDG Preparation must be Started
SELECT
    mdcd_demo_aplctn_id,
    'SDG Preparation' AS phase,
    sdg_preparation_status AS status,
    'Not Started when Federal Comment Period is Completed' AS violation
FROM phase_data
WHERE
    federal_comment_period_phase_status = 'Completed'
    AND sdg_preparation_status = 'Not Started'

UNION ALL

-- Inverse checks: if dates exist, phase must be Started
-- Application Intake dates exist without phase being Started
SELECT
    mdcd_demo_aplctn_id,
    'Application Intake' AS phase,
    application_intake_phase_status AS status,
    'Application Intake dates exist but phase is Not Started' AS violation
FROM phase_data
WHERE
    application_intake_phase_status = 'Not Started'
    AND (
        cleaned_state_application_submitted_date IS NOT NULL
        OR cleaned_completeness_review_due_date IS NOT NULL
    )

UNION ALL

-- Completeness dates exist without phase being Started
SELECT
    mdcd_demo_aplctn_id,
    'Completeness' AS phase,
    completeness_phase_status AS status,
    'Completeness dates exist but phase is Not Started' AS violation
FROM phase_data
WHERE
    completeness_phase_status = 'Not Started'
    AND (
        cleaned_state_application_deemed_complete IS NOT NULL
        OR cleaned_federal_comment_period_start_date IS NOT NULL
        OR cleaned_federal_comment_period_end_date IS NOT NULL
    )

UNION ALL

-- SDG Preparation dates exist without phase being Started
SELECT
    mdcd_demo_aplctn_id,
    'SDG Preparation' AS phase,
    sdg_preparation_status AS status,
    'SDG Preparation dates exist but phase is Not Started' AS violation
FROM phase_data
WHERE
    sdg_preparation_status = 'Not Started'
    AND (
        cleaned_expected_approval_date IS NOT NULL
        OR cleaned_sme_initial_review_date IS NOT NULL
        OR cleaned_frt_initial_meeting_date IS NOT NULL
    )

UNION ALL

-- Review dates exist without phase being Started
SELECT
    mdcd_demo_aplctn_id,
    'Review' AS phase,
    review_phase_status AS status,
    'Review dates exist but phase is Not Started' AS violation
FROM phase_data
WHERE
    review_phase_status = 'Not Started'
    AND (
        cleaned_receive_ogc_legal_clearance IS NOT NULL
        OR cleaned_receive_omb_concurrence IS NOT NULL
        OR cleaned_submit_approval_package_to_osora IS NOT NULL
        OR cleaned_cms_osora_clearance_end IS NOT NULL
        OR cleaned_package_sent_for_comms_clearance IS NOT NULL
        OR cleaned_comms_clearance_received IS NOT NULL
    )
