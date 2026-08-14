CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_wvr (
    bdgt_ntrlty_wvr_id INTEGER,
    wvr_name VARCHAR(256),
    row_num INTEGER,
    mdcd_demo_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    map_ind INTEGER,
    adm_ind INTEGER,
    fed_shr_ind INTEGER,
    tot_cmptbl_ind INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER
);
