CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_fil_doc_msg (
    bdgt_ntrlty_fil_doc_msg_id INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER,
    msg_type_cd CHAR(1),
    msg_txt VARCHAR(512),
    creatd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER,
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    user_id INTEGER
);
