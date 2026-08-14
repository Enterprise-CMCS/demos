CREATE TABLE legacy_pmda_raw.mdcd_dsrip_pgm_dtl_hstry (
    mdcd_dsrip_pgm_dtl_hstry_id INTEGER,
    mdcd_dsrip_pgm_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    from_dt DATE,
    to_dt DATE,
    trgtd_ent_type_cd INTEGER,
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    hstry_ts TIMESTAMPTZ
);
