SELECT
    mdcd_demo_id,
    mdcd_demo_num,
    mdcd_scndry_demo_num,
    mdcd_demo_name,
    mdcd_demo_desc,
    state_prfmnc_yr_strt_dt,
    state_prfmnc_yr_end_dt,
    mdcd_demo_stus_cd,
    demo_stus_dt,
    geo_ansi_state_cd,
    mdcd_chip_div_cd
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo') }}
WHERE
    dltd_ind = 0
