/*
 * Purpose:    Fail-closed completeness check that every legacy mdcd_demo_stus_cd in the loaded source has a mapping row in crosswalk_demo_status.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.crosswalk_demo_status
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed completeness check; to_regclass-guarded no-op before pgloader populates mysql_raw; a present-but-empty source RAISEs (no vacuous pass) (CODE_REVIEW H4).
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/10_demo_status.sql
 *
 * Completeness check for crosswalk_demo_status: every legacy
 * mdcd_demo_stus_cd present in the loaded source must have a mapping.
 * Guarded by to_regclass so it is a no-op before pgloader has populated
 * mysql_raw; once the table exists it must be non-empty, otherwise the
 * check would pass vacuously on a half-loaded source (CODE_REVIEW H4).
 */
DO $$
DECLARE
  missing int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo') IS NULL THEN
    RAISE NOTICE 'crosswalk_demo_status check skipped: mysql_raw.mdcd_demo not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo) THEN
  RAISE EXCEPTION 'crosswalk_demo_status check: mysql_raw.mdcd_demo is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      mdcd_demo_stus_cd AS cd
    FROM
      mysql_raw.mdcd_demo
    WHERE
      mdcd_demo_stus_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_demo_status) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_demo_status is missing % legacy status code(s) present in mdcd_demo', missing;
  END IF;
END
$$;

