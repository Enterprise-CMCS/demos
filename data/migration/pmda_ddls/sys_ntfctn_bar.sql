CREATE TABLE legacy_pmda_raw.sys_ntfctn_bar (
    sys_ntfctn_bar_id INTEGER,
    ntfctn_txt VARCHAR(2048),
    ntfctn_strt_dt TIMESTAMPTZ,
    ntfctn_end_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ
);
