SELECT
    cleaned_demos.id,
    cleaned_demos.application_type_id,
    cleaned_demos.name, -- noqa: RF04
    cleaned_demos.description,
    cleaned_demos.effective_date,
    cleaned_demos.expiration_date,
    cleaned_demos.sdg_division_id,
    cleaned_demos.signature_level_id,
    cleaned_demos.status_id,
    cleaned_demos.status_updated_at,
    phase_completion.current_phase_id,
    cleaned_demos.state_id,
    cleaned_demos.clearance_level_id,
    cleaned_demos.medicaid_id,
    cleaned_demos.chip_id,
    cleaned_demos.created_at,
    cleaned_demos.updated_at,
    NULL::INTEGER AS _legacy_mdcd_demo_id,
    cleaned_demos._legacy_proj_ofcr_user_id,
    cleaned_demos.mdcd_demo_aplctn_id AS _legacy_mdcd_demo_aplctn_id,
    cleaned_demos.mdcd_pendg_demo_id AS _legacy_mdcd_pendg_demo_id
FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS cleaned_demos
LEFT JOIN {{ ref('apps_in_prog_phase_completion') }} AS phase_completion
    ON
        cleaned_demos.mdcd_demo_aplctn_id = phase_completion.mdcd_demo_aplctn_id
WHERE
    phase_completion.mdcd_demo_aplctn_id IS NOT NULL
