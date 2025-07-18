CREATE TABLE legacy_pmda_raw.mdcd_demo_expndtr_authrty_hstry (
    mdcd_demo_expndtr_authrty_hstry_id INTEGER,
    mdcd_demo_expndtr_authrty_id INTEGER,
    mdcd_demo_id INTEGER,
    expndtr_authrty_id INTEGER,
    expndtr_authrty_title_cd INTEGER,
    expndtr_authrty_ctgry_cd INTEGER,
    expndtr_authrty_no_name_ind SMALLINT,
    expndtr_authrty_name VARCHAR(512),
    prfmnc_prd_from_dt DATE,
    prfmnc_prd_to_dt DATE,
    expndtr_authrty_desc VARCHAR(8192),
    expndtr_cap_ind SMALLINT,
    expndtr_cap_amt DECIMAL(10,2),
    mdcd_risk_mtgtn_pgm_dtl_id INTEGER,
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_rsn_txt VARCHAR(2048),
    dltd_dt TIMESTAMPTZ,
    dltd_user_id INTEGER,
    exprtn_dt DATE,
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    hstry_updtd_dt TIMESTAMPTZ
);
