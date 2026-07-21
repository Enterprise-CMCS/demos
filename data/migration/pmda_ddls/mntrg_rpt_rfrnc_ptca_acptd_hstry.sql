CREATE TABLE legacy_pmda_raw.mntrg_rpt_rfrnc_ptca_acptd_hstry (
    mntrg_rpt_rfrnc_ptca_acptd_hstry_id INTEGER,
    rfrnc_matl_id INTEGER,
    mdcd_demo_type_cd VARCHAR(5),
    cy_num SMALLINT,
    ptca_acptd_dt TIMESTAMPTZ,
    ptca_acptd_user_id INTEGER,
    vrsn_num DECIMAL(3,2)
);
