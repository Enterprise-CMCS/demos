SELECT *
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo') }}
WHERE
    dltd_ind = 0
