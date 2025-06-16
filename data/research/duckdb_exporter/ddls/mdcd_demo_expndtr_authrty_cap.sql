CREATE TABLE legacy_pmda_raw.mdcd_demo_expndtr_authrty_cap (
    mdcd_demo_expndtr_authrty_cap_id INTEGER,
    mdcd_demo_id INTEGER,
    expndtr_cap_amt DECIMAL(10,2),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    dltd_rsn_txt VARCHAR(2048)
);
