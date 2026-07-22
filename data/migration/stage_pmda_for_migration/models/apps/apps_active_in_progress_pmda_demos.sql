SELECT
    gen_random_uuid() AS id,
    aplctn.mdcd_demo_aplctn_id,
    pendg.mdcd_pendg_demo_id,
    pendg.mdcd_demo_num,
    pendg.mdcd_demo_name,
    pendg.mdcd_demo_desc,
    pendg.state_prfmnc_yr_strt_dt,
    pendg.state_prfmnc_yr_end_dt,
    aplctn.mdcd_demo_aplctn_stus_cd,
    aplctn.mdcd_demo_aplctn_stus_dt,
    pendg.geo_ansi_state_cd,
    pendg.mdcd_chip_div_cd,
    pendg.proj_ofcr_user_id
FROM
    {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pendg
INNER JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS aplctn
    ON
        pendg.mdcd_pendg_demo_id = aplctn.mdcd_pendg_demo_id
WHERE
    aplctn.mdcd_demo_aplctn_type_cd = 1
    AND pendg.dltd_ind = 0
    AND aplctn.dltd_ind = 0
    AND aplctn.mdcd_demo_aplctn_stus_cd NOT IN (6, 8, 9, 10)
