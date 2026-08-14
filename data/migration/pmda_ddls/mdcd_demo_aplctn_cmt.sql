CREATE TABLE legacy_pmda_raw.mdcd_demo_aplctn_cmt (
    mdcd_demo_aplctn_cmt_id INTEGER,
    mdcd_demo_aplctn_id INTEGER,
    cmt_type_cd CHAR(1),
    cmt_txt VARCHAR(4096),
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER
);
