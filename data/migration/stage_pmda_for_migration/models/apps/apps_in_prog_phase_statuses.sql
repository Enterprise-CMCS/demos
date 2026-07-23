WITH cleaned_wide AS (
    SELECT
        id,
        mdcd_demo_aplctn_id,
        max(CASE WHEN date_type = 'Concept Start Date' THEN date_value END) AS concept_start_date,
        max(CASE WHEN date_type = 'Concept Paper Submitted Date' THEN date_value END) AS concept_paper_submitted_date,
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
        max(CASE WHEN date_type = 'BNPMT Initial Meeting Date' THEN date_value END) AS bnpmt_initial_meeting_date,
        max(CASE WHEN date_type = 'SDG Preparation Completion Date' THEN date_value END)
            AS sdg_preparation_completion_date,
        max(CASE WHEN date_type = 'Review Start Date' THEN date_value END) AS review_start_date,
        max(CASE WHEN date_type = 'OGD Approval to Share with SMEs' THEN date_value END)
            AS ogd_approval_to_share_with_smes,
        max(CASE WHEN date_type = 'Draft Approval Package to Prep' THEN date_value END)
            AS draft_approval_package_to_prep,
        max(CASE WHEN date_type = 'DDME Approval Received' THEN date_value END) AS ddme_approval_received,
        max(CASE WHEN date_type = 'State Concurrence' THEN date_value END) AS state_concurrence,
        max(CASE WHEN date_type = 'BN PMT Approval to Send to OMB' THEN date_value END)
            AS bn_pmt_approval_to_send_to_omb,
        max(CASE WHEN date_type = 'Draft Approval Package Shared' THEN date_value END) AS draft_approval_package_shared,
        max(CASE WHEN date_type = 'Receive OGC Legal Clearance' THEN date_value END) AS receive_ogc_legal_clearance,
        max(CASE WHEN date_type = 'Receive OMB Concurrence' THEN date_value END) AS receive_omb_concurrence,
        max(CASE WHEN date_type = 'Submit Approval Package to OSORA' THEN date_value END)
            AS submit_approval_package_to_osora,
        max(CASE WHEN date_type = 'OSORA R1 Comments Due' THEN date_value END) AS osora_r1_comments_due,
        max(CASE WHEN date_type = 'OSORA R2 Comments Due' THEN date_value END) AS osora_r2_comments_due,
        max(CASE WHEN date_type = 'CMS (OSORA) Clearance End' THEN date_value END) AS cms_osora_clearance_end,
        max(CASE WHEN date_type = 'Package Sent for COMMs Clearance' THEN date_value END)
            AS package_sent_for_comms_clearance,
        max(CASE WHEN date_type = 'COMMs Clearance Received' THEN date_value END) AS comms_clearance_received,
        max(CASE WHEN date_type = 'Review Completion Date' THEN date_value END) AS review_completion_date,
        max(CASE WHEN date_type = 'Approval Package Start Date' THEN date_value END) AS approval_package_start_date,
        max(CASE WHEN date_type = 'Approval Package Completion Date' THEN date_value END)
            AS approval_package_completion_date,
        max(CASE WHEN date_type = 'Application Details Marked Complete Date' THEN date_value END)
            AS application_details_marked_complete_date,
        max(CASE WHEN date_type = 'Application Demonstration Types Marked Complete Date' THEN date_value END)
            AS application_demonstration_types_marked_complete_date,
        max(CASE WHEN date_type = 'Approval Summary Start Date' THEN date_value END) AS approval_summary_start_date,
        max(CASE WHEN date_type = 'Approval Summary Completion Date' THEN date_value END)
            AS approval_summary_completion_date
    FROM {{ ref('apps_in_prog_dates_validated') }}
    WHERE validation_failures IS NULL
    GROUP BY id, mdcd_demo_aplctn_id
)

