CREATE TABLE legacy_pmda_raw.err_log (
    err_log_pk INTEGER,
    err_log_type VARCHAR(32),
    create_dt TIMESTAMPTZ,
    err_log_msg VARCHAR(1024),
    err_log_dtl TEXT,
    user_id INTEGER,
    err_log_extra VARCHAR(512),
    err_log_src VARCHAR(64)
);
