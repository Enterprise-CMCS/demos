/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_role_person_type.
 * Inputs:     mysql_raw.role_rfrnc, mysql_raw.crosswalk_role_person_type, demos_app.person_type
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; a present-but-empty source RAISEs (no vacuous pass) (CODE_REVIEW H4); each legacy_name must match role_rfrnc.role_name (trimmed, case-insensitive); every person_type_id must exist in demos_app.person_type.
 * Refs:       CODE_REVIEW.md (H4), sql/04_crosswalks/42_role_person_type.sql
 *
 * Completeness + integrity check for crosswalk_role_person_type.
 * Guarded by to_regclass so it is a no-op before the source / DEMOS seeds load;
 * once role_rfrnc exists it must be non-empty, otherwise the completeness check
 * would pass vacuously on a half-loaded source (CODE_REVIEW H4).
 *
 * (a) every legacy role_cd present in mysql_raw.role_rfrnc must have a mapping row;
 * (b) each mapping's legacy_name must match role_rfrnc.role_name for that code
 *     (trimmed, case-insensitive) -- catches a re-coded source;
 * (c) every person_type_id must exist in demos_app.person_type.
 */
DO $$
DECLARE
  missing int;
  bad_name int;
  bad_ptype int;
BEGIN
  IF to_regclass('mysql_raw.role_rfrnc') IS NULL THEN
    RAISE NOTICE 'crosswalk_role_person_type check skipped: mysql_raw.role_rfrnc not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.role_rfrnc) THEN
  RAISE EXCEPTION 'crosswalk_role_person_type check: mysql_raw.role_rfrnc is present but empty; load did not populate the source';
END IF;
  SELECT
    count(*) INTO missing
  FROM (
    SELECT
      role_cd AS cd
    FROM
      mysql_raw.role_rfrnc
    WHERE
      role_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_role_person_type) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_role_person_type is missing % legacy role code(s) present in role_rfrnc', missing;
  END IF;
  SELECT
    count(*) INTO bad_name
  FROM
    mysql_raw.crosswalk_role_person_type x
    JOIN mysql_raw.role_rfrnc r ON r.role_cd = x.legacy_int_cd
  WHERE
    lower(btrim(r.role_name)) IS DISTINCT FROM lower(btrim(x.legacy_name));
  IF bad_name > 0 THEN
    RAISE EXCEPTION 'crosswalk_role_person_type has % legacy_name(s) that disagree with role_rfrnc.role_name', bad_name;
  END IF;
  IF to_regclass('demos_app.person_type') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_ptype
    FROM
      mysql_raw.crosswalk_role_person_type x
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.person_type pt
        WHERE
          pt.id = x.person_type_id);
    IF bad_ptype > 0 THEN
      RAISE EXCEPTION 'crosswalk_role_person_type has % person_type_id(s) not in demos_app.person_type', bad_ptype;
    END IF;
  END IF;
END
$$;

