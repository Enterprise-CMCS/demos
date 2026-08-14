CREATE TABLE legacy_pmda_raw.mdcd_frqnt_ask_qstn (
    mdcd_frqnt_ask_qstn_id INTEGER,
    mdcd_frqnt_ask_qstn_sect_rfrnc_id INTEGER,
    mdcd_frqnt_ask_qstn_sect_qstn_txt VARCHAR(2048),
    mdcd_frqnt_ask_qstn_sect_aswr_txt VARCHAR(2048),
    dsply_sqnc_num SMALLINT,
    creatd_dt TIMESTAMP,
    creatd_user_id INTEGER,
    dltd_ind SMALLINT,
    dltd_user_id INTEGER,
    dltd_dt TIMESTAMP,
    updtd_user_id INTEGER,
    updtd_dt TIMESTAMP
);
