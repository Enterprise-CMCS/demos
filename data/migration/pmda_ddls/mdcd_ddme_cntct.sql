CREATE TABLE legacy_pmda_raw.mdcd_ddme_cntct (
    mdcd_ddme_cntct_id INTEGER,
    mdcd_ddme_cntct_1st_name VARCHAR(32),
    mdcd_ddme_cntct_last_name VARCHAR(64),
    mdcd_ddme_cntct_email_adr VARCHAR(256),
    mdcd_ddme_cntct_div_cd INTEGER,
    rcv_email_ind SMALLINT,
    datecreated TIMESTAMPTZ,
    deleted INTEGER,
    deleted_at TIMESTAMPTZ
);
