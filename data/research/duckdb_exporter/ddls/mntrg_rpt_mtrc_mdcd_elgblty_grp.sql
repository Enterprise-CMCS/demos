CREATE TABLE legacy_pmda_raw.mntrg_rpt_mtrc_mdcd_elgblty_grp (
    mntrg_rpt_mtrc_mdcd_elgblty_grp_id INTEGER,
    mdcd_sud_mntrg_rpt_mtrc_id INTEGER,
    msr_num VARCHAR(5),
    msr_prd_txt VARCHAR(10),
    mntrg_rpt_mtrc_mdcd_elgblty_grp_type_cd INTEGER,
    dts_cvrd_by_msrmnt_prd_for_mtrc_txt VARCHAR(45),
    msr_dnmtr_num DECIMAL(10,2),
    msr_nmrtr_num DECIMAL(10,2),
    msr_rate_num DECIMAL(10,2),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_dt TIMESTAMPTZ,
    dltd_user_id INTEGER
);
