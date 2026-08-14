CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_pgm_spnd_lmt (
    bdgt_ntrlty_pgm_spnd_lmt_id INTEGER,
    bdgt_ntrlty_pgm_spnd_lmt_name_txt VARCHAR(256),
    mdcd_demo_id INTEGER,
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    creatd_dt TIMESTAMP,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_dt TIMESTAMPTZ,
    dltd_user_id INTEGER
);
