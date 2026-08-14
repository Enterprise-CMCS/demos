CREATE TABLE legacy_pmda_raw.mdcd_demo_authrty_fil_doc (
    mdcd_demo_authrty_fil_doc_id INTEGER,
    mdcd_demo_id INTEGER,
    upldd_fil_name VARCHAR(256),
    mdcd_demo_authrty_fil_name VARCHAR(64),
    mdcd_demo_authrty_fil_desc VARCHAR(512),
    creatd_dt TIMESTAMPTZ,
    mdfyd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    orgnl_fil_name VARCHAR(256),
    authrty_type_cd INTEGER
);
