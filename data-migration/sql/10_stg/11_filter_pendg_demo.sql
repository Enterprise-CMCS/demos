/*
 * Purpose:    Build the row-level allowlist of valid pending-demonstration ids (lifecycle-aware: project number optional).
 * Inputs:     mysql_raw.mdcd_pendg_demo, stg._keep_ids, stg._drop_ids, migration.normalize_medicaid_id
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_pendg_demo_ids
 * Invariants: source-only (no crosswalks/seeds); fail-closed rules; project number optional on pending (only non-normalizable non-null values flagged); the project-number rule calls migration.normalize_medicaid_id, the same helper the approved anchor and the fold key use, so the two anchors never disagree about which numbers are rescuable; force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on the pending demonstration anchor
 * `mysql_raw.mdcd_pendg_demo`.
 *
 * Same shape as 00_filter_demo.sql but lifecycle-aware: project number is
 * optional here (pending rows may not yet have one assigned).
 */
SET search_path TO stg, mysql_raw, public;

-- Column names verified against reports/schema_snapshot/columns.csv:
--   PK = mdcd_pendg_demo_id, project number = mdcd_demo_num (nullable on
--   pending), state = geo_ansi_state_cd, created = creatd_dt,
--   performance-year start = state_prfmnc_yr_strt_dt.
-- The public output column is aliased to demo_id for a stable contract.
CREATE OR REPLACE VIEW stg._valid_pendg_demo_ids AS
WITH bad_prjct_nbr AS (
  -- CMS canonical: 11-W-NNNNN/R, where N is a single digit (5 digits
  -- total) and R is the HHS regional office number 1-10. Optional on
  -- pending; only flag malformed non-null values. Rows whose
  -- mdcd_demo_num contains "test" are auto-dropped silently;
  -- non-test rows that fail even after reassembly are flagged for SME
  -- review (see 99_filter_report.sql).
  --
  -- migration.normalize_medicaid_id is the SAME helper the approved anchor
  -- (10_filter_demo.sql) and the fold key (23_pendg_demo_fold.sql) use. The
  -- pending anchor must not apply a stricter rule than the approved one:
  -- otherwise a pending row whose number the approved side would rescue is
  -- dropped here and can never fold into its approved counterpart, and the two
  -- anchors emit demonstration.medicaid_id in two different shapes.
  SELECT
    mdcd_pendg_demo_id AS demo_id
  FROM
    mysql_raw.mdcd_pendg_demo
  WHERE
    mdcd_demo_num IS NOT NULL
    AND migration.normalize_medicaid_id(mdcd_demo_num) IS NULL
),
bad_state_cd AS (
  SELECT
    mdcd_pendg_demo_id AS demo_id
  FROM
    mysql_raw.mdcd_pendg_demo
  WHERE
    geo_ansi_state_cd IS NOT NULL
    AND geo_ansi_state_cd !~ '^[A-Z]{2}$'
),
bad_dates AS (
  SELECT
    mdcd_pendg_demo_id AS demo_id
  FROM
    mysql_raw.mdcd_pendg_demo
  WHERE
    creatd_dt IS NULL
    OR (state_prfmnc_yr_strt_dt IS NOT NULL
      AND (extract(year FROM state_prfmnc_yr_strt_dt) < 1990
        OR extract(year FROM state_prfmnc_yr_strt_dt) > 2099))
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS demo_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_pendg_demo'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_pendg_demo s
      WHERE
        s.mdcd_pendg_demo_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS demo_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_pendg_demo'
)
SELECT
  demo_id
FROM (
  SELECT
    mdcd_pendg_demo_id AS demo_id
  FROM
    mysql_raw.mdcd_pendg_demo
  EXCEPT
  SELECT
    demo_id
  FROM
    bad_prjct_nbr
  EXCEPT
  SELECT
    demo_id
  FROM
    bad_state_cd
  EXCEPT
  SELECT
    demo_id
  FROM
    bad_dates
  UNION
  SELECT
    demo_id
  FROM
    keep) v
WHERE
  demo_id NOT IN (
    SELECT
      demo_id
    FROM
      drop_ids);

