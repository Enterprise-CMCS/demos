CREATE TABLE legacy_pmda_raw.mdcd_dlvrbl_stus_hstry (
    mdcd_dlvrbl_stus_hstry_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    mdcd_dlvrbl_stus_cd INTEGER,
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    rvwr_1st_name VARCHAR(32),
    rvwr_last_name VARCHAR(64),
    role_cd INTEGER,
    rvw_dt DATE,
    dltd_ind INTEGER
);
