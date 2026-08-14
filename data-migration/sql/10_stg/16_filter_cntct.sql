/*
 * Purpose:    Build the demo-grain allowlists of valid contact rows on the approved and pending contact anchors, screening each present role email.
 * Inputs:     mysql_raw.mdcd_demo_cntct, mysql_raw.mdcd_pendg_demo_cntct, stg._valid_demo_ids, stg._valid_pendg_demo_ids, stg._keep_ids, stg._drop_ids
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_cntct_ids, stg._valid_pendg_cntct_ids
 * Invariants: source-only (no crosswalks/seeds); demo-grain key (cntct_demo_id = parent demo id, no surrogate contact id); fail-closed email pattern on each present role email; cascades from the demo filter; force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on contact anchors:
 *   `mysql_raw.mdcd_demo_cntct`        -> stg._valid_cntct_ids
 *   `mysql_raw.mdcd_pendg_demo_cntct`  -> stg._valid_pendg_cntct_ids
 *
 * The real contact tables are one row per demonstration (no surrogate
 * contact id), keyed by the parent demo id, with role-specific email
 * columns. These views are therefore keyed at the DEMO grain: the public
 * output column is aliased to cntct_demo_id and holds the parent
 * mdcd_demo_id / mdcd_pendg_demo_id.
 *
 * Each present role email must match the email pattern; the row cascades
 * from the demonstration filter so contacts on excluded demos drop out
 * automatically.
 */
SET search_path TO stg, mysql_raw, public;

CREATE OR REPLACE VIEW stg._valid_cntct_ids AS
WITH bad_email AS (
  -- Any present role email that fails the pattern invalidates the row.
  SELECT
    mdcd_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_demo_cntct
  WHERE (state_mdcd_drctr_email_adr IS NOT NULL
    AND state_mdcd_drctr_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  OR (ro_fincl_lead_email_adr IS NOT NULL
    AND ro_fincl_lead_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  OR (sota_email_adr IS NOT NULL
    AND sota_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  OR (ro_state_lead_email_adr IS NOT NULL
    AND ro_state_lead_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
),
bad_parent AS (
  SELECT
    c.mdcd_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_demo_cntct c
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        stg._valid_demo_ids v
      WHERE
        v.demo_id = c.mdcd_demo_id)
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS cntct_demo_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_demo_cntct'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_demo_cntct s
      WHERE
        s.mdcd_demo_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS cntct_demo_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_demo_cntct'
)
SELECT
  cntct_demo_id
FROM (
  SELECT
    mdcd_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_demo_cntct
  EXCEPT
  SELECT
    cntct_demo_id
  FROM
    bad_email
  EXCEPT
  SELECT
    cntct_demo_id
  FROM
    bad_parent
  UNION
  SELECT
    cntct_demo_id
  FROM
    keep) v
WHERE
  cntct_demo_id NOT IN (
    SELECT
      cntct_demo_id
    FROM
      drop_ids);

CREATE OR REPLACE VIEW stg._valid_pendg_cntct_ids AS
WITH bad_email AS (
  -- The pending contact table carries only the state director role.
  SELECT
    mdcd_pendg_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_pendg_demo_cntct
  WHERE
    state_mdcd_drctr_email_adr IS NOT NULL
    AND state_mdcd_drctr_email_adr !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
),
bad_parent AS (
  SELECT
    c.mdcd_pendg_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_pendg_demo_cntct c
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        stg._valid_pendg_demo_ids p
      WHERE
        p.demo_id = c.mdcd_pendg_demo_id)
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS cntct_demo_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'mdcd_pendg_demo_cntct'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.mdcd_pendg_demo_cntct s
      WHERE
        s.mdcd_pendg_demo_id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS cntct_demo_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'mdcd_pendg_demo_cntct'
)
SELECT
  cntct_demo_id
FROM (
  SELECT
    mdcd_pendg_demo_id AS cntct_demo_id
  FROM
    mysql_raw.mdcd_pendg_demo_cntct
  EXCEPT
  SELECT
    cntct_demo_id
  FROM
    bad_email
  EXCEPT
  SELECT
    cntct_demo_id
  FROM
    bad_parent
  UNION
  SELECT
    cntct_demo_id
  FROM
    keep) v
WHERE
  cntct_demo_id NOT IN (
    SELECT
      cntct_demo_id
    FROM
      drop_ids);

