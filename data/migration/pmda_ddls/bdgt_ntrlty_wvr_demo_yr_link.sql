CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_wvr_demo_yr_link (
    bdgt_ntrlty_wvr_demo_yr_link_id INTEGER,
    bdgt_ntrlty_demo_yr_id INTEGER,
    bdgt_ntrlty_wvr_id INTEGER,
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    mdcd_demo_id INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER,
    creatd_user_id INTEGER,
    wvr_demo_yr_num DECIMAL(15,0),
    mdcd_dlvrbl_id INTEGER,
    map_ind INTEGER,
    adm_ind INTEGER,
    fed_shr_ind INTEGER,
    tot_cmptbl_ind INTEGER
);
