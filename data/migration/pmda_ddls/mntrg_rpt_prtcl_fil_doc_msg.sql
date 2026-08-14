CREATE TABLE legacy_pmda_raw.mntrg_rpt_prtcl_fil_doc_msg (
    mntrg_rpt_prtcl_fil_doc_msg_id INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    msg_type_cd CHAR(4),
    msg_txt VARCHAR(512),
    creatd_dt TIMESTAMPTZ,
    tmplt_fil_doc_id INTEGER,
    user_id INTEGER
);
