SELECT * FROM {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_stus_hstry') }}
WHERE dltd_ind = 0 AND mdcd_dlvrbl_stus_cd = 3
