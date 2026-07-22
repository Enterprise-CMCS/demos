SELECT
    id,
    mdcd_demo_aplctn_id,

    -- Concept Phase
    phase_1_strt_dt AS concept_start_date,
    phase_1_end_dt AS concept_completion_date,
    -- concept paper submitted date would go here
    CASE
        WHEN phase_1_end_dt IS NULL AND phase_2_rcvd_dt IS NOT NULL
            THEN (phase_2_rcvd_dt - INTERVAL '1 day')
    END AS concept_skipped_date,

    -- Application Intake Phase
    CASE
        WHEN phase_2_rcvd_dt IS NOT NULL
            THEN (phase_2_rcvd_dt - INTERVAL '1 day')
    END AS application_intake_start_date,
    phase_2_rcvd_dt AS state_application_submitted_date,
    phase_2_cmpltns_rvw_dt AS completeness_review_due_date,
    phase_2_cmpltns_rvw_dt AS application_intake_completion_date,

    -- Completeness Phase
    CASE
        WHEN phase_2_cmpltns_rvw_dt IS NOT NULL
            THEN (phase_2_rcvd_dt + INTERVAL '15 day')
    END AS completeness_start_date,
    phase_2_state_aplctn_deemd_cmpltn_dt AS state_application_deemed_complete,
    phase_2_fed_cmt_prd_strt_dt AS federal_comment_period_start_date,
    phase_2_fed_cmt_prd_end_dt AS federal_comment_period_end_date,
    CASE
        WHEN phase_2_fed_cmt_prd_strt_dt IS NOT NULL
            THEN (phase_2_fed_cmt_prd_strt_dt - INTERVAL '1 day')
    END AS completeness_completion_date,

    -- SDG Preparation Phase
    CASE
        WHEN phase_2_fed_cmt_prd_end_dt IS NOT NULL
            THEN (phase_2_fed_cmt_prd_end_dt + INTERVAL '1 day')
    END AS sdg_preparation_start_date,
    phase_2_dsrd_aprvl_dt AS expected_approval_date,
    phase_3_a_sme_strt_dt AS sme_initial_review_date,
    phase_3_a_frvt_strt_dt AS frt_initial_meeting_date,
    -- TODO: VERIFY BNPMT: LEAST(phase_3_a_sme_strt_dt, phase_3_a_frvt_strt_dt) AS bnpmt_initial_meeting_date,
    greatest(phase_3_a_sme_strt_dt, phase_3_a_frvt_strt_dt) AS sdg_preparation_completion_date,

    -- Review Phase (OGC & OMB)
    -- Derive review start date as earliest review-related date
    least(
        phase_3_c_ogc_strt_dt,
        phase_3_c_omb_strt_dt,
        phase_5_strt_dt
    ) AS review_start_date,
    phase_3_c_ogc_strt_dt AS receive_ogc_legal_clearance,
    phase_3_c_omb_strt_dt AS receive_omb_concurrence,
    phase_5_strt_dt AS submit_approval_package_to_osora,
    -- TODO: CONFIRM OSORA DUE DATES: phase_5_end_dt AS osora_r1_comments_due,
    -- TODO: CONFIRM OSORA DUE DATES: phase_5_end_dt AS osora_r2_comments_due,
    phase_5_end_dt AS cms_osora_clearance_end,
    phase_6_strt_dt AS package_sent_for_comms_clearance,
    phase_6_end_dt AS comms_clearance_received,
    greatest(phase_6_end_dt, phase_5_end_dt) AS review_completion_date,

    -- Approval Package Phase
    phase_4_strt_dt AS approval_package_start_date,
    phase_4_end_dt AS approval_package_completion_date

    -- Approval Summary Phase
    -- TODO: CAN PROBABLY ASSUME SUMMARY NOT COMPLETE FOR NOW
    /*
    CASE WHEN phase_4_end_dt IS NOT NULL
        THEN (phase_4_end_dt + INTERVAL '1 day')
    END AS approval_summary_start_date
    */

FROM {{ ref('apps_in_prog_dates_wide_normalized') }}
