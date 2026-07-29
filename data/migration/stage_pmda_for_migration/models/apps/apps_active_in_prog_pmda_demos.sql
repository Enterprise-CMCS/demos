SELECT
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
    pendg.proj_ofcr_user_id,
    aplctn.creatd_dt,
    aplctn.phase_1_strt_dt,
    aplctn.phase_1_end_dt,
    aplctn.phase_2_rcvd_dt,
    aplctn.phase_2_cmpltns_rvw_dt,
    aplctn.phase_2_state_aplctn_deemd_cmpltn_dt,
    aplctn.phase_2_fed_cmt_prd_strt_dt,
    aplctn.phase_2_fed_cmt_prd_end_dt,
    aplctn.phase_2_dsrd_aprvl_dt,
    aplctn.phase_3_a_sme_strt_dt,
    aplctn.phase_3_a_frvt_strt_dt,
    aplctn.phase_3_c_ogc_strt_dt,
    aplctn.phase_3_c_omb_strt_dt,
    aplctn.phase_4_strt_dt,
    aplctn.phase_4_end_dt,
    aplctn.phase_5_strt_dt,
    aplctn.phase_5_end_dt,
    aplctn.phase_6_strt_dt,
    aplctn.phase_6_end_dt
FROM
    {{ source('legacy_pmda_raw', 'mdcd_pendg_demo') }} AS pendg
LEFT JOIN {{ source('legacy_pmda_raw', 'mdcd_demo_aplctn') }} AS aplctn
    ON
        pendg.mdcd_pendg_demo_id = aplctn.mdcd_pendg_demo_id
WHERE
    pendg.dltd_ind = 0
    AND aplctn.mdcd_demo_aplctn_type_cd = 1
    AND aplctn.dltd_ind = 0
    AND aplctn.mdcd_demo_aplctn_stus_cd NOT IN (6, 8, 9, 10)
