CREATE TABLE legacy_pmda_raw.mdcd_emer_wvr_authrty_pgm_dtl_hstry (
    mdcd_emer_wvr_authrty_pgm_dtl_hstry_id INTEGER,
    mdcd_emer_wvr_authrty_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    mdcd_emer_wvr_authrty_type_cd INTEGER,
    mdcd_emer_wvr_authrty_from_dt DATE,
    mdcd_emer_wvr_authrty_to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