SELECT
    id,
    mdcd_demo_aplctn_id,

    -- Concept Phase Status
    CASE
        WHEN concept_skipped_date IS NOT NULL THEN 'Skipped'
        WHEN
            concept_start_date IS NOT NULL
            /* AND concept_paper_submitted_date IS NOT NULL */ -- intentionally excluded for now
            AND concept_completion_date IS NOT NULL THEN 'Completed'
        ELSE 'Started'
    END AS concept_phase_status,

    -- Application Intake Phase Status
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

    -- Completeness Phase Status
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

    -- Federal Comment Period Status
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (concept_start_date IS NOT NULL AND concept_completion_date IS NOT NULL)
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            THEN 'Completed'
        WHEN federal_comment_period_start_date IS NOT NULL OR federal_comment_period_end_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS federal_comment_period_status,

    -- SDG Preparation Phase Status
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
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL THEN 'Completed'
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

    -- Review Phase Status
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
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND ogd_approval_to_share_with_smes IS NOT NULL
            AND draft_approval_package_to_prep IS NOT NULL AND ddme_approval_received IS NOT NULL
            AND state_concurrence IS NOT NULL AND bn_pmt_approval_to_send_to_omb IS NOT NULL
            AND draft_approval_package_shared IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND submit_approval_package_to_osora IS NOT NULL
            AND osora_r1_comments_due IS NOT NULL AND osora_r2_comments_due IS NOT NULL
            AND cms_osora_clearance_end IS NOT NULL AND package_sent_for_comms_clearance IS NOT NULL
            AND comms_clearance_received IS NOT NULL AND review_completion_date IS NOT NULL THEN 'Completed'
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
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS review_phase_status,

    -- Approval Package Phase Status
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
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND ogd_approval_to_share_with_smes IS NOT NULL
            AND draft_approval_package_to_prep IS NOT NULL AND ddme_approval_received IS NOT NULL
            AND state_concurrence IS NOT NULL AND bn_pmt_approval_to_send_to_omb IS NOT NULL
            AND draft_approval_package_shared IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND submit_approval_package_to_osora IS NOT NULL
            AND osora_r1_comments_due IS NOT NULL AND osora_r2_comments_due IS NOT NULL
            AND cms_osora_clearance_end IS NOT NULL AND package_sent_for_comms_clearance IS NOT NULL
            AND comms_clearance_received IS NOT NULL AND review_completion_date IS NOT NULL
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
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND ogd_approval_to_share_with_smes IS NOT NULL
            AND draft_approval_package_to_prep IS NOT NULL AND ddme_approval_received IS NOT NULL
            AND state_concurrence IS NOT NULL AND bn_pmt_approval_to_send_to_omb IS NOT NULL
            AND draft_approval_package_shared IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND submit_approval_package_to_osora IS NOT NULL
            AND osora_r1_comments_due IS NOT NULL AND osora_r2_comments_due IS NOT NULL
            AND cms_osora_clearance_end IS NOT NULL AND package_sent_for_comms_clearance IS NOT NULL
            AND comms_clearance_received IS NOT NULL AND review_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS approval_package_phase_status,

    -- Approval Summary Phase Status
    CASE
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (
                    concept_start_date IS NOT NULL AND concept_paper_submitted_date IS NOT NULL
                    AND concept_completion_date IS NOT NULL
                )
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND ogd_approval_to_share_with_smes IS NOT NULL
            AND draft_approval_package_to_prep IS NOT NULL AND ddme_approval_received IS NOT NULL
            AND state_concurrence IS NOT NULL AND bn_pmt_approval_to_send_to_omb IS NOT NULL
            AND draft_approval_package_shared IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND submit_approval_package_to_osora IS NOT NULL
            AND osora_r1_comments_due IS NOT NULL AND osora_r2_comments_due IS NOT NULL
            AND cms_osora_clearance_end IS NOT NULL AND package_sent_for_comms_clearance IS NOT NULL
            AND comms_clearance_received IS NOT NULL AND review_completion_date IS NOT NULL
            AND approval_package_start_date IS NOT NULL AND approval_package_completion_date IS NOT NULL
            AND application_details_marked_complete_date IS NOT NULL
            AND application_demonstration_types_marked_complete_date IS NOT NULL
            AND approval_summary_start_date IS NOT NULL AND approval_summary_completion_date IS NOT NULL
            THEN 'Completed'
        WHEN
            approval_summary_start_date IS NOT NULL OR application_details_marked_complete_date IS NOT NULL
            OR application_demonstration_types_marked_complete_date IS NOT NULL
            OR approval_summary_completion_date IS NOT NULL THEN 'Started'
        WHEN
            (
                concept_skipped_date IS NOT NULL
                OR (
                    concept_start_date IS NOT NULL AND concept_paper_submitted_date IS NOT NULL
                    AND concept_completion_date IS NOT NULL
                )
            )
            AND application_intake_start_date IS NOT NULL AND state_application_submitted_date IS NOT NULL
            AND completeness_review_due_date IS NOT NULL AND application_intake_completion_date IS NOT NULL
            AND completeness_start_date IS NOT NULL AND state_application_deemed_complete IS NOT NULL
            AND federal_comment_period_start_date IS NOT NULL AND federal_comment_period_end_date IS NOT NULL
            AND completeness_completion_date IS NOT NULL
            AND sdg_preparation_start_date IS NOT NULL AND expected_approval_date IS NOT NULL
            AND sme_initial_review_date IS NOT NULL AND frt_initial_meeting_date IS NOT NULL
            AND bnpmt_initial_meeting_date IS NOT NULL AND sdg_preparation_completion_date IS NOT NULL
            AND review_start_date IS NOT NULL AND ogd_approval_to_share_with_smes IS NOT NULL
            AND draft_approval_package_to_prep IS NOT NULL AND ddme_approval_received IS NOT NULL
            AND state_concurrence IS NOT NULL AND bn_pmt_approval_to_send_to_omb IS NOT NULL
            AND draft_approval_package_shared IS NOT NULL AND receive_ogc_legal_clearance IS NOT NULL
            AND receive_omb_concurrence IS NOT NULL AND submit_approval_package_to_osora IS NOT NULL
            AND osora_r1_comments_due IS NOT NULL AND osora_r2_comments_due IS NOT NULL
            AND cms_osora_clearance_end IS NOT NULL AND package_sent_for_comms_clearance IS NOT NULL
            AND comms_clearance_received IS NOT NULL AND review_completion_date IS NOT NULL
            AND approval_package_start_date IS NOT NULL AND approval_package_completion_date IS NOT NULL THEN 'Started'
        ELSE 'Not Started'
    END AS approval_summary_phase_status,

    -- Current Phase (first phase that isn't completed)
    CASE
        WHEN
            concept_skipped_date IS NULL AND (
                concept_start_date IS NULL OR concept_paper_submitted_date IS NULL
                OR concept_completion_date IS NULL
            )
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
            OR bnpmt_initial_meeting_date IS NULL OR sdg_preparation_completion_date IS NULL THEN 'SDG Preparation'
        WHEN
            review_start_date IS NULL OR ogd_approval_to_share_with_smes IS NULL
            OR draft_approval_package_to_prep IS NULL OR ddme_approval_received IS NULL
            OR state_concurrence IS NULL OR bn_pmt_approval_to_send_to_omb IS NULL
            OR draft_approval_package_shared IS NULL OR receive_ogc_legal_clearance IS NULL
            OR receive_omb_concurrence IS NULL OR submit_approval_package_to_osora IS NULL
            OR osora_r1_comments_due IS NULL OR osora_r2_comments_due IS NULL
            OR cms_osora_clearance_end IS NULL OR package_sent_for_comms_clearance IS NULL
            OR comms_clearance_received IS NULL OR review_completion_date IS NULL THEN 'Review'
        WHEN approval_package_start_date IS NULL OR approval_package_completion_date IS NULL THEN 'Approval Package'
        ELSE 'Approval Summary'
    END AS current_phase_id

FROM cleaned_wide
