-- Unpivot phase statuses from wide format (one row per application with 8 status columns)
-- to long format (8 rows per application, one per phase)

SELECT
    ps.id,
    ps.mdcd_demo_aplctn_id,
    phase.phase_id,
    phase.phase_status_id
FROM {{ ref('apps_in_prog_phase_statuses') }} AS ps
CROSS JOIN LATERAL (
    VALUES
    ('Concept', ps.concept_phase_status),
    ('Application Intake', ps.application_intake_phase_status),
    ('Completeness', ps.completeness_phase_status),
    ('Federal Comment Period', ps.federal_comment_period_status),
    ('SDG Preparation', ps.sdg_preparation_phase_status),
    ('Review', ps.review_phase_status),
    ('Approval Package', ps.approval_package_phase_status),
    ('Approval Summary', ps.approval_summary_phase_status)
) AS phase (phase_id, phase_status_id)
