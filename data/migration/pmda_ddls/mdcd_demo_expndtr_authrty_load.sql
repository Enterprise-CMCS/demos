CREATE TABLE legacy_pmda_raw.mdcd_demo_expndtr_authrty_load (
    mdcd_demo_expndtr_authrty_load_id INTEGER,
    mdcd_demo_id INTEGER,
    geo_ansi_state_cd CHAR(2),
    mdcd_demo_num VARCHAR(20),
    mdcd_demo_name VARCHAR(128),
    prfmnc_prd_from_dt DATE,
    prfmnc_prd_to_dt DATE,
    expndtr_authrty_title_cd INTEGER,
    expndtr_authrty_title_name VARCHAR(3),
    expndtr_authrty_ctgry_cd INTEGER,
    expndtr_authrty_ctgry_name VARCHAR(100),
    expndtr_authrty_no_name_ind SMALLINT,
    expndtr_authrty_name VARCHAR(512),
    expndtr_authrty_desc VARCHAR(8192)
);
