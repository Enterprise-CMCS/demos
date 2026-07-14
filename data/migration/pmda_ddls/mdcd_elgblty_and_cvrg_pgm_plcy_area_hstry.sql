CREATE TABLE legacy_pmda_raw.mdcd_elgblty_and_cvrg_pgm_plcy_area_hstry (
    mdcd_elgblty_and_cvrg_pgm_plcy_area_hstry_id INTEGER,
    mdcd_elgblty_and_cvrg_pgm_plcy_area_id INTEGER,
    mdcd_elgblty_and_cvrg_pgm_dtl_id INTEGER,
    plcy_area_type_cd INTEGER,
    prfmnc_prd_from_dt DATE,
    prfmnc_prd_to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
