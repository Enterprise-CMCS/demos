/*
 * Purpose:    Build the row-level allowlist of valid renewal ids, cascading from both the approved- and pending-demo filters.
 * Inputs:     mysql_raw.mdcd_demo_rnwl, stg._valid_demo_ids, stg._valid_pendg_demo_ids, stg._keep_ids, stg._drop_ids
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_rnwl_ids
 * Invariants: source-only (no crosswalks/seeds); dual parentage (keep when EITHER parent survives, drop only when neither does); fail-closed created-date rule; force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on the renewal (DEMOS "extension") anchor
 * `mysql_raw.mdcd_demo_rnwl` -> stg._valid_rnwl_ids.
 *
 * Renewals carry BOTH parent keys (mdcd_demo_id for approved demos,
 * mdcd_pendg_demo_id for pending demos); there is no separate pending
 * renewal table. A row survives iff at least one of its parents survives
 * stg._valid_demo_ids / stg._valid_pendg_demo_ids.
 *
 * The public output column is aliased to rnwl_id for a stable contract.
 */
SET search_path TO stg, mysql_raw, public;

CREATE OR REPLACE VIEW stg._valid_rnwl_ids AS
WITH bad_dates AS (
  SELECT
    mdcd_demo_rnwl_id AS rnwl_id
  FROM
    mysql_raw.mdcd_demo_rnwl
  WHERE
    creatd_dt IS NULL
    OR (rnwl_aplctn_dt IS NOT NULL
      AND (extract(year FROM rnwl_aplctn_dt) < 1990
        OR extract(year FROM rnwl_aplctn_dt) > 2099))
),
bad_parent AS (
  -- Dual parentage: keep the row when EITHER the approved-demo parent or
  -- the pending-demo parent survives its filter. Drop only when neither does.
  SELECT
    r.mdcd_demo_rnwl_id AS rnwl_id
  FROM
    mysql_raw.mdcd_demo_rnwl r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        stg._valid_demo_ids v
      WHERE
        v.demo_id = r.mdcd_demo_id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          stg._valid_pendg_demo_ids p
        WHERE
          p.demo_id = r.mdcd_pendg_demo_id)
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS rnwl_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_demo_rnwl'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_demo_rnwl s
      WHERE
        s.mdcd_demo_rnwl_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS rnwl_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_demo_rnwl'
)
SELECT
  rnwl_id
FROM (
  SELECT
    mdcd_demo_rnwl_id AS rnwl_id
  FROM
    mysql_raw.mdcd_demo_rnwl
  EXCEPT
  SELECT
    rnwl_id
  FROM
    bad_dates
  EXCEPT
  SELECT
    rnwl_id
  FROM
    bad_parent
  UNION
  SELECT
    rnwl_id
  FROM
    keep) v
WHERE
  rnwl_id NOT IN (
    SELECT
      rnwl_id
    FROM
      drop_ids);

