CREATE TABLE legacy_pmda_raw.bene_cst_shrng (
    bene_cst_shrng_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    bene_grp_id INTEGER,
    gnrl_copymt_dtl_txt VARCHAR(1024),
    ddctbl_amt DECIMAL(10,2),
    ddctbl_dtl_txt VARCHAR(1024),
    cst_shrng_amt_dlyd_ind SMALLINT,
    cst_shrng_amt_rdcd_ind SMALLINT,
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    demo_type_cd CHAR(5),
    mdcd_pgm_dtl_id INTEGER
);
