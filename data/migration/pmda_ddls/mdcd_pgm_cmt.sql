CREATE TABLE legacy_pmda_raw.mdcd_pgm_cmt (
    mdcd_pgm_cmt_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    mdcd_demo_type_name VARCHAR(5),
    cmt_txt VARCHAR(2048),
    user_id INTEGER,
    creatd_dt TIMESTAMPTZ
);
