CREATE TABLE legacy_pmda_raw.mdcd_div_dshbd_dtl (
    mdcd_div_dshbd_dtl_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_div_dshbd_dtl_data_type_cd SMALLINT,
    mdcd_div_dshbd_stus_cd INTEGER,
    mdcd_div_dshbd_val_txt VARCHAR(50),
    rvw_cmt_txt VARCHAR(1024),
    rvw_cmplt_cmt_txt VARCHAR(1024),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    dltd_ind SMALLINT
);
