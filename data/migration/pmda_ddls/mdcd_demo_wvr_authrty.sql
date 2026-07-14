CREATE TABLE legacy_pmda_raw.mdcd_demo_wvr_authrty (
    mdcd_demo_wvr_authrty_id INTEGER,
    mdcd_demo_id INTEGER,
    wvr_authrty_title_cd INTEGER,
    wvr_authrty_id INTEGER,
    wvr_authrty_desc VARCHAR(2048),
    dltd_ind SMALLINT,
    dltd_rsn_txt VARCHAR(2048),
    efctv_dt DATE,
    exprtn_dt DATE,
    creatd_dt TIMESTAMPTZ
);
