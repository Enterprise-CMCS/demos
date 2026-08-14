CREATE TABLE legacy_pmda_raw.intrfc_etl_run_cntl (
    etl_batch_id INTEGER,
    etl_batch_name CHAR(30),
    trgt_tbl_name CHAR(64),
    src_rec_cnt INTEGER,
    trgt_rec_cnt INTEGER,
    strt_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ
);
