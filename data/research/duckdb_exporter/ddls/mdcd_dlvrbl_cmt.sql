CREATE TABLE legacy_pmda_raw.mdcd_dlvrbl_cmt (
    mdcd_dlvrbl_cmt_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    user_id INTEGER,
    cmt_txt VARCHAR(1024),
    creatd_dt TIMESTAMPTZ,
    cmt_orgn_cd CHAR(1),
    cmt_aftr_acptd_ind INTEGER
);
