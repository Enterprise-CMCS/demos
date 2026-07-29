/*
 * Purpose:    Build the violations view (one row per entity/legacy_id/failed_rule) that feeds the per-run filter report.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.mdcd_pendg_demo, mysql_raw.mdcd_demo_aplctn, mysql_raw.mdcd_demo_cntct, mysql_raw.mdcd_pendg_demo_cntct, mysql_raw.users, migration.normalize_medicaid_id
 * Outputs:    CREATE OR REPLACE VIEW stg._filter_violations
 * Invariants: source-only (no crosswalks/seeds); must stay in lockstep with the per-anchor filters (10-17) -- the project-number rules call the SAME migration.normalize_medicaid_id the filters call, never a re-spelled regex, and tests/sql/test_filter_report_lockstep.py enforces set equality; severity = 'auto-drop' when value matches "test" else 'review-required'; parent-cascade exclusions intentionally not reported; output columns (entity, legacy_id, failed_rule, source_value, severity) are a contract consumed by migration/phases/build.py.
 * Refs:       -
 *
 * Violations view feeding the per-run filter report.
 *
 * One row per (entity, legacy_id, failed_rule) for every row that violates
 * any allowlist regex on any anchor. The build phase queries this view,
 * joins to stg._keep_ids / stg._drop_ids, and writes the markdown report
 * to reports/runs/filter_<stamp>.md.
 *
 * Severity classification on project-number rules:
 *   'auto-drop'        -- value contains the substring "test"
 *                         (case-insensitive). Silently excluded; the SME
 *                         only sees these in the dedicated section of
 *                         the report if they go looking.
 *   'review-required'  -- everything else that migration.normalize_medicaid_id
 *                         cannot rescue into the canonical 11-W-NNNNN/R form
 *                         (including NULL where the field is required).
 *                         Surfaces at the top of the report for SME triage.
 *
 * Other rules (state code, dates, email, user-name) carry
 * severity='review-required' for now; future refinement can split them.
 *
 * This file must stay in lockstep with the per-anchor filter files
 * (10-17): every column rule a filter applies is reported here, keyed by
 * the same legacy id the filter and keep/drop overrides use, and expressed
 * by CALLING the same predicate rather than restating it. A re-spelled regex
 * is how the two drifted before: the filters moved to
 * migration.normalize_medicaid_id while this view kept the raw canonical
 * regex, so the report named rows as excluded that in fact loaded.
 * tests/sql/test_filter_report_lockstep.py asserts the set equality directly. The
 * parent-cascade exclusions are structural, not format violations, so
 * they are intentionally not reported. The output columns
 * (entity, legacy_id, failed_rule, source_value, severity) are a contract
 * consumed by migration/phases/build.py.
 */
SET search_path TO stg, mysql_raw, public;

CREATE OR REPLACE VIEW stg._filter_violations AS
-- mdcd_demo: required canonical project number; auto-drop "test" rows.
SELECT
  'mdcd_demo'::text AS entity,
  d.mdcd_demo_id::bigint AS legacy_id,
  'mdcd_demo_num ~* test (auto-drop)'::text AS failed_rule,
  left(d.mdcd_demo_num,
    120) AS source_value,
  'auto-drop'::text AS severity
FROM
  mysql_raw.mdcd_demo d
WHERE
  d.mdcd_demo_num ~* 'test'
