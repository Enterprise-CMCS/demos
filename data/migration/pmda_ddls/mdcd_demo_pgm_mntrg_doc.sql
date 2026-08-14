CREATE TABLE legacy_pmda_raw.mdcd_demo_pgm_mntrg_doc (
    mdcd_demo_pgm_mntrg_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    pgm_mntrg_ctgry_type_cd INTEGER,
    pgm_mntrg_doc_call_dt DATE,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    arcv_ind SMALLINT,
    arcv_user_id INTEGER,
    arcv_dt DATE
);
