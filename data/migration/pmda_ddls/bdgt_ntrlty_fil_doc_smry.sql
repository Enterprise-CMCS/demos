CREATE TABLE legacy_pmda_raw.bdgt_ntrlty_fil_doc_smry (
    bdgt_ntrlty_fil_doc_smry_id INTEGER,
    mdcd_dlvrbl_fil_doc_id INTEGER,
    carry_frwrd_svgs_from_prior_prd_amt_ind INTEGER,
    carry_frwrd_svgs_from_prior_prd_amt DECIMAL(15,0),
    net_var_tot_val_ind INTEGER,
    net_var_tot_val_num DECIMAL(15,0),
    map_ind INTEGER,
    adm_ind INTEGER,
    tot_comp_val_num DECIMAL(15,0),
    tot_comp_less_non_add_val_num DECIMAL(15,0),
    fed_shr_tot_val_num DECIMAL(15,0),
    fed_shr_less_non_add_val_num DECIMAL(15,0),
    creatd_dt TIMESTAMPTZ
);
