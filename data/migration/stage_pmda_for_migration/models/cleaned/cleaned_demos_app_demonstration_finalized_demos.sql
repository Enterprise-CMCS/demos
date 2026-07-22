SELECT
    gen_random_uuid() AS id,
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
    mdcd_demo_id AS _legacy_mdcd_demo_id,
    proj_ofcr_user_id AS _legacy_proj_ofcr_user_id
FROM
    {{ ref('apps_unfiltered_staged_finalized_pmda_demos') }}
WHERE
    mdcd_demo_id NOT IN (
        SELECT e1.mdcd_demo_id FROM {{ ref('errors_invalid_demo_nums_in_finalized_pmda_demos') }} AS e1
    )
    AND mdcd_demo_id NOT IN (
        SELECT e2.mdcd_demo_id FROM {{ ref('errors_duplicate_demo_nums_in_finalized_pmda_demos') }} AS e2
    )
