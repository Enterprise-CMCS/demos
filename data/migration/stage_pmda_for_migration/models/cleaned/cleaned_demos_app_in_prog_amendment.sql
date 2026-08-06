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
    'CMS (OSORA)' AS clearance_level_id,
    signature_level_id,
    created_at,
    updated_at,
    NULL::INTEGER AS _legacy_mdcd_demo_amndmt_id,
    _legacy_mdcd_pendg_demo_id
FROM
    {{ ref('apps_unfiltered_staged_in_prog_amendments') }}
WHERE _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e1._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_apps_pendg_amendments_with_no_applications') }} AS e1
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e2._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_amendment_applications_with_no_demo') }} AS e2
)
AND _legacy_mdcd_pendg_demo_id NOT IN (
    SELECT e3._legacy_mdcd_pendg_demo_id FROM {{ ref('errors_app_in_prog_amendment_invalid_signature_level') }} AS e3
)
