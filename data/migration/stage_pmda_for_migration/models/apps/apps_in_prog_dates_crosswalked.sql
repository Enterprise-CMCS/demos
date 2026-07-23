SELECT
    apps.id,
    apps.mdcd_demo_aplctn_id,

    -- Concept Phase
    mdcd_demo_aplctn.phase_1_strt_dt AS concept_start_date,
    mdcd_demo_aplctn.phase_1_end_dt AS concept_completion_date,
    CASE
        WHEN mdcd_demo_aplctn.phase_1_end_dt IS NULL AND mdcd_demo_aplctn.phase_2_rcvd_dt IS NOT NULL
            THEN (mdcd_demo_aplctn.phase_2_rcvd_dt - INTERVAL '1 day')
    END AS concept_skipped_date,

    -- Application Intake Phase
    CASE
        WHEN mdcd_demo_aplctn.phase_2_rcvd_dt IS NOT NULL
            THEN (mdcd_demo_aplctn.phase_2_rcvd_dt - INTERVAL '1 day')
    END AS application_intake_start_date,
    mdcd_demo_aplctn.phase_2_rcvd_dt AS state_application_submitted_date,
    mdcd_demo_aplctn.phase_2_cmpltns_rvw_dt AS completeness_review_due_date,
    mdcd_demo_aplctn.phase_2_cmpltns_rvw_dt AS application_intake_completion_date,

    -- Completeness Phase
    CASE
        WHEN mdcd_demo_aplctn.phase_2_cmpltns_rvw_dt IS NOT NULL
            THEN (mdcd_demo_aplctn.phase_2_rcvd_dt + INTERVAL '15 day')
    END AS completeness_start_date,
    mdcd_demo_aplctn.phase_2_state_aplctn_deemd_cmpltn_dt AS state_application_deemed_complete,
    mdcd_demo_aplctn.phase_2_fed_cmt_prd_strt_dt AS federal_comment_period_start_date,
    mdcd_demo_aplctn.phase_2_fed_cmt_prd_end_dt AS federal_comment_period_end_date,
    CASE
        WHEN mdcd_demo_aplctn.phase_2_fed_cmt_prd_strt_dt IS NOT NULL
            THEN (mdcd_demo_aplctn.phase_2_fed_cmt_prd_strt_dt - INTERVAL '1 day')
    END AS completeness_completion_date,

    -- SDG Preparation Phase
    CASE
        WHEN mdcd_demo_aplctn.phase_2_fed_cmt_prd_end_dt IS NOT NULL
            THEN (mdcd_demo_aplctn.phase_2_fed_cmt_prd_end_dt + INTERVAL '1 day')
    END AS sdg_preparation_start_date,
    mdcd_demo_aplctn.phase_2_dsrd_aprvl_dt AS expected_approval_date,
    mdcd_demo_aplctn.phase_3_a_sme_strt_dt AS sme_initial_review_date,
    mdcd_demo_aplctn.phase_3_a_frvt_strt_dt AS frt_initial_meeting_date,
    greatest(mdcd_demo_aplctn.phase_3_a_sme_strt_dt, mdcd_demo_aplctn.phase_3_a_frvt_strt_dt)
        AS sdg_preparation_completion_date,

    -- Review Phase (OGC & OMB)
    least(
        mdcd_demo_aplctn.phase_3_c_ogc_strt_dt,
        mdcd_demo_aplctn.phase_3_c_omb_strt_dt,
        mdcd_demo_aplctn.phase_5_strt_dt
    ) AS review_start_date,
    mdcd_demo_aplctn.phase_3_c_ogc_strt_dt AS receive_ogc_legal_clearance,
    mdcd_demo_aplctn.phase_3_c_omb_strt_dt AS receive_omb_concurrence,
    mdcd_demo_aplctn.phase_5_strt_dt AS submit_approval_package_to_osora,
    mdcd_demo_aplctn.phase_5_end_dt AS cms_osora_clearance_end,
    mdcd_demo_aplctn.phase_6_strt_dt AS package_sent_for_comms_clearance,
    mdcd_demo_aplctn.phase_6_end_dt AS comms_clearance_received,
    greatest(mdcd_demo_aplctn.phase_6_end_dt, mdcd_demo_aplctn.phase_5_end_dt) AS review_completion_date,

    -- Approval Package Phase
    mdcd_demo_aplctn.phase_4_strt_dt AS approval_package_start_date,
    mdcd_demo_aplctn.phase_4_end_dt AS approval_package_completion_date

FROM {{ ref('apps_active_in_progress_pmda_demos') }} AS apps
INNER JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS mdcd_demo_aplctn
    ON
        apps.mdcd_demo_aplctn_id = mdcd_demo_aplctn.mdcd_demo_aplctn_id
