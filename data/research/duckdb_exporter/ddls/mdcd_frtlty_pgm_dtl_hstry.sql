CREATE TABLE legacy_pmda_raw.mdcd_frtlty_pgm_dtl_hstry (
    mdcd_frtlty_pgm_dtl_hstry_id INTEGER,
    mdcd_frtlty_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    from_dt DATE,
    to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
