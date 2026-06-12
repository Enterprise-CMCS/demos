const tempTableQuery = `
DO $$
BEGIN
    EXECUTE (
        SELECT
            E'CREATE TEMPORARY TABLE pivoted_application_dates AS\n' ||
            E'SELECT\n' ||
            E'    application_id,\n' ||
            string_agg(
                format(
                    '    to_char(max(CASE WHEN date_type_id = %L THEN date_value END) AT TIME ZONE ''America/New_York'', ''MM/DD/YYYY'') AS %I',
                    id,
                    trim(both '_' from regexp_replace(lower(trim(id)), '[^a-z0-9]+', '_', 'g'))
                ),
                E',\n'
            ) ||
            E'\nFROM\n' ||
            E'    demos_app.application_date\n' ||
            E'GROUP BY\n' ||
            E'    application_id;'
        FROM
            demos_app.date_type
    );
END
$$;
`;

const dataFetchQuery = `
WITH applications_and_parents AS (
    -- Start by getting all applications with ID and parent demonstration
    -- For demonstrations, parent_demonstration_id is the same as id
    SELECT
        app.id,
        app.application_type_id,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.id
            WHEN 'Amendment' THEN amd.demonstration_id
            WHEN 'Extension' THEN ext.demonstration_id
        END AS parent_demonstration_id,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.name
            WHEN 'Amendment' THEN amd.name
            WHEN 'Extension' THEN ext.name
        END AS application_title,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.status_id
            WHEN 'Amendment' THEN amd.status_id
            WHEN 'Extension' THEN ext.status_id
        END AS status,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.signature_level_id
            WHEN 'Amendment' THEN amd.signature_level_id
            WHEN 'Extension' THEN ext.signature_level_id
        END AS signature_level,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.effective_date
            WHEN 'Amendment' THEN amd.effective_date
            WHEN 'Extension' THEN ext.effective_date
        END AS effective_date,
        CASE app.application_type_id
            WHEN 'Demonstration' THEN demo.clearance_level_id
            WHEN 'Amendment' THEN amd.clearance_level_id
            WHEN 'Extension' THEN ext.clearance_level_id
        END AS clearance_level_comms_or_osora
    FROM
        demos_app.application AS app

    -- All apps will be one of these three
    LEFT JOIN
        demos_app.demonstration AS demo
        ON
            app.id = demo.id
    LEFT JOIN
        demos_app.amendment AS amd
        ON
            app.id = amd.id
    LEFT JOIN
        demos_app.extension AS ext
        ON
            app.id = ext.id
),

primary_roles AS (
    SELECT
        p.first_name || ' ' || p.last_name AS full_name,
        pdra.demonstration_id,
        pdra.role_id
    FROM
        demos_app.primary_demonstration_role_assignment AS pdra
    INNER JOIN
        demos_app.person AS p
        ON
            pdra.person_id = p.id
),

doc_dates AS (
    SELECT
        application_id,
        to_char(
            max(
                CASE WHEN document_type_id = 'Federal Comment Internal Analysis Document' THEN created_at END
            ) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS federal_comment_internal_analysis_document_submitted_date,
        to_char(
            max(
                CASE WHEN document_type_id = 'Final Budget Neutrality Formulation Workbook' THEN created_at END
            ) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS final_bn_formulation_workbook_uploaded_date,
        to_char(
            max(CASE WHEN document_type_id = 'Q&A' THEN created_at END) AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'
        ) AS q_and_a_file_uploaded_date,
        to_char(
            max(
                CASE WHEN document_type_id = 'Special Terms & Conditions' THEN created_at END
            ) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS special_terms_and_conditions_file_uploaded_date,
        to_char(
            max(
                CASE WHEN document_type_id = 'Formal OMB Policy Concurrence Email' THEN created_at END
            ) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS formal_omb_policy_concurrent_email_uploaded_date,
        to_char(
            max(CASE WHEN document_type_id = 'Approval Letter' THEN created_at END) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS approval_letter_uploaded_date,
        to_char(
            max(
                CASE WHEN document_type_id = 'Signed Decision Memo' THEN created_at END
            ) AT TIME ZONE 'America/New_York',
            'MM/DD/YYYY'
        ) AS signed_decision_memo_uploaded_date
    FROM
        demos_app.document
    GROUP BY
        application_id
),

app_notes AS (
    SELECT
        application_id,
        max(CASE WHEN note_type_id = 'COMMs Clearance' THEN content END) AS comms_clearance_notes,
        max(CASE WHEN note_type_id = 'CMS (OSORA) Clearance' THEN content END) AS osora_clearance_notes
    FROM
        demos_app.application_note
    GROUP BY
        application_id
)

SELECT
    demo.state_id AS state,
    app.application_type_id AS application_type,
    app.application_title,
    demo.medicaid_id AS demonstration_number,
    CASE WHEN demo_type.demonstration_id IS NOT NULL THEN demo.chip_id ELSE '-' END AS chip_id,
    primary_project_officer.full_name AS primary_project_officer,
    app.status,
    coalesce(demo.sdg_division_id, '-') AS sdg_division,
    coalesce(app.signature_level, '-') AS signature_level,
    to_char(app.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS effective_date,
    to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS expiration_date,
    coalesce(app_date.concept_start_date, '-') AS concept_start_date,
    coalesce(app_date.concept_paper_submitted_date, '-') AS concept_paper_submitted_date,
    coalesce(app_date.concept_skipped_date, '-') AS concept_skipped_date,
    coalesce(app_date.concept_completion_date, '-') AS concept_completion_date,
    coalesce(app_date.application_intake_start_date, '-') AS application_intake_start_date,
    coalesce(app_date.state_application_submitted_date, '-') AS state_application_submitted_date,
    coalesce(app_date.completeness_review_due_date, '-') AS completeness_review_due_date,
    coalesce(app_date.application_intake_completion_date, '-') AS application_intake_completion_date,
    coalesce(app_date.completeness_start_date, '-') AS completeness_start_date,
    coalesce(app_date.state_application_deemed_complete, '-') AS state_application_deemed_complete,
    coalesce(app_date.completeness_completion_date, '-') AS completeness_completion_date,
    coalesce(app_date.federal_comment_period_start_date, '-') AS federal_comment_period_start_date,
    coalesce(app_date.federal_comment_period_end_date, '-') AS federal_comment_period_end_date,
    coalesce(doc_dates.federal_comment_internal_analysis_document_submitted_date, '-')
        AS federal_comment_internal_analysis_document_submitted_date,
    coalesce(app_date.sdg_preparation_start_date, '-') AS sdg_preparation_start_date,
    coalesce(app_date.expected_approval_date, '-') AS expected_approval_date,
    coalesce(app_date.sme_initial_review_date, '-') AS sme_initial_review_date,
    coalesce(app_date.frt_initial_meeting_date, '-') AS frt_initial_meeting_date,
    coalesce(app_date.bnpmt_initial_meeting_date, '-') AS bnpmt_initial_meeting_date,
    coalesce(app_date.sdg_preparation_completion_date, '-') AS sdg_preparation_completion_date,
    coalesce(app_date.review_start_date, '-') AS review_start_date,
    coalesce(app_date.ogd_approval_to_share_with_smes, '-') AS ogd_approval_to_share_with_smes,
    coalesce(app_date.draft_approval_package_to_prep, '-') AS draft_approval_package_to_prep,
    coalesce(app_date.ddme_approval_received, '-') AS ddme_approval_received,
    coalesce(app_date.state_concurrence, '-') AS state_concurrence,
    coalesce(app_date.bn_pmt_approval_to_send_to_omb, '-') AS bn_pmt_approval_to_send_to_omb,
    coalesce(app_date.draft_approval_package_shared, '-') AS draft_approval_package_shared,
    coalesce(app_date.receive_omb_concurrence, '-') AS receive_omb_concurrence,
    coalesce(app_date.receive_ogc_legal_clearance, '-') AS receive_ogc_legal_clearance,
    app.clearance_level_comms_or_osora,
    coalesce(app_date.package_sent_for_comms_clearance, '-') AS package_sent_for_comms_clearance,
    coalesce(app_date.comms_clearance_received, '-') AS comms_clearance_received,
    coalesce(app_notes.comms_clearance_notes, '-') AS comms_clearance_notes,
    coalesce(app_date.submit_approval_package_to_osora, '-') AS submit_approval_package_to_osora,
    coalesce(app_date.osora_r1_comments_due, '-') AS osora_r1_comments_due,
    coalesce(app_date.osora_r2_comments_due, '-') AS osora_r2_comments_due,
    coalesce(app_date.cms_osora_clearance_end, '-') AS cms_osora_clearance_end,
    coalesce(app_notes.osora_clearance_notes, '-') AS osora_clearance_notes,
    coalesce(app_date.review_completion_date, '-') AS review_completion_date,
    coalesce(app_date.approval_package_start_date, '-') AS approval_package_start_date,
    coalesce(doc_dates.final_bn_formulation_workbook_uploaded_date, '-') AS final_bn_formulation_workbook_uploaded_date,
    coalesce(doc_dates.q_and_a_file_uploaded_date, '-') AS q_and_a_file_uploaded_date,
    coalesce(doc_dates.special_terms_and_conditions_file_uploaded_date, '-')
        AS special_terms_and_conditions_file_uploaded_date,
    coalesce(doc_dates.formal_omb_policy_concurrent_email_uploaded_date, '-')
        AS formal_omb_policy_concurrent_email_uploaded_date,
    coalesce(doc_dates.approval_letter_uploaded_date, '-') AS approval_letter_uploaded_date,
    coalesce(doc_dates.signed_decision_memo_uploaded_date, '-') AS signed_decision_memo_uploaded_date,
    coalesce(app_date.approval_package_completion_date, '-') AS approval_package_completion_date,
    coalesce(app_date.approval_summary_start_date, '-') AS approval_summary_start_date,
    coalesce(app_date.application_details_marked_complete_date, '-') AS application_details_marked_complete_date,
    coalesce(app_date.application_demonstration_types_marked_complete_date, '-')
        AS application_demonstration_types_marked_complete_date,
    coalesce(app_date.approval_summary_completion_date, '-') AS approval_summary_completion_date
FROM
    applications_and_parents AS app

-- Every application has a parent demo (or is a demo)
INNER JOIN
    demos_app.demonstration AS demo
    ON
        app.parent_demonstration_id = demo.id

-- This identifies when the parent demo has CHIP
LEFT JOIN
    demos_app.demonstration_type_tag_assignment AS demo_type
    ON
        app.parent_demonstration_id = demo_type.demonstration_id
        AND demo_type.tag_name_id = 'Children''s Health Insurance Program (CHIP)'

-- Primary Project Officer is guaranteed to exist
INNER JOIN
    primary_roles AS primary_project_officer
    ON
        app.parent_demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'

-- The date pivot should have rows for every application, but just in case, using left here
LEFT JOIN
    pivoted_application_dates AS app_date
    ON
        app.id = app_date.application_id

-- Possible to not have any documents
LEFT JOIN
    doc_dates
    ON
        app.id = doc_dates.application_id

-- Possible to not have any notes
LEFT JOIN
    app_notes
    ON
        app.id = app_notes.application_id;
`;

export const applicationDetailsReportQueries = [tempTableQuery, dataFetchQuery];
