CREATE TABLE legacy_pmda_raw.mdcd_pst_awd_frm_fil_doc (
    mdcd_pst_awd_frm_fil_doc_id INTEGER,
    mdcd_pst_awd_frm_id INTEGER,
    doc_name VARCHAR(300),
    pst_awd_frm_fil_name VARCHAR(300),
    tstmny_type_cd INTEGER,
    pblc_cmt_txt VARCHAR(1024),
    pst_awd_frm_doc_title VARCHAR(128),
    pst_awd_frm_doc_desc VARCHAR(512),
    user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER
);
