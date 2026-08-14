CREATE TABLE legacy_pmda_raw.email_hstry (
    email_hstry_id INTEGER,
    email_subj_txt VARCHAR(100),
    email_msg_txt TEXT,
    creatd_dt TIMESTAMPTZ,
    send_dt TIMESTAMPTZ,
    email_tmplt_cd SMALLINT,
    retry_num INTEGER,
    entity_id INTEGER,
    entity_type_cd INTEGER,
    email_adr VARCHAR(256),
    mdcd_demo_id INTEGER,
    mass_email_ind SMALLINT,
    retry_dt_exced_ind SMALLINT,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    email_atchmnt_name VARCHAR(4096)
);
