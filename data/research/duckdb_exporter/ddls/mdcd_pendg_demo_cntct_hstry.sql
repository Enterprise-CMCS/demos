CREATE TABLE legacy_pmda_raw.mdcd_pendg_demo_cntct_hstry (
    mdcd_pendg_demo_cntct_hstry_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    state_mdcd_drctr_1st_name VARCHAR(32),
    state_mdcd_drctr_last_name VARCHAR(64),
    state_mdcd_drctr_email_adr VARCHAR(256),
    state_mdcd_drctr_phne_num VARCHAR(32),
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    hstry_ts TIMESTAMPTZ
);
