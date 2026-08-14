CREATE TABLE legacy_pmda_raw.mdcd_pendg_pgm_hstry (
    mdcd_pendg_pgm_hstry_id INTEGER,
    mdcd_pendg_pgm_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    mdcd_pgm_id INTEGER,
    pgm_name VARCHAR(175),
    pgm_desc VARCHAR(2048),
    prfmnc_prd_from_dt DATE,
    prfmnc_prd_to_dt DATE,
    creatd_user_id INTEGER,
    creatd_dt TIMESTAMPTZ,
    updtd_user_id INTEGER,
    updtd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    aprvl_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMPTZ,
    hstry_ts TIMESTAMPTZ
);
