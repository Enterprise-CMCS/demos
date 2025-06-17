CREATE TABLE legacy_pmda_raw.bene_grp (
    bene_grp_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    bene_grp_ctgry_type_cd SMALLINT,
    bene_grp_fpl_type_cd SMALLINT,
    bdgt_ntrlty_per_mmbr_mo_wth_wvr_amt DECIMAL(10,2),
    bdgt_ntrlty_per_mmbr_mo_wthot_wvr_amt DECIMAL(10,2),
    mnthly_prm_amt DECIMAL(10,2),
    mnthly_prm_type_cd SMALLINT,
    ann_prm_amt DECIMAL(10,2),
    ann_prm_type_cd SMALLINT,
    prm_dtl_txt VARCHAR(1024),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    demo_type_cd CHAR(5),
    mdcd_pgm_dtl_id INTEGER,
    rdc_prmms_ind SMALLINT
);
