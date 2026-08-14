CREATE TABLE legacy_pmda_raw.mdcd_demo_sv_atnde (
    mdcd_demo_sv_atnde_id INTEGER,
    mdcd_demo_sv_id INTEGER,
    mdcd_demo_id INTEGER,
    atnde_1st_name VARCHAR(32),
    atnde_last_name VARCHAR(64),
    mdcd_demo_sv_rprsntn_type_cd INTEGER,
    mdcd_demo_sv_rprsntn_othr_type_desc VARCHAR(256),
    user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
