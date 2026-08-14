CREATE TABLE legacy_pmda_raw.mdcd_pst_awd_frm (
    mdcd_pst_awd_frm_id INTEGER,
    pst_awd_frm_due_dt DATE,
    mdcd_demo_id INTEGER,
    mdcd_pst_awd_frm_stus_cd INTEGER,
    pst_awd_frm_stus_dt DATE,
    pst_awd_frm_dt DATE,
    pst_awd_frm_time VARCHAR(8),
    pst_awd_frm_time_zn_cd VARCHAR(3),
    pst_awd_frm_lctn_txt VARCHAR(512),
    pst_awd_frm_dtl_txt VARCHAR(1024),
    dltd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    stus_updt_user_id INTEGER,
    publg_dt DATE,
    publg_cmt_txt VARCHAR(1024)
);
