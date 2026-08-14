CREATE TABLE legacy_pmda_raw.mdcd_help_and_sprt_matl (
    mdcd_help_and_sprt_matl_id INTEGER,
    upldd_fil_name VARCHAR(256),
    orgnl_fil_name VARCHAR(256),
    mdcd_help_and_sprt_matl_desc VARCHAR(1024),
    mdcd_help_and_sprt_matl_type_cd INTEGER,
    crnt_ind INTEGER,
    fil_guid CHAR(36),
    creatd_dt TIMESTAMPTZ,
    user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
