CREATE TABLE legacy_pmda_raw.mntrg_rpt_mtrc_mdcd_elgblty_grp_type (
    mntrg_rpt_mtrc_mdcd_elgblty_grp_type_cd INTEGER,
    mntrg_rpt_mtrc_mdcd_elgblty_grp_type_name VARCHAR(100),
    tmplt_fil_doc_id INTEGER,
    mdcd_dlvrbl_file_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    mdcd_demo_type_cd VARCHAR(5),
    creatd_dt TIMESTAMPTZ
);
