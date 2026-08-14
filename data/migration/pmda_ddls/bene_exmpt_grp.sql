CREATE TABLE legacy_pmda_raw.bene_exmpt_grp (
    bene_exmpt_grp_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    bene_exmpt_grp_ctgry_type_cd SMALLINT,
    bene_exmpt_grp_fpl_type_cd SMALLINT,
    bene_exmpt_grp_othr_name VARCHAR(1024),
    bene_exmpt_grp_othr_desc VARCHAR(1024),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    demo_type_cd CHAR(5),
    mdcd_pgm_dtl_id INTEGER
);
