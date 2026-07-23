-- Apply timezone conversion and start-of-day/end-of-day timestamps based on DEMOS date type semantics
-- (see DATE_TYPES_WITH_EXPECTED_TIMESTAMPS in constants.ts)

SELECT
    id,
    mdcd_demo_aplctn_id,

    -- Concept Phase - all Start of Day
    (concept_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS concept_start_date,
    (concept_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS concept_completion_date,
    (concept_skipped_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS concept_skipped_date,

    -- Application Intake Phase
    (application_intake_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS application_intake_start_date,
    (state_application_submitted_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS state_application_submitted_date,
    (completeness_review_due_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS completeness_review_due_date,  -- End of Day
    (application_intake_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS application_intake_completion_date,

    -- Completeness Phase
    (completeness_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS completeness_start_date,
    (state_application_deemed_complete + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS state_application_deemed_complete,
    (federal_comment_period_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS federal_comment_period_start_date,
    (federal_comment_period_end_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS federal_comment_period_end_date,  -- End of Day
    (completeness_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS completeness_completion_date,

    -- SDG Preparation Phase - all Start of Day
    (sdg_preparation_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS sdg_preparation_start_date,
    (expected_approval_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS expected_approval_date,
    (sme_initial_review_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS sme_initial_review_date,
    (frt_initial_meeting_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS frt_initial_meeting_date,
    (sdg_preparation_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS sdg_preparation_completion_date,

    -- Review Phase
    (review_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS review_start_date,
    (receive_ogc_legal_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS receive_ogc_legal_clearance,
    (receive_omb_concurrence + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS receive_omb_concurrence,
    (submit_approval_package_to_osora + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS submit_approval_package_to_osora,
    (cms_osora_clearance_end + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS cms_osora_clearance_end,  -- End of Day
    (package_sent_for_comms_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS package_sent_for_comms_clearance,
    (comms_clearance_received + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS comms_clearance_received,
    (review_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS review_completion_date,

    -- Approval Package Phase - all Start of Day
    (approval_package_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS approval_package_start_date,
    (approval_package_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS approval_package_completion_date

FROM {{ ref('apps_in_prog_dates_crosswalked') }}
