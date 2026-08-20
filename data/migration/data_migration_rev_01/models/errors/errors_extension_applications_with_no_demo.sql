SELECT *
FROM
    {{ ref('apps_extension_applications') }}
WHERE
    _legacy_mdcd_demo_id IS NULL
