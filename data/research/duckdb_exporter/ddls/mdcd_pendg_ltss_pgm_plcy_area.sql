CREATE TABLE legacy_pmda_raw.mdcd_pendg_ltss_pgm_plcy_area (
    mdcd_pendg_ltss_pgm_plcy_area_id INTEGER,
    mdcd_pendg_ltss_pgm_dtl_id INTEGER,
    plcy_area_type_cd INTEGER,
    from_dt DATE,
    to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    aprvl_ind SMALLINT,
    mdcd_ltss_pgm_dtl_id INTEGER,
    mdcd_ltss_pgm_plcy_area_id INTEGER
);
