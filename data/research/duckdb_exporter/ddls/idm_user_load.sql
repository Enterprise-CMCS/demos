CREATE TABLE legacy_pmda_raw.idm_user_load (
    id INTEGER,
    datecreated TIMESTAMPTZ,
    username VARCHAR(256),
    firstname VARCHAR(32),
    lastname VARCHAR(64),
    phone VARCHAR(32),
    email VARCHAR(256),
    role_name VARCHAR(100),
    role_cd INTEGER,
    mdcd_rgnl_ofc_type_name VARCHAR(256),
    mdcd_rgnl_ofc_type_cd INTEGER,
    geo_ansi_state_cds VARCHAR(4096)
);
