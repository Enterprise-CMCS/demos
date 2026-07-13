/*
 * Purpose:    Consolidate the legacy BN workbook machinery into the nested validation_data object and load it into the migration-private parity oracle.
 * Inputs:     mysql_raw.mdcd_dlvrbl_fil_doc, mysql_raw.bdgt_ntrlty_mmbr_mo_actl, mysql_raw.bdgt_ntrlty_mmbr_mo_prjtd, mysql_raw.bdgt_ntrlty_wth_wvr_spnd_prjtd_cst, mysql_raw.bdgt_ntrlty_mdcd_elgblty_grp, mysql_raw.bdgt_ntrlty_demo_yr, stg._valid_demo_ids, migration._id_map_mdcd_dlvrbl_fil_doc
 * Outputs:    INSERT INTO migration._id_map_mdcd_dlvrbl_fil_doc (ON CONFLICT DO NOTHING); TRUNCATE + INSERT INTO migration.bn_workbook_detail
 * Invariants: source-only (mysql_raw + migration + stg); idempotent (id map ON CONFLICT DO NOTHING; bn_workbook_detail rebuilt via TRUNCATE+INSERT on a fixed snapshot); soft-delete exclusion (dltd_ind); parity oracle only, NOT the live demos_app.budget_neutrality_workbook.validation_data; v1 materializes the high-confidence joins only.
 * Refs:       reports/jsonb_schemas/budget_neutrality.schema.json, reports/narrative/bn_source_enumeration.md, docs/spec/canonical-spec.adoc
 *
 * Budget-neutrality parity aggregate.
 *
 * Consolidates the legacy MySQL bdgt_ntrlty_* machinery (one BN workbook ==
 * one mdcd_dlvrbl_fil_doc row with bdgt_ntrlty_fil_ind = 1) into the nested
 * object described by reports/jsonb_schemas/budget_neutrality.schema.json and
 * loads it into migration.bn_workbook_detail. That table's constraint trigger
 * (sql/01_ddl_supplements/10_bn_workbook_detail.sql) validates each row, so
 * this is the migration-private PARITY ORACLE -- it is NOT the live
 * demos_app.budget_neutrality_workbook.validation_data column, which DEMOS
 * owns and writes as a ValidationError[] array (migrated workbooks load there
 * as 'Pending' / '{}'; see docs/spec/canonical-spec.adoc workstream I).
 *
 * Source enumeration, mapping, and deferred enrichments (actual
 * expenditures, by_month, waivers, spending_limits, summary) are documented
 * in reports/narrative/bn_source_enumeration.md. This v1 materializes the
 * high-confidence joins only (member-months + projected with-waiver spend);
 * every other schema property is optional, so the aggregate stays valid.
 *
 * Runs in the build phase after the 10_stg filter views and the 05_id_maps
 * tables. Idempotent on a fixed mysql_raw snapshot.
 */
SET search_path TO stg, migration, mysql_raw, public;

-- Mint a stable uuid per PMDA-valid BN workbook file. ON CONFLICT DO NOTHING
-- keeps the uuid stable across rebuilds (the 20_app loader reuses this map).
INSERT INTO migration._id_map_mdcd_dlvrbl_fil_doc(legacy_int_id)
SELECT
  f.mdcd_dlvrbl_fil_doc_id
FROM
  mysql_raw.mdcd_dlvrbl_fil_doc f
  JOIN stg._valid_demo_ids v ON v.demo_id = f.mdcd_demo_id
WHERE
  f.bdgt_ntrlty_fil_ind = 1
  AND COALESCE(f.dltd_ind, 0) = 0
ON CONFLICT
  DO NOTHING;

-- Rebuild the aggregate from scratch (migration-private; TRUNCATE does not
-- fire the row-level constraint trigger).
TRUNCATE TABLE migration.bn_workbook_detail;

