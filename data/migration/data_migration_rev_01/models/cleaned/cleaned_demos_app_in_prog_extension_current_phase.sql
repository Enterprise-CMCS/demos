SELECT
    extension.id,
    extension.application_type_id,
    extension.demonstration_id,
    extension.demonstration_status_id,
    extension.name, -- noqa: RF04
    extension.description,
    extension.effective_date,
    extension.status_id,
    extension.status_updated_at,
    phase_completion.current_phase_id,
    extension.clearance_level_id,
    extension.signature_level_id,
    extension.created_at,
    extension.updated_at,
    extension._legacy_mdcd_demo_rnwl_id,
    extension._legacy_mdcd_pendg_demo_id,
    extension._legacy_mdcd_demo_aplctn_id
FROM
    {{ ref('cleaned_demos_app_in_prog_extension') }} AS extension -- noqa: RF04
LEFT JOIN {{ ref('apps_in_prog_phase_completion') }} AS phase_completion
    ON
        extension._legacy_mdcd_demo_aplctn_id = phase_completion.mdcd_demo_aplctn_id
