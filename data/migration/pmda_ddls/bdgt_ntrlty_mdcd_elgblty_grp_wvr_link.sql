CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_mdcd_elgblty_grp_wvr_link (
    mdcd_elgblty_grp_wvr_link_id INTEGER,
    bdgt_ntrlty_mdcd_elgblty_grp_id INTEGER,
    bdgt_ntrlty_wvr_id INTEGER,
    bdgt_ntrlty_demo_yr_id INTEGER,
    mdcd_elgblty_grp_wvr_num DECIMAL(15,0),
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    mdcd_demo_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    creatd_user_id INTEGER,
    bdgt_ntrlty_tmplt_fil_doc_id INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER,
    fed_shr_ind INTEGER,
    tot_cmptbl_ind INTEGER
);
