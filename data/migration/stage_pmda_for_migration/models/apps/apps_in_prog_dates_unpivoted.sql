SELECT
    a.id,
    a.mdcd_demo_aplctn_id,
    d.date_type,
    d.date_value
FROM
    {{ ref('apps_in_prog_dates_crosswalked') }} AS a
CROSS JOIN
    LATERAL (
        VALUES
        ('Concept Start Date', a.concept_start_date),
        ('Concept Completion Date', a.concept_completion_date),
        ('Concept Skipped Date', a.concept_skipped_date),
        ('Application Intake Start Date', a.application_intake_start_date),
        ('State Application Submitted Date', a.state_application_submitted_date),
        ('Completeness Review Due Date', a.completeness_review_due_date),
        ('Application Intake Completion Date', a.application_intake_completion_date),
        ('Completeness Start Date', a.completeness_start_date),
        ('State Application Deemed Complete', a.state_application_deemed_complete),
        ('Federal Comment Period Start Date', a.federal_comment_period_start_date),
        ('Federal Comment Period End Date', a.federal_comment_period_end_date),
        ('Completeness Completion Date', a.completeness_completion_date),
        ('SDG Preparation Start Date', a.sdg_preparation_start_date),
        ('Expected Approval Date', a.expected_approval_date),
        ('SME Initial Review Date', a.sme_initial_review_date),
        ('FRT Initial Meeting Date', a.frt_initial_meeting_date),
        ('SDG Preparation Completion Date', a.sdg_preparation_completion_date),
        ('Review Start Date', a.review_start_date),
        ('Receive OGC Legal Clearance', a.receive_ogc_legal_clearance),
        ('Receive OMB Concurrence', a.receive_omb_concurrence),
        ('Submit Approval Package to OSORA', a.submit_approval_package_to_osora),
        ('CMS OSORA Clearance End', a.cms_osora_clearance_end),
        ('Package Sent for Comms Clearance', a.package_sent_for_comms_clearance),
        ('Comms Clearance Received', a.comms_clearance_received),
        ('Review Completion Date', a.review_completion_date),
        ('Approval Package Start Date', a.approval_package_start_date),
        ('Approval Package Completion Date', a.approval_package_completion_date)
    ) AS d (date_type, date_value)
WHERE
    d.date_value IS NOT NULL
