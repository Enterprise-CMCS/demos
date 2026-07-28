WITH phase_status_unpivot AS (
    SELECT
        demos.id,
        phases.phase_name,
        phases.phase_status
    FROM {{ ref('apps_in_prog_phase_completion') }} AS d
    CROSS JOIN
        LATERAL (
            VALUES
            ('Concept', d.concept_phase_status),
            ('Application Intake', d.application_intake_phase_status),
            ('Completeness', d.completeness_phase_status),
            ('Federal Comment', d.federal_comment_period_phase_status),
            ('SDG Preparation', d.sdg_preparation_status),
            ('Review', d.review_phase_status),
            ('Approval Package', d.approval_package_phase_status),
            ('Approval Summary', d.approval_summary_phase_status)
        ) AS phases (phase_name, phase_status)
    INNER JOIN {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS demos
        ON
            d.mdcd_demo_aplctn_id = demos.mdcd_demo_aplctn_id
)

SELECT
    psu.id AS application_id,
    psu.phase_name AS phase_id,
    psu.phase_status AS phase_status_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at
FROM
    phase_status_unpivot AS psu
