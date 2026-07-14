CREATE TABLE legacy_pmda_raw.v_demo_mgmt_mrt_demo_types (
    mdcd_demo_type_cd VARCHAR(5),
    mdcd_demo_type_name VARCHAR(100),
    dsply_sqnc_num SMALLINT,
    creatd_dt TIMESTAMPTZ,
    mdcd_demo_id INTEGER,
    prtcl_ind SMALLINT,
    prtcl_strt_dt DATE,
    mtrc_ind SMALLINT,
    mtrc_strt_dt DATE,
    rptg_tool_ind SMALLINT,
    rptg_tool_strt_dt DATE
);
