/*
 * Purpose:    Build the row-level allowlist of valid application ids, cascading from both the approved- and pending-demo filters.
 * Inputs:     mysql_raw.mdcd_demo_aplctn, stg._valid_demo_ids, stg._valid_pendg_demo_ids, stg._keep_ids, stg._drop_ids
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_aplctn_ids
 * Invariants: source-only (no crosswalks/seeds); dual parentage (keep when EITHER parent survives, drop only when neither does); fail-closed created-date rule; force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on the application anchor
 * `mysql_raw.mdcd_demo_aplctn` -> stg._valid_aplctn_ids.
 *
 * Applications carry BOTH parent keys (mdcd_demo_id for approved demos,
 * mdcd_pendg_demo_id for pending demos); there is no separate pending
 * application table. A row survives iff at least one of its parents
 * survives stg._valid_demo_ids / stg._valid_pendg_demo_ids, so junk
 * demonstrations cascade out automatically (same shape as 13/14).
 *
 * The real table has no project-number or state column, so there is no
 * format rule here; validation is created-date sanity plus the parent
 * cascade. The public output column is aliased to aplctn_id for a stable
 * contract.
 */
SET search_path TO stg, mysql_raw, public;

-- Column names verified against reports/schema_snapshot/columns.csv:
--   PK = mdcd_demo_aplctn_id, parents = mdcd_demo_id / mdcd_pendg_demo_id,
--   created = creatd_dt, status date = mdcd_demo_aplctn_stus_dt.
CREATE OR REPLACE VIEW stg._valid_aplctn_ids AS
WITH bad_dates AS (
  SELECT
    mdcd_demo_aplctn_id AS aplctn_id
  FROM
    mysql_raw.mdcd_demo_aplctn
  WHERE
    creatd_dt IS NULL
    OR (mdcd_demo_aplctn_stus_dt IS NOT NULL
      AND (extract(year FROM mdcd_demo_aplctn_stus_dt) < 1990
        OR extract(year FROM mdcd_demo_aplctn_stus_dt) > 2099))
),
bad_parent AS (
  -- Dual parentage: keep the row when EITHER the approved-demo parent or
  -- the pending-demo parent survives its filter. Drop only when neither does.
  SELECT
    a.mdcd_demo_aplctn_id AS aplctn_id
  FROM
    mysql_raw.mdcd_demo_aplctn a
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        stg._valid_demo_ids v
      WHERE
        v.demo_id = a.mdcd_demo_id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          stg._valid_pendg_demo_ids p
        WHERE
          p.demo_id = a.mdcd_pendg_demo_id)
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS aplctn_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_demo_aplctn'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_demo_aplctn s
      WHERE
        s.mdcd_demo_aplctn_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS aplctn_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_demo_aplctn'
)
SELECT
  aplctn_id
FROM (
  SELECT
    mdcd_demo_aplctn_id AS aplctn_id
  FROM
    mysql_raw.mdcd_demo_aplctn
  EXCEPT
  SELECT
    aplctn_id
  FROM
    bad_dates
  EXCEPT
  SELECT
    aplctn_id
  FROM
    bad_parent
  UNION
  SELECT
    aplctn_id
  FROM
    keep) v
WHERE
  aplctn_id NOT IN (
    SELECT
      aplctn_id
    FROM
      drop_ids);

