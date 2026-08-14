CREATE TABLE legacy_pmda_raw.mdcd_dsgntd_state_hlth_pgm_dtl (
    mdcd_dsgntd_state_hlth_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    from_dt DATE,
    to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    mdcd_pymt_ratio_ind SMALLINT
);
