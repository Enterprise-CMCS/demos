CREATE TABLE legacy_pmda_raw.mdcd_othr_pgm_dtl_hstry (
    mdcd_othr_pgm_dtl_hstry_id INTEGER,
    mdcd_othr_pgm_dtl_id INTEGER,
    mdcd_pgm_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_othr_pgm_dtl_name VARCHAR(128),
    mdcd_othr_pgm_desc VARCHAR(2048),
    from_dt DATE,
    to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
