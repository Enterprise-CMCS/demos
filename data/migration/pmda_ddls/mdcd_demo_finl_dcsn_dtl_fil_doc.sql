CREATE TABLE legacy_pmda_raw.mdcd_demo_finl_dcsn_dtl_fil_doc (
    mdcd_demo_finl_dcsn_dtl_fil_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    mdcd_demo_finl_dcsn_dtl_fil_desc VARCHAR(1024),
    creatd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
