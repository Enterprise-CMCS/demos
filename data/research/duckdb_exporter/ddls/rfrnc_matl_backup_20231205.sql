CREATE TABLE legacy_pmda_raw.rfrnc_matl_backup_20231205 (
    rfrnc_matl_id INTEGER,
    mdcd_demo_type_cd VARCHAR(5),
    rfrnc_matl_name VARCHAR(256),
    rfrnc_matl_desc VARCHAR(1024),
    rfrnc_matl_doc_type_cd SMALLINT,
    cy_num SMALLINT,
    fil_name VARCHAR(256),
    fil_zip_ind SMALLINT,
    dsply_sqnc_num SMALLINT,
    creatd_dt TIMESTAMPTZ,
    dltd_ind SMALLINT,
    dltd_dt TIMESTAMPTZ,
    agrmt_dt TIMESTAMPTZ,
    crnt_ind SMALLINT,
    vrsn_num DECIMAL(3,2),
    plcy_area_type_cd INTEGER,
    updtd_dt TIMESTAMPTZ
);
