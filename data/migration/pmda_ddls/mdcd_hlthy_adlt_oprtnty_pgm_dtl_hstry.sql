CREATE TABLE legacy_pmda_raw.mdcd_hlthy_adlt_oprtnty_pgm_dtl_hstry (
    mdcd_hlthy_adlt_oprtnty_pgm_dtl_hstry_id INTEGER,
    mdcd_hlthy_adlt_oprtnty_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    hlthy_adlt_oprtnty_from_dt DATE,
    hlthy_adlt_oprtnty_to_dt DATE,
    percapita_oprtnty_ind SMALLINT,
    percapita_oprtnty_from_dt DATE,
    percapita_oprtnty_to_dt DATE,
    agg_cap_oprtnty_ind SMALLINT,
    agg_cap_oprtnty_from_dt DATE,
    agg_cap_oprtnty_to_dt DATE,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    hstry_ts TIMESTAMPTZ
);
