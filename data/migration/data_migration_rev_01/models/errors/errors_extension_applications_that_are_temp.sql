SELECT *
FROM
    {{ ref('apps_extension_applications') }}
WHERE
    _legacy_temp_extnsn_ind = 1
