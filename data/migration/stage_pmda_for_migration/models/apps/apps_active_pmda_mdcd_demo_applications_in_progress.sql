SELECT
    aplctn.mdcd_pendg_demo_id,
    pendg.mdcd_demo_num,
    pendg.mdcd_demo_name,
    pendg.geo_ansi_state_cd,
    pendg.mdcd_demo_desc,
    pendg.mdcd_chip_div_cd,
    pendg.state_prfmnc_yr_strt_dt,
    pendg.state_prfmnc_yr_end_dt
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS aplctn
LEFT JOIN
    {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pendg
    ON
        aplctn.mdcd_pendg_demo_id = pendg.mdcd_pendg_demo_id
WHERE
    aplctn.dltd_ind = 0
    AND pendg.dltd_ind = 0
    AND aplctn.mdcd_demo_id IS NULL
    AND aplctn.mdcd_demo_aplctn_type_cd = 1
