SELECT
    amendment.id,
    amendment.application_type_id,
    amendment.demonstration_id,
    amendment.demonstration_status_id,
    amendment.name, -- noqa: RF04
    amendment.description,
    amendment.effective_date,
    amendment.status_id,
    amendment.status_updated_at,
    phase_completion.current_phase_id,
    amendment.clearance_level_id,
    amendment.signature_level_id,
    amendment.created_at,
    amendment.updated_at,
    amendment._legacy_mdcd_demo_amndmt_id,
    amendment._legacy_mdcd_pendg_demo_id,
    amendment._legacy_mdcd_demo_aplctn_id
FROM
    {{ ref('cleaned_demos_app_in_prog_amendment') }} AS amendment
LEFT JOIN {{ ref('apps_in_prog_phase_completion') }} AS phase_completion
    ON
        amendment._legacy_mdcd_demo_aplctn_id = phase_completion.mdcd_demo_aplctn_id
