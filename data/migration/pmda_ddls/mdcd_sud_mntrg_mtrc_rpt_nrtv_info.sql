CREATE TABLE legacy_pmda_raw.mdcd_sud_mntrg_mtrc_rpt_nrtv_info (
    mdcd_sud_mntrg_mtrc_rpt_nrtv_info_id INTEGER,
    mdcd_sud_mntrg_mtrc_rpt_id INTEGER,
    sect_num VARCHAR(24),
    no_updt_ind SMALLINT,
    rltd_mtrc_txt VARCHAR(4096),
    rspns_txt VARCHAR(4096),
    creatd_dt TIMESTAMPTZ,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_dt TIMESTAMPTZ,
    dltd_user_id INTEGER
);
