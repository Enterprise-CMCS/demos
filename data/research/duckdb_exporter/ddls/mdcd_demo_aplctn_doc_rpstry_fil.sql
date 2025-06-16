CREATE TABLE legacy_pmda_raw.mdcd_demo_aplctn_doc_rpstry_fil (
    mdcd_demo_aplctn_doc_rpstry_fil_id INTEGER,
    mdcd_demo_aplctn_doc_rpstry_dtl_id INTEGER,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    vrsn_ind DECIMAL(2,1),
    cmt_txt VARCHAR(2048),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
