/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_system_role.
 * Inputs:     mysql_raw.crosswalk_system_role, mysql_raw.role_rfrnc, demos_app.role, demos_app.system_grant_level_limit, demos_app.role_person_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; System subset {1, 4} complete; (role_id, grant_level_id) in demos_app.role; grant_level_id 'System' and in system_grant_level_limit; (role_id, person_type_id) permitted by role_person_type.
 * Refs:       sql/04_crosswalks/44_system_role.sql
 *
 * Completeness + integrity check for crosswalk_system_role (44_system_role.sql).
 * Guarded by to_regclass so it is a no-op before the source / DEMOS seeds load.
 *
 * (a) every System role code present in mysql_raw.role_rfrnc (the curated set
 *     {1, 4}) must have a mapping row;
 * (b) each (role_id, grant_level_id) must exist in demos_app.role;
 * (c) grant_level_id must be 'System' and exist in system_grant_level_limit;
 * (d) each (role_id, person_type_id) must be permitted by role_person_type.
 */
DO $$
DECLARE
  missing int;
  bad_role int;
  bad_grant int;
  bad_ptype int;
BEGIN
  IF to_regclass('mysql_raw.crosswalk_system_role') IS NULL THEN
    RAISE NOTICE 'crosswalk_system_role check skipped: table not created yet';
    RETURN;
  END IF;
  -- (a) System-subset completeness against the loaded source.
  IF to_regclass('mysql_raw.role_rfrnc') IS NOT NULL THEN
    SELECT
      count(*) INTO missing
    FROM ( SELECT DISTINCT
        role_cd AS cd
      FROM
        mysql_raw.role_rfrnc
      WHERE
        role_cd IN (1, 4)
      EXCEPT
      SELECT
        legacy_role_cd
      FROM
        mysql_raw.crosswalk_system_role) t;
    IF missing > 0 THEN
      RAISE EXCEPTION 'crosswalk_system_role is missing % System role code(s) present in role_rfrnc', missing;
    END IF;
  ELSE
    RAISE NOTICE 'crosswalk_system_role check: mysql_raw.role_rfrnc not loaded yet; skipping completeness';
  END IF;
  IF to_regclass('demos_app.role') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_role
    FROM
      mysql_raw.crosswalk_system_role x
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.role r
        WHERE
          r.id = x.role_id
          AND r.grant_level_id = x.grant_level_id);
    IF bad_role > 0 THEN
      RAISE EXCEPTION 'crosswalk_system_role has % (role_id, grant_level_id) pair(s) not in demos_app.role', bad_role;
    END IF;
  END IF;
  IF to_regclass('demos_app.system_grant_level_limit') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_grant
    FROM
      mysql_raw.crosswalk_system_role x
    WHERE
      x.grant_level_id <> 'System'
      OR NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.system_grant_level_limit g
        WHERE
          g.id = x.grant_level_id);
    IF bad_grant > 0 THEN
      RAISE EXCEPTION 'crosswalk_system_role has % row(s) whose grant_level_id is not a valid System limit', bad_grant;
    END IF;
  END IF;
  IF to_regclass('demos_app.role_person_type') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_ptype
    FROM
      mysql_raw.crosswalk_system_role x
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.role_person_type rp
        WHERE
          rp.role_id = x.role_id
          AND rp.person_type_id = x.person_type_id);
    IF bad_ptype > 0 THEN
      RAISE EXCEPTION 'crosswalk_system_role has % (role_id, person_type_id) pair(s) not permitted by role_person_type', bad_ptype;
    END IF;
  END IF;
END
$$;

