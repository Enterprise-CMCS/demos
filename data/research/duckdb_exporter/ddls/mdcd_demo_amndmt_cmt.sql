CREATE TABLE legacy_pmda_raw.mdcd_demo_amndmt_cmt (
    mdcd_demo_amndmt_cmt_id INTEGER,
    mdcd_demo_amndmt_id INTEGER,
    user_id INTEGER,
    cmt_txt VARCHAR(1024),
    cmt_orgn_cd CHAR(1),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ
);
