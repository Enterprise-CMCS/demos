CREATE TABLE legacy_pmda_raw.mdcd_demo_sv (
    mdcd_demo_sv_id INTEGER,
    mdcd_demo_id INTEGER,
    demo_sv_dt DATE,
    demo_sv_lctn_name VARCHAR(256),
    visit_prpse_desc VARCHAR(1024),
    visit_cmt_desc VARCHAR(2048),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
