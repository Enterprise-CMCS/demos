WITH apps AS (
    SELECT
        _legacy_mdcd_demo_aplctn_id AS mdcd_demo_aplctn_id,
        _legacy_mdcd_pendg_demo_id AS mdcd_pendg_demo_id,
        created_at AS creatd_dt,
        phase_1_strt_dt,
        phase_1_end_dt,
        phase_2_rcvd_dt,
        phase_2_cmpltns_rvw_dt,
        phase_2_state_aplctn_deemd_cmpltn_dt,
        phase_2_fed_cmt_prd_strt_dt,
        phase_2_fed_cmt_prd_end_dt,
        phase_2_dsrd_aprvl_dt,
        phase_3_a_sme_strt_dt,
        phase_3_a_frvt_strt_dt,
        phase_3_c_ogc_strt_dt,
        phase_3_c_omb_strt_dt,
        phase_4_strt_dt,
        phase_4_end_dt,
        phase_5_strt_dt,
        phase_5_end_dt,
        phase_6_strt_dt,
        phase_6_end_dt
    FROM {{ ref('cleaned_demos_app_in_prog_extension') }}
),

direct_crosswalk AS (
    SELECT
        *,
        -- Concept Phase
        NULL::DATE AS concept_paper_submitted_date,

        -- Application Intake Phase
        phase_2_rcvd_dt AS state_application_submitted_date,
        phase_2_cmpltns_rvw_dt AS completeness_review_due_date,

        -- Completeness Phase
        phase_2_state_aplctn_deemd_cmpltn_dt AS state_application_deemed_complete,
        phase_2_fed_cmt_prd_strt_dt AS federal_comment_period_start_date,
        phase_2_fed_cmt_prd_end_dt AS federal_comment_period_end_date,

        -- Federal Comment Phase (no date fields)

        -- SDG Preparation Phase
        phase_2_dsrd_aprvl_dt AS expected_approval_date,
        phase_3_a_sme_strt_dt AS sme_initial_review_date,
        phase_3_a_frvt_strt_dt AS frt_initial_meeting_date,
        NULL::DATE AS bnpmt_initial_meeting_date,

        -- Review Phase
        NULL::DATE AS ogd_approval_to_share_with_smes,
        NULL::DATE AS draft_approval_package_to_prep,
        NULL::DATE AS ddme_approval_received,
        NULL::DATE AS state_concurrence,
        NULL::DATE AS bn_pmt_approval_to_send_to_omb,
        NULL::DATE AS draft_approval_package_shared,
        phase_3_c_omb_strt_dt AS receive_omb_concurrence,
        phase_3_c_ogc_strt_dt AS receive_ogc_legal_clearance,
        phase_5_strt_dt AS submit_approval_package_to_osora,
        NULL::DATE AS osora_r1_comments_due,
        NULL::DATE AS osora_r2_comments_due,
        phase_5_end_dt AS cms_osora_clearance_end,
        phase_6_strt_dt AS package_sent_for_comms_clearance,
        phase_6_end_dt AS comms_clearance_received,

        -- approval package phase (no date fields)

        -- approval summary phase
        NULL::DATE AS application_details_marked_complete_date,
        NULL::DATE AS application_demonstration_types_marked_complete_date,
        NULL::DATE AS application_approval_date

    FROM apps
),

completion_date_derivations AS (
    SELECT
        *,
        CASE
            WHEN concept_paper_submitted_date IS NOT NULL
                THEN phase_1_end_dt
        END AS concept_completion_date,
        CASE
            WHEN
                state_application_submitted_date IS NOT NULL
                AND completeness_review_due_date IS NOT NULL
                THEN state_application_submitted_date
        END AS application_intake_completion_date,
        CASE
            WHEN
                state_application_deemed_complete IS NOT NULL
                AND federal_comment_period_start_date IS NOT NULL
                AND federal_comment_period_end_date IS NOT NULL
                THEN state_application_deemed_complete
        END AS completeness_completion_date,
        -- required date BNPMT Initial Meeting Date for SDG Preparation Phase does not exist in PMDA.
        -- This phase and subsequent phases cannot be completed. 
        NULL::DATE AS sdg_preparation_completion_date,
        NULL::DATE AS review_completion_date,
        NULL::DATE AS approval_package_completion_date,
        NULL::DATE AS approval_summary_completion_date

    FROM direct_crosswalk
),

