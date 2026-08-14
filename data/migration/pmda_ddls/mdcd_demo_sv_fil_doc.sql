CREATE TABLE legacy_pmda_raw.mdcd_demo_sv_fil_doc (
    mdcd_demo_sv_fil_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    mdcd_demo_sv_id INTEGER,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    mdcd_demo_sv_fil_desc VARCHAR(256),
    mdcd_demo_sv_sprtng_doc_type_cd INTEGER,
    mdcd_demo_sv_sprtng_doc_othr_type_desc VARCHAR(512),
    user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
