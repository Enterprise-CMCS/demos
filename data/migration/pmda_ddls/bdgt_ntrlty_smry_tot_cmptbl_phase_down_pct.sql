CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_smry_tot_cmptbl_phase_down_pct (
    bdgt_ntrlty_smry_tot_cmptbl_phase_down_pct_id INTEGER,
    bdgt_ntrlty_mdcd_elgblty_grp_id INTEGER,
    bdgt_ntrlty_mdcd_elgblty_grp_pop_id INTEGER,
    bdgt_ntrlty_demo_yr_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER,
    svgs_phase_down_pct REAL,
    mdcd_dlvrbl_fil_doc_id INTEGER
);
