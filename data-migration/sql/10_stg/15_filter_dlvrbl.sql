/*
 * Purpose:    Build the row-level allowlist of valid deliverable ids, cascading from the demonstration filter.
 * Inputs:     mysql_raw.mdcd_dlvrbl, stg._valid_demo_ids, stg._keep_ids, stg._drop_ids
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_dlvrbl_ids
 * Invariants: source-only (no crosswalks/seeds); single-parent cascade (drop when parent demo excluded); fail-closed created-date rule; force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on the deliverable anchor
 * `mysql_raw.mdcd_dlvrbl`.
 *
 * Cascades from the demonstration filter: a deliverable whose parent
 * demonstration was excluded is excluded too.
 */
SET search_path TO stg, mysql_raw, public;

CREATE OR REPLACE VIEW stg._valid_dlvrbl_ids AS
WITH bad_dates AS (
  SELECT
    mdcd_dlvrbl_id AS dlvrbl_id
  FROM
    mysql_raw.mdcd_dlvrbl
  WHERE
    creatd_dt IS NULL
    OR (dlvrbl_due_dt IS NOT NULL
      AND (extract(year FROM dlvrbl_due_dt) < 1990
        OR extract(year FROM dlvrbl_due_dt) > 2099))
),
bad_parent AS (
  SELECT
    d.mdcd_dlvrbl_id AS dlvrbl_id
  FROM
    mysql_raw.mdcd_dlvrbl d
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        stg._valid_demo_ids v
      WHERE
        v.demo_id = d.mdcd_demo_id)
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS dlvrbl_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_dlvrbl'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_dlvrbl s
      WHERE
        s.mdcd_dlvrbl_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS dlvrbl_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_dlvrbl'
)
SELECT
  dlvrbl_id
FROM (
  SELECT
    mdcd_dlvrbl_id AS dlvrbl_id
  FROM
    mysql_raw.mdcd_dlvrbl
  EXCEPT
  SELECT
    dlvrbl_id
  FROM
    bad_dates
  EXCEPT
  SELECT
    dlvrbl_id
  FROM
    bad_parent
  UNION
  SELECT
    dlvrbl_id
  FROM
    keep) v
WHERE
  dlvrbl_id NOT IN (
    SELECT
      dlvrbl_id
    FROM
      drop_ids);

