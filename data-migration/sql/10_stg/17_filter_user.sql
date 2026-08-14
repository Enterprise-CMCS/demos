/*
 * Purpose:    Build the row-level allowlist of valid user ids by screening usernames and requiring a present, well-formed email.
 * Inputs:     mysql_raw.users, stg._keep_ids, stg._drop_ids
 * Outputs:    CREATE OR REPLACE VIEW stg._valid_user_ids
 * Invariants: source-only (no crosswalks/seeds); independent of the demonstration filter; email mandatory (drops NULL-email service accounts SHAREPOINT/PMDA and malformed rows); testing_user_ind NOT trusted (0 on every row); force-keep only ids present in source (CODE_REVIEW H5).
 * Refs:       -
 *
 * Row-level allowlist filter on the user anchor `mysql_raw.users`.
 *
 * Independent of the demonstration filter -- usernames are screened on
 * their own pattern (excluding obvious test / service accounts) plus a
 * REQUIRED present-and-well-formed email.
 *
 * Every real user is migrated (including deleted / inactive ones) so no
 * ownership FK is left dangling; the email is mandatory because it is the
 * person.email value (NOT NULL) and the key CMS IDM matches on at first
 * login. The only NULL-email rows are the non-person service accounts
 * 'SHAREPOINT' and 'PMDA', which the email requirement drops here.
 *
 * The public output column is aliased to user_id for a stable contract.
 *
 * NOTE: the source `testing_user_ind` flag is NOT a reliable test-account
 * signal -- it is 0 on every row, including obvious junk (abelincoln,
 * test123, ...). Test/service accounts are screened by the username
 * patterns below plus the SME-curated stg._drop_ids list, not the flag.
 */
SET search_path TO stg, mysql_raw, public;

CREATE OR REPLACE VIEW stg._valid_user_ids AS
WITH bad_user_nm AS (
  -- Strip known test / service account prefixes. Case-insensitive.
  SELECT
    id AS user_id
  FROM
    mysql_raw.users
  WHERE
    username IS NULL
    OR username ~* '^(test|qa|svc_|dummy|placeholder)'
    OR username ~* '\m(test|tst|qa|sandbox|dummy)\M'
),
no_email AS (
  -- Require a present, well-formed email. Drops the NULL-email service
  -- accounts 'SHAREPOINT' and 'PMDA' (not people) and any malformed row.
  SELECT
    id AS user_id
  FROM
    mysql_raw.users
  WHERE
    email IS NULL
    OR email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
),
keep AS (
  -- Force-keep only ids that exist in the source (CODE_REVIEW H5).
  SELECT
    k.legacy_id AS user_id
  FROM
    stg._keep_ids k
  WHERE
    k.entity = 'users'
    AND EXISTS (
      SELECT
        1
      FROM
        mysql_raw.users s
      WHERE
        s.id = k.legacy_id)
),
drop_ids AS (
  SELECT
    legacy_id AS user_id
  FROM
    stg._drop_ids
  WHERE
    entity = 'users'
)
SELECT
  user_id
FROM (
  SELECT
    id AS user_id
  FROM
    mysql_raw.users
  EXCEPT
  SELECT
    user_id
  FROM
    bad_user_nm
  EXCEPT
  SELECT
    user_id
  FROM
    no_email
  UNION
  SELECT
    user_id
  FROM
    keep) v
WHERE
  user_id NOT IN (
    SELECT
      user_id
    FROM
      drop_ids);

