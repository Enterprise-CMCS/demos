-- Purpose: Orphan-pending duplicate medicaid_id groups (MySQL 8.0 dialect), a
--   read-only Workbench probe against "PMDA Prod MySQL". Mirrors the loader
--   scope (stg/10,11_filter_* + stg/23_pendg_demo_fold: orphan_loadable) and the
--   RED-4 winner rule: among duplicates the region-suffix-correct row wins
--   (lowest legacy mdcd_pendg_demo_id breaks a tie). A group matching NO member's
--   state region is held ENTIRELY and gates parity RED (region_incorrect_duplicate)
--   -- there is no lowest-id fallback. Below, region_rank=0 marks a region-correct
--   row: a group with no region_rank=0 member is a gating region-incorrect group;
--   otherwise rn=1 is the winner (loads) and rn>1 is held.
-- Refs: sql/20_app/31_pending_demonstration.sql;
--   sql/99_parity/04_pending_approved.sql;
--   reports/narrative/pending_approved_decisions.md (D2).
WITH region(state_id, region) AS (
  SELECT 'CT',1 UNION ALL SELECT 'MA',1 UNION ALL SELECT 'ME',1 UNION ALL SELECT 'NH',1
  UNION ALL SELECT 'RI',1 UNION ALL SELECT 'VT',1
  UNION ALL SELECT 'NJ',2 UNION ALL SELECT 'NY',2 UNION ALL SELECT 'PR',2 UNION ALL SELECT 'VI',2
  UNION ALL SELECT 'DE',3 UNION ALL SELECT 'DC',3 UNION ALL SELECT 'MD',3 UNION ALL SELECT 'PA',3
  UNION ALL SELECT 'VA',3 UNION ALL SELECT 'WV',3
  UNION ALL SELECT 'AL',4 UNION ALL SELECT 'FL',4 UNION ALL SELECT 'GA',4 UNION ALL SELECT 'KY',4
  UNION ALL SELECT 'MS',4 UNION ALL SELECT 'NC',4 UNION ALL SELECT 'SC',4 UNION ALL SELECT 'TN',4
  UNION ALL SELECT 'IL',5 UNION ALL SELECT 'IN',5 UNION ALL SELECT 'MI',5 UNION ALL SELECT 'MN',5
  UNION ALL SELECT 'OH',5 UNION ALL SELECT 'WI',5
  UNION ALL SELECT 'AR',6 UNION ALL SELECT 'LA',6 UNION ALL SELECT 'NM',6 UNION ALL SELECT 'OK',6
  UNION ALL SELECT 'TX',6
  UNION ALL SELECT 'IA',7 UNION ALL SELECT 'KS',7 UNION ALL SELECT 'MO',7 UNION ALL SELECT 'NE',7
  UNION ALL SELECT 'CO',8 UNION ALL SELECT 'MT',8 UNION ALL SELECT 'ND',8 UNION ALL SELECT 'SD',8
  UNION ALL SELECT 'UT',8 UNION ALL SELECT 'WY',8
  UNION ALL SELECT 'AZ',9 UNION ALL SELECT 'CA',9 UNION ALL SELECT 'HI',9 UNION ALL SELECT 'NV',9
  UNION ALL SELECT 'AS',9 UNION ALL SELECT 'GU',9 UNION ALL SELECT 'MP',9
  UNION ALL SELECT 'AK',10 UNION ALL SELECT 'ID',10 UNION ALL SELECT 'OR',10 UNION ALL SELECT 'WA',10
),
valid_appr AS (
  SELECT DISTINCT TRIM(mdcd_demo_num) AS num
  FROM mdcd_demo
  WHERE mdcd_demo_num REGEXP '^11-W-[0-9]{5}/(10|[1-9])$'
    AND (geo_ansi_state_cd IS NULL OR geo_ansi_state_cd REGEXP '^[A-Z]{2}$')
    AND creatd_dt IS NOT NULL
    AND (state_prfmnc_yr_strt_dt IS NULL
         OR YEAR(state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
),
orphan AS (
  SELECT
    p.mdcd_pendg_demo_id AS legacy_id,
    TRIM(p.mdcd_demo_num) AS medicaid_id,
    p.geo_ansi_state_cd   AS state_id,
    p.creatd_dt
  FROM mdcd_pendg_demo p
  WHERE (p.dltd_ind IS NULL OR p.dltd_ind <> 1)
    AND p.mdcd_demo_num IS NOT NULL AND TRIM(p.mdcd_demo_num) <> ''
    AND p.mdcd_demo_num REGEXP '^11-W-[0-9]{5}/(10|[1-9])$'
    AND (p.geo_ansi_state_cd IS NULL OR p.geo_ansi_state_cd REGEXP '^[A-Z]{2}$')
    AND p.creatd_dt IS NOT NULL
    AND (p.state_prfmnc_yr_strt_dt IS NULL
         OR YEAR(p.state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
    AND TRIM(p.mdcd_demo_num) NOT IN (SELECT num FROM valid_appr)
),
dups AS (
  SELECT medicaid_id FROM orphan GROUP BY medicaid_id HAVING COUNT(*) > 1
),
enriched AS (
  SELECT
    o.medicaid_id,
    o.legacy_id,
    o.state_id,
    r.region,
    REGEXP_SUBSTR(o.medicaid_id, '[0-9]+$') AS suffix,
    CASE WHEN CAST(REGEXP_SUBSTR(o.medicaid_id, '[0-9]+$') AS UNSIGNED) = r.region
           OR (REGEXP_SUBSTR(o.medicaid_id, '[0-9]+$') = '0' AND r.region = 10)
         THEN 0 ELSE 1 END AS region_rank,
    o.creatd_dt
  FROM orphan o
  JOIN dups d ON d.medicaid_id = o.medicaid_id
  LEFT JOIN region r ON r.state_id = o.state_id
)
SELECT
  medicaid_id, legacy_id, state_id, region, suffix, region_rank,
  ROW_NUMBER() OVER (PARTITION BY medicaid_id ORDER BY region_rank, legacy_id) AS rn,
  creatd_dt
FROM enriched
ORDER BY medicaid_id, region_rank, legacy_id;

-- ---------------------------------------------------------------------------
-- Query 2: plain enumeration of the duplicate groups (no winner-rule columns).
-- One row per shared project number, with all member ids + states listed.
-- Reuses the same orphan scope as Query 1 (re-declared so this runs standalone).
-- ---------------------------------------------------------------------------
WITH valid_appr AS (
  SELECT DISTINCT TRIM(mdcd_demo_num) AS num
  FROM mdcd_demo
  WHERE mdcd_demo_num REGEXP '^11-W-[0-9]{5}/(10|[1-9])$'
    AND (geo_ansi_state_cd IS NULL OR geo_ansi_state_cd REGEXP '^[A-Z]{2}$')
    AND creatd_dt IS NOT NULL
    AND (state_prfmnc_yr_strt_dt IS NULL
         OR YEAR(state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
),
orphan AS (
  SELECT
    p.mdcd_pendg_demo_id AS legacy_id,
    TRIM(p.mdcd_demo_num) AS medicaid_id,
    p.geo_ansi_state_cd   AS state_id
  FROM mdcd_pendg_demo p
  WHERE (p.dltd_ind IS NULL OR p.dltd_ind <> 1)
    AND p.mdcd_demo_num IS NOT NULL AND TRIM(p.mdcd_demo_num) <> ''
    AND p.mdcd_demo_num REGEXP '^11-W-[0-9]{5}/(10|[1-9])$'
    AND (p.geo_ansi_state_cd IS NULL OR p.geo_ansi_state_cd REGEXP '^[A-Z]{2}$')
    AND p.creatd_dt IS NOT NULL
    AND (p.state_prfmnc_yr_strt_dt IS NULL
         OR YEAR(p.state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
    AND TRIM(p.mdcd_demo_num) NOT IN (SELECT num FROM valid_appr)
)
SELECT
  medicaid_id,
  COUNT(*) AS n_rows,
  GROUP_CONCAT(legacy_id ORDER BY legacy_id SEPARATOR ', ')                         AS pendg_demo_ids,
  GROUP_CONCAT(CONCAT(legacy_id, ':', COALESCE(state_id, '?')) ORDER BY legacy_id SEPARATOR ', ') AS id_state_pairs
FROM orphan
GROUP BY medicaid_id
HAVING COUNT(*) > 1
ORDER BY n_rows DESC, medicaid_id;
