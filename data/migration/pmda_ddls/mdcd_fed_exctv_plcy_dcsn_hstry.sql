CREATE TABLE legacy_pmda_raw.mdcd_fed_exctv_plcy_dcsn_hstry (
    mdcd_fed_exctv_plcy_dcsn_hstry_id INTEGER,
    mdcd_fed_exctv_plcy_dcsn_id INTEGER,
    mdcd_demo_aplctn_id INTEGER,
    oa_rptd_dt DATE,
    dcsn_dt DATE,
    key_iss_txt VARCHAR(2048),
    dsply_sqnc_num SMALLINT,
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    updtd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    hstry_ts TIMESTAMPTZ
);
