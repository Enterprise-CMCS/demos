CREATE TABLE legacy_pmda_raw.mdcd_pgm (
    mdcd_pgm_id INTEGER,
    pgm_name VARCHAR(175),
    pgm_cd VARCHAR(26),
    pgm_desc VARCHAR(2048),
    creatd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER,
    dltd_ind SMALLINT,
    prfmnc_prd_from_dt DATE,
    prfmnc_prd_to_dt DATE
);
