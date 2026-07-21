CREATE TABLE legacy_pmda_raw.spcl_term_and_cond_doc_bkmrk (
    spcl_term_and_cond_doc_bkmrk_id INTEGER,
    spcl_term_and_cond_doc_id INTEGER,
    bkmrk_name VARCHAR(100),
    bkmrk_smry_txt VARCHAR(1024),
    dsply_sqnc_num SMALLINT,
    spcl_term_and_cond_tmplt_sect_id INTEGER,
    prefrd_ind INTEGER,
    wthdrwn_ind INTEGER,
    creatd_dt TIMESTAMPTZ
);
