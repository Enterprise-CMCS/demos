CREATE TABLE legacy_pmda_raw.v_app_mgmt_demo_types (
    name VARCHAR(5),
    from_dt DATE,
    to_dt DATE,
    title VARCHAR(88),
    id INTEGER,
    mdcd_pendg_pgm_id INTEGER,
    mdcd_pendg_demo_id INTEGER,
    detailed_name VARCHAR(128),
    aprvl_ind SMALLINT,
    mdcd_pgm_dtl_id INTEGER,
    mdcd_pymt_ratio_ind VARCHAR(6),
    chg_type_cd CHAR(1),
    othr_attr_chg_ind SMALLINT
);