UNION ALL
SELECT
  'mdcd_demo',
  d.mdcd_demo_id::bigint,
  'mdcd_demo_num not normalizable to 11-W-NNNNN/R',
  left(coalesce(d.mdcd_demo_num, '<null>'),
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo d
  -- Same predicate as the bad_prjct_nbr CTE in 10_filter_demo.sql, so a row
  -- reported here is exactly a row the filter excludes. Using the raw canonical
  -- regex instead over-reports every value the helper rescues (18 rows in the
  -- 2026-07 source: strip-and-reassemble cases plus the region-10 bare-0 spelling).
WHERE
  migration.normalize_medicaid_id(d.mdcd_demo_num) IS NULL
  AND (d.mdcd_demo_num IS NULL
    OR d.mdcd_demo_num !~* 'test')
UNION ALL
SELECT
  'mdcd_demo',
  d.mdcd_demo_id::bigint,
  'geo_ansi_state_cd !~ ^[A-Z]{2}$',
  left(d.geo_ansi_state_cd,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo d
WHERE
  d.geo_ansi_state_cd IS NOT NULL
  AND d.geo_ansi_state_cd !~ '^[A-Z]{2}$'
UNION ALL
SELECT
  'mdcd_demo',
  d.mdcd_demo_id::bigint,
  'creatd_dt null or state_prfmnc_yr_strt_dt out of [1990,2099]',
  left(coalesce(d.creatd_dt::text, '<null>') || ' / ' || coalesce(d.state_prfmnc_yr_strt_dt::text, '<null>'),
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo d
WHERE
  d.creatd_dt IS NULL
  OR (d.state_prfmnc_yr_strt_dt IS NOT NULL
    AND (extract(year FROM d.state_prfmnc_yr_strt_dt) < 1990
      OR extract(year FROM d.state_prfmnc_yr_strt_dt) > 2099))
  -- mdcd_pendg_demo: optional canonical project number; auto-drop "test".
UNION ALL
SELECT
  'mdcd_pendg_demo',
  p.mdcd_pendg_demo_id::bigint,
  'mdcd_demo_num ~* test (auto-drop)',
  left(p.mdcd_demo_num,
    120),
  'auto-drop'
FROM
  mysql_raw.mdcd_pendg_demo p
WHERE
  p.mdcd_demo_num ~* 'test'
UNION ALL
SELECT
  'mdcd_pendg_demo',
  p.mdcd_pendg_demo_id::bigint,
  'mdcd_demo_num not normalizable to 11-W-NNNNN/R',
  left(p.mdcd_demo_num,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_pendg_demo p
  -- Same predicate as the bad_prjct_nbr CTE in 11_filter_pendg_demo.sql
  -- (project number optional on the pending anchor).
WHERE
  p.mdcd_demo_num IS NOT NULL
  AND migration.normalize_medicaid_id(p.mdcd_demo_num) IS NULL
  AND p.mdcd_demo_num !~* 'test'
UNION ALL
SELECT
  'mdcd_pendg_demo',
  p.mdcd_pendg_demo_id::bigint,
  'geo_ansi_state_cd !~ ^[A-Z]{2}$',
  left(p.geo_ansi_state_cd,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_pendg_demo p
WHERE
  p.geo_ansi_state_cd IS NOT NULL
  AND p.geo_ansi_state_cd !~ '^[A-Z]{2}$'
UNION ALL
SELECT
  'mdcd_pendg_demo',
  p.mdcd_pendg_demo_id::bigint,
  'creatd_dt null or state_prfmnc_yr_strt_dt out of [1990,2099]',
  left(coalesce(p.creatd_dt::text, '<null>') || ' / ' || coalesce(p.state_prfmnc_yr_strt_dt::text, '<null>'),
    120),
  'review-required'
FROM
  mysql_raw.mdcd_pendg_demo p
WHERE
  p.creatd_dt IS NULL
  OR (p.state_prfmnc_yr_strt_dt IS NOT NULL
    AND (extract(year FROM p.state_prfmnc_yr_strt_dt) < 1990
      OR extract(year FROM p.state_prfmnc_yr_strt_dt) > 2099))
  -- mdcd_demo_aplctn: no project-number/state columns exist; created-date sanity.
UNION ALL
SELECT
  'mdcd_demo_aplctn',
  a.mdcd_demo_aplctn_id::bigint,
  'creatd_dt null or mdcd_demo_aplctn_stus_dt out of [1990,2099]',
  left(coalesce(a.creatd_dt::text, '<null>') || ' / ' || coalesce(a.mdcd_demo_aplctn_stus_dt::text, '<null>'),
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo_aplctn a
WHERE
  a.creatd_dt IS NULL
  OR (a.mdcd_demo_aplctn_stus_dt IS NOT NULL
    AND (extract(year FROM a.mdcd_demo_aplctn_stus_dt) < 1990
      OR extract(year FROM a.mdcd_demo_aplctn_stus_dt) > 2099))
  -- mdcd_demo_cntct: one row per demo with role-specific emails (demo grain).
UNION ALL
SELECT
  'mdcd_demo_cntct',
  c.mdcd_demo_id::bigint,
  'state_mdcd_drctr_email_adr !~ email pattern',
  left(c.state_mdcd_drctr_email_adr,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo_cntct c
WHERE
  c.state_mdcd_drctr_email_adr IS NOT NULL
  AND c.state_mdcd_drctr_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
UNION ALL
SELECT
  'mdcd_demo_cntct',
  c.mdcd_demo_id::bigint,
  'ro_fincl_lead_email_adr !~ email pattern',
  left(c.ro_fincl_lead_email_adr,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo_cntct c
WHERE
  c.ro_fincl_lead_email_adr IS NOT NULL
  AND c.ro_fincl_lead_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
UNION ALL
SELECT
  'mdcd_demo_cntct',
  c.mdcd_demo_id::bigint,
  'sota_email_adr !~ email pattern',
  left(c.sota_email_adr,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo_cntct c
WHERE
  c.sota_email_adr IS NOT NULL
  AND c.sota_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
UNION ALL
SELECT
  'mdcd_demo_cntct',
  c.mdcd_demo_id::bigint,
  'ro_state_lead_email_adr !~ email pattern',
  left(c.ro_state_lead_email_adr,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_demo_cntct c
WHERE
  c.ro_state_lead_email_adr IS NOT NULL
  AND c.ro_state_lead_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  -- mdcd_pendg_demo_cntct: state-director email only (pending grain).
UNION ALL
SELECT
  'mdcd_pendg_demo_cntct',
  c.mdcd_pendg_demo_id::bigint,
  'state_mdcd_drctr_email_adr !~ email pattern',
  left(c.state_mdcd_drctr_email_adr,
    120),
  'review-required'
FROM
  mysql_raw.mdcd_pendg_demo_cntct c
WHERE
  c.state_mdcd_drctr_email_adr IS NOT NULL
  AND c.state_mdcd_drctr_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  -- users: username + email patterns (mirrors 17_filter_user).
UNION ALL
SELECT
  'users',
  u.id::bigint,
  'username null or matches test/qa/svc pattern',
  left(u.username,
    120),
  'review-required'
FROM
  mysql_raw.users u
WHERE
  u.username IS NULL
  OR u.username ~* '^(test|qa|svc_|dummy|placeholder)'
  OR u.username ~* '\m(test|tst|qa|sandbox|dummy)\M'
UNION ALL
SELECT
  'users',
  u.id::bigint,
  'email !~ email pattern',
  left(u.email,
    120),
  'review-required'
FROM
  mysql_raw.users u
WHERE
  u.email IS NOT NULL
  AND u.email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$';

