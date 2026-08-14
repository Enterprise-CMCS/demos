/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_signature_level.
 * Inputs:     mysql_raw.mdcd_demo, mysql_raw.crosswalk_signature_level, demos_app.signature_level
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs (no vacuous pass) (CODE_REVIEW H4); every mapped demos_text_id must exist in the DEMOS signature_level seed; no LIVE APPROVED-equivalent demonstration (mdcd_demo_stus_cd 2,4,5,6,7) may resolve to a NULL signature level unless the crosswalk row is null_ok.
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/30_signature_level.sql
 *
 * Completeness + integrity check for crosswalk_signature_level.
 * Guarded by to_regclass so it is a no-op before pgloader populates mysql_raw;
 * once the table exists it must be non-empty, otherwise the check would pass
 * vacuously on a half-loaded source (CODE_REVIEW H4).
 *
 * (a) every legacy mdcd_demo_aplctn_sgntr_lvl_cd present in the source must
 *     have a mapping row;
 * (b) any mapped demos_text_id must exist in the DEMOS signature_level seed;
 * (c) no LIVE APPROVED-equivalent source demonstration may resolve to a NULL
 *     signature level unless its crosswalk row is null_ok. The DEMOS
 *     demonstration_signature_level_check forbids NULL and forces 'OA', so the
 *     loader coerces every demonstration to 'OA'; this clause flags approved
 *     demonstrations whose source signature is unmapped/ambiguous, minus the
 *     SME-accepted codes flagged null_ok (code 0, the '-- Please Select --'
 *     sentinel). Approved-equivalent legacy mdcd_demo_stus_cd values are 2
 *     (Approved) and 4/5/6/7 (Extended / Temporarily Extended / Expired /
 *     Extension Pending), all of which land on 'Approved' in DEMOS. Clause (c)
 *     always excludes soft-deleted rows (they never migrate); when the stg
 *     filter exists it additionally scopes to stg._valid_demo_ids so malformed
 *     / SME-deferred demonstrations the loader drops do not trip a gate they
 *     never reach.
 */
DO $$
DECLARE
  missing int;
  bad_target int;
  approved_null int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo') IS NULL THEN
    RAISE NOTICE 'crosswalk_signature_level check skipped: mysql_raw.mdcd_demo not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo) THEN
  RAISE EXCEPTION 'crosswalk_signature_level check: mysql_raw.mdcd_demo is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      mdcd_demo_aplctn_sgntr_lvl_cd AS cd
    FROM
      mysql_raw.mdcd_demo
    WHERE
      mdcd_demo_aplctn_sgntr_lvl_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_signature_level) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_signature_level is missing % legacy signature code(s) present in mdcd_demo', missing;
  END IF;
  IF to_regclass('demos_app.signature_level') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_target
    FROM
      mysql_raw.crosswalk_signature_level x
    WHERE
      x.demos_text_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.signature_level s
        WHERE
          s.id = x.demos_text_id);
    IF bad_target > 0 THEN
      RAISE EXCEPTION 'crosswalk_signature_level has % demos_text_id value(s) not in demos_app.signature_level', bad_target;
    END IF;
  END IF;
  -- (c) approved demonstration resolving to NULL signature level.
  -- Scope to rows that actually migrate: when the stg filter exists
  -- (stg._valid_demo_ids -- format-valid and not drop-listed), restrict to it
  -- and skip soft-deletes, so demonstrations the loader drops (soft-deleted,
  -- malformed, or SME-deferred via reports/filter/drop_ids.csv) do not trip a
  -- gate they never reach. Standalone (no stg schema, e.g. `migrate crosswalks`
  -- before build, and the SQL harness) keeps the raw-source check so the
  -- integrity guard still fails closed.
  IF to_regclass('stg._valid_demo_ids') IS NOT NULL THEN
    EXECUTE $q$
      SELECT
        count(*)
      FROM
        mysql_raw.mdcd_demo d
        JOIN mysql_raw.crosswalk_signature_level x ON x.legacy_int_cd = d.mdcd_demo_aplctn_sgntr_lvl_cd
      WHERE
        d.mdcd_demo_stus_cd IN (2, 4, 5, 6, 7)
        AND x.demos_text_id IS NULL
        AND NOT x.null_ok
        AND COALESCE(d.dltd_ind, 0) = 0
        AND d.mdcd_demo_id IN (SELECT demo_id FROM stg._valid_demo_ids)
    $q$ INTO approved_null;
  ELSE
    SELECT
      count(*) INTO approved_null
    FROM
      mysql_raw.mdcd_demo d
      JOIN mysql_raw.crosswalk_signature_level x ON x.legacy_int_cd = d.mdcd_demo_aplctn_sgntr_lvl_cd
    WHERE
      d.mdcd_demo_stus_cd IN (2, 4, 5, 6, 7)
      AND x.demos_text_id IS NULL
      AND NOT x.null_ok
      AND COALESCE(d.dltd_ind, 0) = 0;
  END IF;
  IF approved_null > 0 THEN
    RAISE EXCEPTION 'crosswalk_signature_level would set NULL signature on % approved demonstration(s) -- DEMOS forbids NULL signature when approved; resolve as a data-quality exception or map the signature level', approved_null;
  END IF;
END
$$;

