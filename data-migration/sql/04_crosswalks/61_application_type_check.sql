/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_application_type.
 * Inputs:     mysql_raw.mdcd_demo_aplctn, mysql_raw.crosswalk_application_type, demos_app.application_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs; every mapped demos_text_id must exist in the DEMOS application_type seed.
 * Refs:       sql/04_crosswalks/60_application_type.sql
 *
 * Completeness + integrity check for crosswalk_application_type.
 * Guarded by to_regclass so it is a no-op before pgloader populates mysql_raw
 * (e.g. when `migrate crosswalks` is run standalone during development).
 *
 * (a) every legacy mdcd_demo_aplctn_type_cd present in the loaded source must
 *     have a mapping row;
 * (b) any mapped demos_text_id must exist in the DEMOS application_type seed.
 */
DO $$
DECLARE
  missing int;
  bad_target int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo_aplctn') IS NULL THEN
    RAISE NOTICE 'crosswalk_application_type check skipped: mysql_raw.mdcd_demo_aplctn not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo_aplctn) THEN
  RAISE EXCEPTION 'crosswalk_application_type check: mysql_raw.mdcd_demo_aplctn is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      mdcd_demo_aplctn_type_cd AS cd
    FROM
      mysql_raw.mdcd_demo_aplctn
    WHERE
      mdcd_demo_aplctn_type_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_application_type) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_application_type is missing % legacy application-type code(s) present in mdcd_demo_aplctn', missing;
  END IF;
  IF to_regclass('demos_app.application_type') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_target
    FROM
      mysql_raw.crosswalk_application_type x
    WHERE
      x.demos_text_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.application_type s
        WHERE
          s.id = x.demos_text_id);
    IF bad_target > 0 THEN
      RAISE EXCEPTION 'crosswalk_application_type has % demos_text_id value(s) not in demos_app.application_type', bad_target;
    END IF;
  END IF;
END
$$;

