SELECT mdcd_pendg_demo_id
FROM
    {{ ref('apps_active_in_prog_pmda_demos') }}
WHERE
    mdcd_demo_aplctn_id IS NULL
