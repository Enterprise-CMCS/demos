/*
 * Purpose:    Fail-closed completeness check that every legacy geo_ansi_state_cd in the loaded source has a mapping row in crosswalk_state.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.crosswalk_state
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed completeness check; to_regclass-guarded no-op before load; a present-but-empty source RAISEs (no vacuous pass) (CODE_REVIEW H4).
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/20_state.sql
 *
 * Completeness check for crosswalk_state: every legacy geo_ansi_state_cd
 * present in the loaded source data must have a mapping. Guarded by
 * to_regclass so it is a no-op before pgloader has populated mysql_raw
 * (e.g. when `migrate crosswalks` is run standalone during development).
 * Once the table exists it must be non-empty, otherwise the check would
 * pass vacuously on a half-loaded source (CODE_REVIEW H4).
 */
DO $$
DECLARE
  missing int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo') IS NULL THEN
    RAISE NOTICE 'crosswalk_state check skipped: mysql_raw.mdcd_demo not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo) THEN
  RAISE EXCEPTION 'crosswalk_state check: mysql_raw.mdcd_demo is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      geo_ansi_state_cd AS cd
    FROM
      mysql_raw.mdcd_demo
    WHERE
      geo_ansi_state_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_cd
    FROM
      mysql_raw.crosswalk_state) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_state is missing % legacy state code(s) present in mdcd_demo', missing;
  END IF;
END
$$;

