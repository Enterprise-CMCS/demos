SELECT * FROM {{ ref('apps_pending_extensions') }}
WHERE _legacy_mdcd_pendg_demo_id IS NULL
