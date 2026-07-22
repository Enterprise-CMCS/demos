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
    'CMS (OSORA)' AS clearance_level_id,
    medicaid_id,
    chip_id,
    current_timestamp AS created_at,
    current_timestamp AS updated_at,
    proj_ofcr_user_id AS _legacy_proj_ofcr_user_id
FROM
    {{ ref('apps_unfiltered_staged_in_progress_pmda_demos') }}
WHERE
    mdcd_pendg_demo_id NOT IN (
        SELECT e1.mdcd_pendg_demo_id FROM {{ ref('errors_invalid_demo_nums_in_in_progress_pmda_demos') }} AS e1
    )
