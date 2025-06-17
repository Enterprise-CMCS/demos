CREATE TABLE legacy_pmda_raw.mdcd_demo_amndmt (
    mdcd_demo_amndmt_id INTEGER,
    mdcd_demo_amndmt_name VARCHAR(128),
    mdcd_demo_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    amndmt_prd_from_dt DATE,
    amndmt_prd_to_dt DATE,
    mdcd_demo_amndmt_stus_cd INTEGER,
    amndmt_stus_dt DATE,
    amndmt_aplctn_dt DATE,
    amndmt_desc VARCHAR(2048),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    mdcd_demo_aplctn_sgntr_lvl_cd INTEGER
);
