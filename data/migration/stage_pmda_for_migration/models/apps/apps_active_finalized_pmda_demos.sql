SELECT
    demo.mdcd_demo_id,
    demo.mdcd_demo_num,
    demo.mdcd_scndry_demo_num,
    demo.mdcd_demo_name,
    demo.mdcd_demo_desc,
    demo.state_prfmnc_yr_strt_dt,
    demo.state_prfmnc_yr_end_dt,
    demo.mdcd_demo_stus_cd,
    demo.demo_stus_dt,
    demo.geo_ansi_state_cd,
    demo.mdcd_chip_div_cd,
    demo.proj_ofcr_user_id,
    demo.creatd_dt,
    demo.updtd_dt,
    app.mdcd_demo_aplctn_id
FROM
    {{ source('legacy_pmda_raw', 'mdcd_demo') }} AS demo
LEFT JOIN
    {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS app
    ON
        demo.mdcd_demo_id = app.mdcd_demo_id
        AND app.mdcd_demo_aplctn_type_cd = 1
WHERE
    demo.dltd_ind = 0
    AND demo.mdcd_demo_stus_cd != 9
