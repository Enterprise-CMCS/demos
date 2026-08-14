CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_mmbr_mo_actl (
    bdgt_ntrlty_mmbr_mo_actl_id INTEGER,
    bdgt_ntrlty_mdcd_elgblty_grp_id INTEGER,
    bdgt_ntrlty_mdcd_elgblty_grp_pop_id INTEGER,
    bdgt_ntrlty_demo_yr_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER,
    mmbr_mo_actl_val_num DECIMAL(19,4),
    mdcd_dlvrbl_fil_doc_id INTEGER
);
