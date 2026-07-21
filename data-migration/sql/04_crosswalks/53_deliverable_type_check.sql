/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_deliverable_type.
 * Inputs:     mysql_raw.mdcd_dlvrbl, mysql_raw.crosswalk_deliverable_type, demos_app.deliverable_type, stg._valid_dlvrbl_ids (when present)
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs (no vacuous pass, CODE_REVIEW H4); every used legacy mdcd_dlvrbl_type_cd must have a mapping row; every mapped demos_text_id must exist in the DEMOS deliverable_type seed.
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/52_deliverable_type.sql, sql/04_crosswalks/51_deliverable_status_check.sql
 *
 * Completeness + integrity check for crosswalk_deliverable_type.
 * Guarded by to_regclass so it is a no-op before pgloader populates mysql_raw
 * and before the DEMOS seed domain is present; once mdcd_dlvrbl exists it must
 * be non-empty, otherwise the completeness check would pass vacuously on a
 * half-loaded source (CODE_REVIEW H4).
 *
 * (a) every legacy mdcd_dlvrbl_type_cd present in the loaded source must have a
 *     mapping row. When the stg filter exists, completeness scopes to the
 *     migratable set (not soft-deleted, within stg._valid_dlvrbl_ids) so codes
 *     seen only on dropped/soft-deleted deliverables do not trip a gate they
 *     never reach; without the stg schema it checks the raw source so it still
 *     fails closed (mirrors 51_deliverable_status_check.sql);
 * (b) every mapped demos_text_id must exist in the DEMOS deliverable_type seed.
 */
DO $$
DECLARE
  missing int;
  bad_target int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_dlvrbl') IS NULL THEN
    RAISE NOTICE 'crosswalk_deliverable_type check skipped: mysql_raw.mdcd_dlvrbl not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_dlvrbl) THEN
  RAISE EXCEPTION 'crosswalk_deliverable_type check: mysql_raw.mdcd_dlvrbl is present but empty; load did not populate the source';
END IF;
  -- (a) completeness: source code with no mapping row.
  -- Scope to deliverables that actually migrate when the stg filter exists
  -- (not soft-deleted and within stg._valid_dlvrbl_ids), so a code present only
  -- on dropped/soft-deleted deliverables does not fail a gate it never reaches.
  -- Standalone (no stg schema) keeps the raw-source completeness check.
  IF to_regclass('stg._valid_dlvrbl_ids') IS NOT NULL THEN
    EXECUTE $q$
      SELECT
        count(*)
      FROM ( SELECT DISTINCT
          d.mdcd_dlvrbl_type_cd AS cd
        FROM
          mysql_raw.mdcd_dlvrbl d
        WHERE
          d.mdcd_dlvrbl_type_cd IS NOT NULL
          AND COALESCE(d.dltd_ind, 0) = 0
          AND d.mdcd_dlvrbl_id IN (SELECT dlvrbl_id FROM stg._valid_dlvrbl_ids)
        EXCEPT
        SELECT
          legacy_int_cd
        FROM
          mysql_raw.crosswalk_deliverable_type) t
    $q$ INTO missing;
  ELSE
    SELECT
      count(*)
    INTO
      missing
    FROM ( SELECT DISTINCT
        mdcd_dlvrbl_type_cd AS cd
      FROM
        mysql_raw.mdcd_dlvrbl
      WHERE
        mdcd_dlvrbl_type_cd IS NOT NULL
      EXCEPT
      SELECT
        legacy_int_cd
      FROM
        mysql_raw.crosswalk_deliverable_type) t;
  END IF;
    IF missing > 0 THEN
      RAISE EXCEPTION 'crosswalk_deliverable_type is missing % legacy deliverable-type code(s) present in mdcd_dlvrbl', missing;
    END IF;
    -- (b) referential sanity against the seeded DEMOS domain
    IF to_regclass('demos_app.deliverable_type') IS NOT NULL THEN
      SELECT
        count(*)
      INTO
        bad_target
      FROM
        mysql_raw.crosswalk_deliverable_type x
      WHERE
        x.demos_text_id IS NOT NULL
        AND NOT EXISTS (
          SELECT
            1
          FROM
            demos_app.deliverable_type s
          WHERE
            s.id = x.demos_text_id);
      IF bad_target > 0 THEN
        RAISE EXCEPTION 'crosswalk_deliverable_type has % demos_text_id value(s) not in demos_app.deliverable_type', bad_target;
      END IF;
    END IF;
END
$$;

