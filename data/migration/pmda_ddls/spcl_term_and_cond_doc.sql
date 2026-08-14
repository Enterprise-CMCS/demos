CREATE TABLE legacy_pmda_raw.spcl_term_and_cond_doc (
    spcl_term_and_cond_doc_id INTEGER,
    upldd_fil_name VARCHAR(256),
    spcl_term_and_cond_fil_name VARCHAR(64),
    spcl_term_and_cond_fil_desc VARCHAR(512),
    creatd_dt TIMESTAMPTZ,
    mdfyd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    mdcd_demo_id INTEGER,
    orgnl_fil_name VARCHAR(256),
    bkmrk_cnt_num INTEGER,
    prefrd_cnt_num INTEGER,
    aprvl_dt DATE,
    doc_arcv_ind SMALLINT,
    arcvl_user_id INTEGER,
    srch_idx_procd_ind SMALLINT
);
