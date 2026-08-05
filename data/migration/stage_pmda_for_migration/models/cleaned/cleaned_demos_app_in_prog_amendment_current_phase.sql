SELECT
    id,
    application_type_id,
    demonstration_id,
    demonstration_status_id,
    name, -- noqa: RF04
    description,
    effective_date,
    status_id,
    status_updated_at,
    'Concept' AS current_phase_id, -- to be updated with dates/phases
    clearance_level_id,
    signature_level_id,
    created_at,
    updated_at,
    _legacy_mdcd_demo_amndmt_id,
    _legacy_mdcd_pendg_demo_id
FROM
    {{ ref('cleaned_demos_app_in_prog_amendment') }}
