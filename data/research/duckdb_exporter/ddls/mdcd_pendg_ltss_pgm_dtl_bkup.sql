CREATE TABLE legacy_pmda_raw.mdcd_pendg_ltss_pgm_dtl_bkup (
    mdcd_pendg_ltss_pgm_dtl_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    mdcd_pendg_pgm_id INTEGER,
    from_dt DATE,
    to_dt DATE,
    mc_type_cd INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    aprvl_ind SMALLINT,
    mdcd_ltss_pgm_dtl_id INTEGER
);