WITH bn_files AS (
  SELECT
    f.mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    m.new_uuid AS workbook_id,
    NULLIF(btrim(COALESCE(f.dlvrbl_fil_name, f.doc_name)), '') AS workbook_origin
  FROM
    mysql_raw.mdcd_dlvrbl_fil_doc f
    JOIN stg._valid_demo_ids v ON v.demo_id = f.mdcd_demo_id
    JOIN migration._id_map_mdcd_dlvrbl_fil_doc m ON m.legacy_int_id = f.mdcd_dlvrbl_fil_doc_id
  WHERE
    f.bdgt_ntrlty_fil_ind = 1
    AND COALESCE(f.dltd_ind, 0) = 0
),
actl AS (
  SELECT
    mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    bdgt_ntrlty_demo_yr_id AS demo_yr_id,
    bdgt_ntrlty_mdcd_elgblty_grp_id AS grp_id,
    SUM(mmbr_mo_actl_val_num) AS member_months
  FROM
    mysql_raw.bdgt_ntrlty_mmbr_mo_actl
  WHERE
    COALESCE(dltd_ind, 0) = 0
  GROUP BY
    1,
    2,
    3
),
prjtd AS (
  SELECT
    mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    bdgt_ntrlty_demo_yr_id AS demo_yr_id,
    bdgt_ntrlty_mdcd_elgblty_grp_id AS grp_id,
    SUM(mmbr_mo_prjtd_val_num) AS member_months
  FROM
    mysql_raw.bdgt_ntrlty_mmbr_mo_prjtd
  WHERE
    COALESCE(dltd_ind, 0) = 0
  GROUP BY
    1,
    2,
    3
),
exp AS (
  SELECT
    mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    bdgt_ntrlty_demo_yr_id AS demo_yr_id,
    bdgt_ntrlty_mdcd_elgblty_grp_id AS grp_id,
    SUM(wth_wvr_spnd_prjtd_val_num) AS expenditures
  FROM
    mysql_raw.bdgt_ntrlty_wth_wvr_spnd_prjtd_cst
  WHERE
    COALESCE(dltd_ind, 0) = 0
  GROUP BY
    1,
    2,
    3
),
grp_keys AS (
  SELECT
    fil_doc_id,
    demo_yr_id,
    grp_id
  FROM
    actl
  UNION
  SELECT
    fil_doc_id,
    demo_yr_id,
    grp_id
  FROM
    prjtd
  UNION
  SELECT
    fil_doc_id,
    demo_yr_id,
    grp_id
  FROM
    exp
),
eg AS (
  SELECT
    k.fil_doc_id,
    k.demo_yr_id,
    k.grp_id,
    g.bdgt_ntrlty_mdcd_elgblty_grp_name AS grp_name,
    a.member_months AS actl_mm,
    p.member_months AS prjtd_mm,
    e.expenditures AS prjtd_exp
  FROM
    grp_keys k
    LEFT JOIN actl a USING (fil_doc_id, demo_yr_id, grp_id)
    LEFT JOIN prjtd p USING (fil_doc_id, demo_yr_id, grp_id)
    LEFT JOIN exp e USING (fil_doc_id, demo_yr_id, grp_id)
    LEFT JOIN mysql_raw.bdgt_ntrlty_mdcd_elgblty_grp g ON g.bdgt_ntrlty_mdcd_elgblty_grp_id = k.grp_id
    -- Exclude soft-deleted eligibility groups (CODE_REVIEW M-SQL1). A NULL g
    -- (fact references no dimension row) coalesces to 0 and is kept.
  WHERE
    COALESCE(g.dltd_ind, 0) = 0
),
eg_json AS (
  SELECT
    fil_doc_id,
    demo_yr_id,
    jsonb_agg(jsonb_strip_nulls(jsonb_build_object('mdcd_elgblty_grp_id', grp_id, 'elgblty_grp_name', grp_name, 'actuals', jsonb_strip_nulls(jsonb_build_object('member_months', actl_mm)), 'projected', jsonb_strip_nulls(jsonb_build_object('member_months', prjtd_mm, 'expenditures', prjtd_exp))))
    ORDER BY grp_id) AS eligibility_groups
FROM
  eg
GROUP BY
  fil_doc_id,
  demo_yr_id
),
dy_json AS (
  SELECT
    ej.fil_doc_id,
    jsonb_agg(jsonb_strip_nulls(jsonb_build_object('demo_yr_id', ej.demo_yr_id, 'demo_yr_num', dy.sqnc_num, 'begin_dt', to_char(dy.demo_yr_strt_dt, 'YYYY-MM-DD'), 'end_dt', to_char(dy.demo_yr_end_dt, 'YYYY-MM-DD'), 'eligibility_groups', ej.eligibility_groups))
    ORDER BY dy.sqnc_num, ej.demo_yr_id) AS demo_years
FROM
  eg_json ej
  JOIN mysql_raw.bdgt_ntrlty_demo_yr dy ON dy.bdgt_ntrlty_demo_yr_id = ej.demo_yr_id
  -- Exclude soft-deleted demo years (CODE_REVIEW M-SQL1). Replaces the dead
  -- `sqnc_num IS NOT NULL` guard (the source column is NOT NULL).
  WHERE
    COALESCE(dy.dltd_ind, 0) = 0
  GROUP BY
    ej.fil_doc_id)
  INSERT INTO migration.bn_workbook_detail(workbook_id, validation_data)
  SELECT
    b.workbook_id,
    jsonb_strip_nulls(jsonb_build_object('version', '1.0', 'workbook_origin', b.workbook_origin, 'demo_years', COALESCE(d.demo_years, '[]'::jsonb)))
  FROM
    bn_files b
  LEFT JOIN dy_json d ON d.fil_doc_id = b.fil_doc_id;

