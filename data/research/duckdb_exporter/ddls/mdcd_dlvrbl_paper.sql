CREATE TABLE legacy_pmda_raw.mdcd_dlvrbl_paper (
    mdcd_dlvrbl_paper_id INTEGER,
    mdcd_dlvrbl_id INTEGER,
    mdcd_demo_id INTEGER,
    dlvrbl_paper_ctgry_type_cd INTEGER,
    dlvrbl_paper_othr_ctgry_type_name VARCHAR(128),
    dlvrbl_paper_othr_ctgry_type_desc VARCHAR(1024),
    upldd_fil_name VARCHAR(128),
    orgnl_fil_name VARCHAR(128),
    dlvrbl_paper_fil_desc VARCHAR(1024),
    dlvrbl_paper_fil_dt DATE,
    dlvrbl_paper_creatd_dt TIMESTAMPTZ,
    dlvrbl_paper_creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
