CREATE TABLE legacy_pmda_raw.mdcd_prm_astnc_pgm_dtl_hstry_bkup (
    mdcd_prm_astnc_pgm_dtl_hstry_id INTEGER,
    mdcd_prm_astnc_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    prm_astnc_fcs_area_type_cd INTEGER,
    addtnl_fcs_area_dtl_desc VARCHAR(256),
    mdcd_expnsn_ind SMALLINT,
    cvrg_area_type_cd INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
