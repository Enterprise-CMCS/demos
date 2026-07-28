SELECT
    apps.mdcd_demo_aplctn_id,
    apps.mdcd_pendg_demo_id,

    -- Concept Phase - all Start of Day
    (coalesce(apps.phase_1_strt_dt, (apps.creatd_dt AT TIME ZONE 'America/New_York')::DATE) + TIME '00:00:00.000')
    AT TIME ZONE 'America/New_York' AS concept_start_date,
    NULL AS concept_paper_submitted_date,
    (apps.phase_1_end_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS concept_completion_date,
    (CASE
        WHEN apps.phase_1_end_dt IS NULL AND apps.phase_2_rcvd_dt IS NOT NULL
            THEN (apps.phase_2_rcvd_dt - INTERVAL '1 day')
    END + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS concept_skipped_date,

    -- Application Intake Phase
    (CASE
        WHEN apps.phase_2_rcvd_dt IS NOT NULL
            THEN (apps.phase_2_rcvd_dt - INTERVAL '1 day')
    END + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS application_intake_start_date,
    (apps.phase_2_rcvd_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS state_application_submitted_date,
    (apps.phase_2_cmpltns_rvw_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS completeness_review_due_date,  -- End of Day
    (apps.phase_2_cmpltns_rvw_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS application_intake_completion_date,

    -- Completeness Phase
    (CASE
        WHEN apps.phase_2_cmpltns_rvw_dt IS NOT NULL
            THEN (apps.phase_2_cmpltns_rvw_dt + INTERVAL '1 day')
    END + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS completeness_start_date,
    (apps.phase_2_state_aplctn_deemd_cmpltn_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS state_application_deemed_complete,
    (apps.phase_2_fed_cmt_prd_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS federal_comment_period_start_date,
    (apps.phase_2_fed_cmt_prd_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS federal_comment_period_end_date,  -- End of Day
    (CASE
        WHEN apps.phase_2_fed_cmt_prd_strt_dt IS NOT NULL
            THEN (apps.phase_2_fed_cmt_prd_strt_dt - INTERVAL '1 day')
    END + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS completeness_completion_date,

    -- SDG Preparation Phase - all Start of Day
    (CASE
        WHEN apps.phase_2_fed_cmt_prd_end_dt IS NOT NULL
            THEN (apps.phase_2_fed_cmt_prd_end_dt + INTERVAL '1 day')
    END + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS sdg_preparation_start_date,
    (apps.phase_2_dsrd_aprvl_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS expected_approval_date,
    (apps.phase_3_a_sme_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS sme_initial_review_date,
    (apps.phase_3_a_frvt_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS frt_initial_meeting_date,
    (greatest(apps.phase_3_a_sme_strt_dt, apps.phase_3_a_frvt_strt_dt) + TIME '00:00:00.000')
    AT TIME ZONE 'America/New_York' AS sdg_preparation_completion_date,

    -- Review Phase
    (least(
        apps.phase_3_c_ogc_strt_dt,
        apps.phase_3_c_omb_strt_dt,
        apps.phase_5_strt_dt
    ) + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS review_start_date,
    (apps.phase_3_c_ogc_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS receive_ogc_legal_clearance,
    (apps.phase_3_c_omb_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS receive_omb_concurrence,
    (apps.phase_5_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS submit_approval_package_to_osora,
    (apps.phase_5_end_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        AS cms_osora_clearance_end,  -- End of Day
    (apps.phase_6_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        AS package_sent_for_comms_clearance,
    (apps.phase_6_end_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS comms_clearance_received,
    (greatest(apps.phase_6_end_dt, apps.phase_5_end_dt) + TIME '00:00:00.000')
    AT TIME ZONE 'America/New_York' AS review_completion_date,

    -- Approval Package Phase - all Start of Day
    (apps.phase_4_strt_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS approval_package_start_date,
    (apps.phase_4_end_dt + TIME '00:00:00.000') AT TIME ZONE 'America/New_York' AS approval_package_completion_date

FROM {{ ref('apps_active_in_prog_pmda_demos') }} AS apps
WHERE
    apps.mdcd_pendg_demo_id NOT IN
    (SELECT e1.mdcd_pendg_demo_id FROM {{ ref('errors_apps_in_prog_missing_aplctn') }} AS e1)
