CREATE TABLE legacy_pmda_raw.mdcd_pendg_dsh_pgm_dtl_hstry (
    mdcd_pendg_dsh_pgm_dtl_hstry_id INTEGER,
    mdcd_pendg_dsh_pgm_dtl_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    mdcd_pendg_pgm_id INTEGER,
    from_dt DATE,
    to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    aprvl_ind SMALLINT,
    hstry_ts TIMESTAMPTZ,
    mdcd_dsh_pgm_dtl_id INTEGER
);
