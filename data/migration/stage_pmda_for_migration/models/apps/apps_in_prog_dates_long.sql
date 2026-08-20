SELECT
    a.mdcd_demo_aplctn_id,
    d.date_type,
    d.date_value,
    d.date_value_cleaned
FROM
    {{ ref('apps_in_prog_dates_with_checks_cleaned') }} AS a
CROSS JOIN
    LATERAL (
        VALUES
        (
            'Concept Start Date',
            (a.concept_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_concept_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Concept Completion Date',
            (a.concept_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_concept_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Concept Skipped Date',
            (a.concept_skipped_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_concept_skipped_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Application Intake Start Date',
            (a.application_intake_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_application_intake_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'State Application Submitted Date',
            (a.state_application_submitted_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_state_application_submitted_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Completeness Review Due Date',
            (a.completeness_review_due_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
            (a.cleaned_completeness_review_due_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        ),
        (
            'Application Intake Completion Date',
            (a.application_intake_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_application_intake_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Completeness Start Date',
            (a.completeness_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_completeness_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'State Application Deemed Complete',
            (a.state_application_deemed_complete + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_state_application_deemed_complete + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Federal Comment Period Start Date',
            (a.federal_comment_period_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_federal_comment_period_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Federal Comment Period End Date',
            (a.federal_comment_period_end_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
            (a.cleaned_federal_comment_period_end_date + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        ),
        (
            'Completeness Completion Date',
            (a.completeness_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_completeness_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'SDG Preparation Start Date',
            (a.sdg_preparation_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_sdg_preparation_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Internal Expected Approval Date',
            (a.expected_approval_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_expected_approval_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'SME Initial Review Date',
            (a.sme_initial_review_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_sme_initial_review_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'FRT Initial Meeting Date',
            (a.frt_initial_meeting_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_frt_initial_meeting_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'SDG Preparation Completion Date',
            (a.sdg_preparation_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_sdg_preparation_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Review Start Date',
            (a.review_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_review_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Receive OGC Legal Clearance',
            (a.receive_ogc_legal_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_receive_ogc_legal_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Receive OMB Concurrence',
            (a.receive_omb_concurrence + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_receive_omb_concurrence + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Submit Approval Package to OSORA',
            (a.submit_approval_package_to_osora + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_submit_approval_package_to_osora + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'CMS OSORA Clearance End',
            (a.cms_osora_clearance_end + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
            (a.cleaned_cms_osora_clearance_end + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
        ),
        (
            'Package Sent for COMMs Clearance',
            (a.package_sent_for_comms_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_package_sent_for_comms_clearance + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'COMMs Clearance Received',
            (a.comms_clearance_received + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_comms_clearance_received + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Review Completion Date',
            (a.review_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_review_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Approval Package Start Date',
            (a.approval_package_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_approval_package_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        ),
        (
            'Approval Package Completion Date',
            (a.approval_package_completion_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York',
            (a.cleaned_approval_package_start_date + TIME '00:00:00.000') AT TIME ZONE 'America/New_York'
        )
    ) AS d (date_type, date_value, date_value_cleaned)
