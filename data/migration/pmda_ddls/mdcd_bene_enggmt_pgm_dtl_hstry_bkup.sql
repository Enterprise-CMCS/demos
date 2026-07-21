CREATE TABLE legacy_pmda_raw.mdcd_bene_enggmt_pgm_dtl_hstry_bkup (
    mdcd_bene_enggmt_pgm_dtl_hstry_id INTEGER,
    mdcd_bene_enggmt_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    mdcd_expnsn_ind SMALLINT,
    bene_enggmt_fcs_area_type_cd INTEGER,
    addtnl_fcs_area_dtl_desc VARCHAR(256),
    cvrg_area_type_cd INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
