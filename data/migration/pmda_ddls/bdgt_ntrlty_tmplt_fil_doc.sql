CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_tmplt_fil_doc (
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    bdgt_ntrlty_tmplt_fil_desc VARCHAR(1024),
    creatd_dt TIMESTAMPTZ,
    user_id INTEGER,
    aprvd_dt TIMESTAMPTZ,
    aprvd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    crnt_ind INTEGER,
    bdgt_ntrlty_actv_prfmnc_strt_demo_yr_num SMALLINT,
    bdgt_ntrlty_actv_prfmnc_end_demo_yr_num SMALLINT,
    tmplt_fil_doc_type_cd INTEGER
);
