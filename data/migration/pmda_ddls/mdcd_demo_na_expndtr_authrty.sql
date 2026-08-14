CREATE TABLE legacy_pmda_raw.mdcd_demo_na_expndtr_authrty (
    mdcd_demo_na_expndtr_authrty_id INTEGER,
    mdcd_demo_id INTEGER,
    na_expndtr_authrty_title_cd INTEGER,
    na_expndtr_authrty_id INTEGER,
    na_expndtr_authrty_pops_txt VARCHAR(1024),
    na_expndtr_authrty_desc VARCHAR(2048),
    dltd_ind SMALLINT,
    dltd_rsn_txt VARCHAR(2048),
    exprtn_dt DATE,
    creatd_dt TIMESTAMPTZ
);
