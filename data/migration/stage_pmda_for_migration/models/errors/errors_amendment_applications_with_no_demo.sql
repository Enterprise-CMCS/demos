SELECT *
FROM
    {{ ref('apps_amendment_applications') }}
WHERE
    _legacy_mdcd_demo_id IS NULL
