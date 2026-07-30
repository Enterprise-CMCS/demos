/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_system_role (person_type-keyed).
 * Inputs:     mysql_raw.crosswalk_system_role, demos_app.role, demos_app.system_grant_level_limit, demos_app.role_person_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; every System-grant (role_id, person_type_id) pairing DEMOS seeds is covered; (role_id, grant_level_id) in demos_app.role; grant_level_id 'System' and in system_grant_level_limit; (role_id, person_type_id) permitted by role_person_type.
 * Refs:       sql/04_crosswalks/44_system_role.sql
 *
 * Completeness + integrity check for crosswalk_system_role (44_system_role.sql).
 * Guarded by to_regclass so it is a no-op before the DEMOS seeds load.
 *
 * (a) every System-grant (role_id, person_type_id) pairing DEMOS seeds (a
 *     role_person_type row whose role is a System-grant role) must have a
 *     mapping row, so no user person_type loads permission-less;
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
  -- (a) System-grant coverage: every (System role, person_type) DEMOS permits
  --     must be mapped so no user person_type is left without a system role.
  IF to_regclass('demos_app.role') IS NOT NULL AND to_regclass('demos_app.role_person_type') IS NOT NULL THEN
    SELECT
      count(*)
    INTO
      missing
    FROM (
      SELECT
        rp.role_id,
        rp.person_type_id
      FROM
        demos_app.role_person_type rp
        JOIN demos_app.role r ON r.id = rp.role_id
      WHERE
        r.grant_level_id = 'System'
      EXCEPT
      SELECT
        role_id,
        person_type_id
      FROM
        mysql_raw.crosswalk_system_role) t;
    IF missing > 0 THEN
      RAISE EXCEPTION 'crosswalk_system_role is missing % System-grant (role, person_type) pairing(s) DEMOS permits', missing;
    END IF;
  ELSE
    RAISE NOTICE 'crosswalk_system_role check: demos_app seeds not loaded yet; skipping completeness';
  END IF;
  IF to_regclass('demos_app.role') IS NOT NULL THEN
    SELECT
      count(*)
    INTO
      bad_role
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
      count(*)
    INTO
      bad_grant
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
      count(*)
    INTO
      bad_ptype
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

