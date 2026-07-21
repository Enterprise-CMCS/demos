CREATE TABLE legacy_pmda_raw.mdcd_demo_aplctn_doc_rpstry_dtl (
    mdcd_demo_aplctn_doc_rpstry_dtl_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    mdcd_demo_aplctn_doc_desc VARCHAR(1024),
    mdcd_demo_aplctn_doc_type_cd INTEGER,
    mdcd_demo_aplctn_doc_othr_type_desc VARCHAR(512),
    state_prvdd_ind SMALLINT,
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    updtd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
