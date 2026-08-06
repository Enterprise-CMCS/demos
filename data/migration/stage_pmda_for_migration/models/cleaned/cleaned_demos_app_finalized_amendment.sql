SELECT
    gen_random_uuid() AS id,
    application_type_id,
    demonstration_id,
    demonstration_status_id,
    name, -- noqa: RF04
    description,
    effective_date,
    status_id,
    status_updated_at,
    current_phase_id,
    'CMS (OSORA)' AS clearance_level_id,
    signature_level_id,
    coalesce(creatd_dt, current_timestamp) AS created_at,
    coalesce(creatd_dt, current_timestamp) AS updated_at,
    _legacy_mdcd_demo_amndmt_id
FROM
    {{ ref('apps_unfiltered_staged_finalized_pmda_amendment') }}
WHERE _legacy_mdcd_demo_amndmt_id NOT IN (
    SELECT e1._legacy_mdcd_demo_amndmt_id FROM {{ ref('errors_app_amendment_without_demo') }} AS e1
)
AND _legacy_mdcd_demo_amndmt_id NOT IN (
    SELECT e2._legacy_mdcd_demo_amndmt_id FROM {{ ref('errors_app_amendment_invalid_signature_level') }} AS e2
)