concept_skipped_date_derivation AS (
    SELECT
        *,
        CASE
            WHEN
                concept_completion_date IS NULL
                AND application_intake_completion_date IS NOT NULL
                THEN coalesce(
                    concept_paper_submitted_date,
                    creatd_dt::DATE
                )
        END AS concept_skipped_date
    FROM completion_date_derivations
),

start_date_derivations AS (
    SELECT
        *,
        coalesce(phase_1_strt_dt, creatd_dt::DATE) AS concept_start_date,
        CASE
            WHEN concept_completion_date IS NOT NULL
                THEN (concept_completion_date + INTERVAL '1 day')::DATE
            WHEN
                state_application_submitted_date IS NOT NULL
                OR completeness_review_due_date IS NOT NULL
                THEN coalesce(state_application_submitted_date, creatd_dt::DATE)
        END AS application_intake_start_date,
        CASE
            WHEN application_intake_completion_date IS NOT NULL
                THEN (application_intake_completion_date + INTERVAL '1 day')::DATE
            WHEN
                state_application_deemed_complete IS NOT NULL
                OR federal_comment_period_start_date IS NOT NULL
                OR federal_comment_period_end_date IS NOT NULL
                THEN coalesce(state_application_deemed_complete, creatd_dt::DATE)
        END AS completeness_start_date,
        CASE
            WHEN federal_comment_period_end_date IS NOT NULL
                THEN (federal_comment_period_end_date + INTERVAL '1 day')::DATE
            WHEN
                expected_approval_date IS NOT NULL
                OR sme_initial_review_date IS NOT NULL
                OR frt_initial_meeting_date IS NOT NULL
                THEN coalesce(least(sme_initial_review_date, frt_initial_meeting_date), creatd_dt::DATE)
        END AS sdg_preparation_start_date,
        CASE
            WHEN
                receive_omb_concurrence IS NOT NULL
                OR receive_ogc_legal_clearance IS NOT NULL
                OR submit_approval_package_to_osora IS NOT NULL
                OR cms_osora_clearance_end IS NOT NULL
                OR package_sent_for_comms_clearance IS NOT NULL
                OR comms_clearance_received IS NOT NULL
                THEN coalesce(
                    least(
                        receive_omb_concurrence,
                        receive_ogc_legal_clearance,
                        submit_approval_package_to_osora,
                        cms_osora_clearance_end,
                        package_sent_for_comms_clearance,
                        comms_clearance_received
                    ),
                    creatd_dt::DATE
                )
        END AS review_start_date,
        NULL::DATE AS approval_package_start_date, -- Phase has no applicable date data in PMDA
        NULL::DATE AS approval_summary_start_date -- Phase has no applicable date data in PMDA
    FROM concept_skipped_date_derivation
)

SELECT
    mdcd_demo_aplctn_id,
    mdcd_pendg_demo_id,

    -- Concept Phase
    concept_start_date,
    concept_paper_submitted_date,
    concept_completion_date,
    concept_skipped_date,

    -- Application Intake Phase
    application_intake_start_date,
    state_application_submitted_date,
    completeness_review_due_date,
    application_intake_completion_date,

    -- Completeness Phase
    completeness_start_date,
    state_application_deemed_complete,
    federal_comment_period_start_date,
    federal_comment_period_end_date,
    completeness_completion_date,

    -- SDG Preparation Phase
    sdg_preparation_start_date,
    expected_approval_date,
    sme_initial_review_date,
    frt_initial_meeting_date,
    bnpmt_initial_meeting_date,
    sdg_preparation_completion_date,

    -- Review Phase
    review_start_date,
    ogd_approval_to_share_with_smes,
    draft_approval_package_to_prep,
    ddme_approval_received,
    state_concurrence,
    bn_pmt_approval_to_send_to_omb,
    draft_approval_package_shared,
    receive_omb_concurrence,
    receive_ogc_legal_clearance,
    submit_approval_package_to_osora,
    osora_r1_comments_due,
    osora_r2_comments_due,
    cms_osora_clearance_end,
    package_sent_for_comms_clearance,
    comms_clearance_received,
    review_completion_date,

    -- Approval Package Phase
    approval_package_start_date,
    approval_package_completion_date,

    -- Approval Summary Phase
    approval_summary_start_date,
    application_details_marked_complete_date,
    application_demonstration_types_marked_complete_date,
    application_approval_date,
    approval_summary_completion_date

FROM start_date_derivations
