CREATE TABLE legacy_pmda_raw.mdcd_pendg_demo_rnwl (
    mdcd_pendg_demo_rnwl_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    rnwl_prd_from_dt DATE,
    rnwl_prd_to_dt DATE,
    mdcd_demo_rnwl_stus_cd INTEGER,
    rnwl_stus_dt DATE,
    rnwl_aplctn_dt DATE,
    rnwl_desc VARCHAR(2048),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    temp_extnsn_ind SMALLINT,
    temp_extnsn_from_dt DATE,
    temp_extnsn_to_dt DATE,
    orgnl_state_prfmnc_yr_end_dt DATE,
    orgnl_demo_stus_cd INTEGER
);
