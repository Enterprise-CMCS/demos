/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_sdg_division.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.crosswalk_sdg_division, demos_app.sdg_division
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs; every legacy code mapped (to a division id or deliberately to NULL); any non-NULL demos_text_id must exist in the DEMOS sdg_division seed.
 * Refs:       sql/04_crosswalks/62_sdg_division.sql
 *
 * Completeness + integrity check for crosswalk_sdg_division.
 * Guarded by to_regclass so it is a no-op before pgloader populates mysql_raw.
 *
 * (a) every legacy mdcd_chip_div_cd present in the loaded source must have a
 *     mapping row (mapped to a division id, or deliberately to NULL);
 * (b) any non-NULL mapped demos_text_id must exist in the DEMOS sdg_division
 *     seed.
 */
DO $$
DECLARE
  missing int;
  bad_target int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo') IS NULL THEN
    RAISE NOTICE 'crosswalk_sdg_division check skipped: mysql_raw.mdcd_demo not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo) THEN
  RAISE EXCEPTION 'crosswalk_sdg_division check: mysql_raw.mdcd_demo is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      mdcd_chip_div_cd AS cd
    FROM
      mysql_raw.mdcd_demo
    WHERE
      mdcd_chip_div_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_sdg_division) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_sdg_division is missing % legacy division code(s) present in mdcd_demo', missing;
  END IF;
  IF to_regclass('demos_app.sdg_division') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_target
    FROM
      mysql_raw.crosswalk_sdg_division x
    WHERE
      x.demos_text_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.sdg_division s
        WHERE
          s.id = x.demos_text_id);
    IF bad_target > 0 THEN
      RAISE EXCEPTION 'crosswalk_sdg_division has % demos_text_id value(s) not in demos_app.sdg_division', bad_target;
    END IF;
  END IF;
END
$$;

