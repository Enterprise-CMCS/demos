SELECT *
FROM
    {{ source('legacy_pmda_raw', 'mdcd_dlvrbl') }}
WHERE
    dltd_ind = 0
    AND mdcd_dlvrbl_crnt_stus_cd != 0
    AND mdcd_dlvrbl_crnt_stus_cd != 16
