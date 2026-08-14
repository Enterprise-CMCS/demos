/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_deliverable_status.
 * Inputs:     mysql_raw.mdcd_dlvrbl, mysql_raw.crosswalk_deliverable_status, demos_app.deliverable_status, demos_app.deliverable_due_date_type, demos_app.deliverable_extension_status
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs (no vacuous pass) (CODE_REVIEW H4); every used legacy code must have a confirmed non-NULL status_id OR be flagged null_ok (SME-accepted NULL, e.g. code 0 N/A -- held back + logged); every status_id / due_date_type_id / emit_extension_status must exist in its DEMOS seed domain.
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/50_deliverable_status.sql
 *
 * Completeness + integrity check for crosswalk_deliverable_status.
 * Guarded by to_regclass so it is a no-op before pgloader populates
 * mysql_raw and before the DEMOS seed domains are present; once mdcd_dlvrbl
 * exists it must be non-empty, otherwise the completeness check would pass
 * vacuously on a half-loaded source (CODE_REVIEW H4).
 *
 * (a) every legacy mdcd_dlvrbl_crnt_stus_cd present in the loaded source
 *     must have a confirmed mapping with a non-NULL status_id, OR be flagged
 *     null_ok (an SME-accepted NULL, e.g. code 0 N/A -- held back from the load
 *     and logged in _parity_deliverable_held, mirroring signature_level). When
 *     the stg filter exists, completeness scopes to the migratable set (not
 *     soft-deleted, within stg._valid_dlvrbl_ids) so codes seen only on
 *     dropped/soft-deleted deliverables do not trip a gate they never reach;
 *     without the stg schema it checks the raw source so it still fails closed;
 * (b) every mapped status_id / due_date_type_id / emit_extension_status must
 *     exist in the corresponding DEMOS seed domain.
 */
DO $$
DECLARE
  missing int;
  bad_status int;
  bad_due_type int;
  bad_extension int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_dlvrbl') IS NULL THEN
    RAISE NOTICE 'crosswalk_deliverable_status check skipped: mysql_raw.mdcd_dlvrbl not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_dlvrbl) THEN
  RAISE EXCEPTION 'crosswalk_deliverable_status check: mysql_raw.mdcd_dlvrbl is present but empty; load did not populate the source';
END IF;
  -- (a) completeness: source code with no confirmed status_id.
  -- Scope to deliverables that actually migrate when the stg filter exists
  -- (not soft-deleted and within stg._valid_dlvrbl_ids -- which already
  -- cascades the parent-demo and drop-list exclusions), so a code present only
  -- on dropped/soft-deleted deliverables does not fail a gate it never reaches.
  -- Standalone (no stg schema) keeps the raw-source completeness check.
  IF to_regclass('stg._valid_dlvrbl_ids') IS NOT NULL THEN
    EXECUTE $q$
      SELECT
        count(*)
      FROM ( SELECT DISTINCT
          d.mdcd_dlvrbl_crnt_stus_cd AS cd
        FROM
          mysql_raw.mdcd_dlvrbl d
        WHERE
          d.mdcd_dlvrbl_crnt_stus_cd IS NOT NULL
          AND COALESCE(d.dltd_ind, 0) = 0
          AND d.mdcd_dlvrbl_id IN (SELECT dlvrbl_id FROM stg._valid_dlvrbl_ids)
        EXCEPT
        SELECT
          legacy_int_cd
        FROM
          mysql_raw.crosswalk_deliverable_status
        WHERE
          status_id IS NOT NULL
          OR null_ok) t
    $q$ INTO missing;
  ELSE
    SELECT
      count(*) INTO missing
    FROM ( SELECT DISTINCT
        mdcd_dlvrbl_crnt_stus_cd AS cd
      FROM
        mysql_raw.mdcd_dlvrbl
      WHERE
        mdcd_dlvrbl_crnt_stus_cd IS NOT NULL
      EXCEPT
      SELECT
        legacy_int_cd
      FROM
        mysql_raw.crosswalk_deliverable_status
      WHERE
        status_id IS NOT NULL
        OR null_ok) t;
  END IF;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_deliverable_status is missing % legacy status code(s) present in mdcd_dlvrbl', missing;
  END IF;
  -- (b) referential sanity against the seeded DEMOS domains
  IF to_regclass('demos_app.deliverable_status') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_status
    FROM
      mysql_raw.crosswalk_deliverable_status x
    WHERE
      x.status_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.deliverable_status s
        WHERE
          s.id = x.status_id);
    IF bad_status > 0 THEN
      RAISE EXCEPTION 'crosswalk_deliverable_status has % status_id value(s) not in demos_app.deliverable_status', bad_status;
    END IF;
    SELECT
      count(*) INTO bad_due_type
    FROM
      mysql_raw.crosswalk_deliverable_status x
    WHERE
      x.due_date_type_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.deliverable_due_date_type d
        WHERE
          d.id = x.due_date_type_id);
    IF bad_due_type > 0 THEN
      RAISE EXCEPTION 'crosswalk_deliverable_status has % due_date_type_id value(s) not in demos_app.deliverable_due_date_type', bad_due_type;
    END IF;
    SELECT
      count(*) INTO bad_extension
    FROM
      mysql_raw.crosswalk_deliverable_status x
    WHERE
      x.emit_extension_status IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.deliverable_extension_status e
        WHERE
          e.id = x.emit_extension_status);
    IF bad_extension > 0 THEN
      RAISE EXCEPTION 'crosswalk_deliverable_status has % emit_extension_status value(s) not in demos_app.deliverable_extension_status', bad_extension;
    END IF;
  END IF;
END
$$;

