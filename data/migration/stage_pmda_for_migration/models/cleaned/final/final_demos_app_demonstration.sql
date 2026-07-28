SELECT
    id,
    application_type_id,
    name, -- noqa: RF04
    description,
    effective_date,
    expiration_date,
    sdg_division_id,
    signature_level_id,
    status_id,
    status_updated_at,
    current_phase_id,
    state_id,
    clearance_level_id,
    medicaid_id,
    chip_id,
    created_at,
    updated_at,
    _legacy_proj_ofcr_user_id
FROM {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
UNION
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
    cleaned_demos._legacy_proj_ofcr_user_id
FROM {{ ref('cleaned_demos_app_demonstration_in_prog_demos') }} AS cleaned_demos
INNER JOIN {{ ref('apps_in_prog_phase_completion') }} AS phase_completion
    ON
        cleaned_demos.mdcd_demo_aplctn_id = phase_completion.mdcd_demo_aplctn_id
