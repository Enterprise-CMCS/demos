CREATE TABLE legacy_pmda_raw.mdcd_pendg_dsrip_pgm_elgblty_grp_hstry (
    mdcd_pendg_dsrip_pgm_elgblty_grp_hstry_id INTEGER,
    mdcd_pendg_dsrip_pgm_elgblty_grp_id INTEGER,
    mdcd_pendg_dsrip_pgm_dtl_id INTEGER,
    dsrip_elgblty_grp_type_cd INTEGER,
    creatd_dt TIMESTAMPTZ,
    hstry_ts TIMESTAMPTZ,
    mdcd_dsrip_pgm_elgblty_grp_id INTEGER,
    dltd_ind SMALLINT,
    aprvl_ind SMALLINT
);
