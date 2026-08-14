/*
 * Purpose:    Fail-closed completeness + integrity check for crosswalk_demonstration_role.
 * Inputs:     mysql_raw.crosswalk_demonstration_role, information_schema.columns, demos_app.role, demos_app.demonstration_grant_level_limit
 * Outputs:    none (validation only; RAISEs EXCEPTION on a violation)
 * Invariants: fail-closed; to_regclass-guarded no-op before load; every mapped source_column must exist on its source_table once that table is loaded (a not-yet-loaded source_table defers, mirroring the sibling completeness checks); (role_id, grant_level_id) in demos_app.role; grant_level_id 'Demonstration' and in demonstration_grant_level_limit; at most one is_primary column per source_table.
 * Refs:       sql/04_crosswalks/46_demonstration_role.sql
 *
 * Completeness + integrity check for crosswalk_demonstration_role
 * (46_demonstration_role.sql). Guarded by to_regclass so it is a no-op before
 * the table / DEMOS seeds load.
 *
 * (a) every mapped source_column must exist on its source_table (a typo or a
 *     dropped column would silently map nothing). Only rows whose source_table
 *     is actually loaded into mysql_raw are evaluated: before pgloader
 *     populates the source (e.g. `migrate crosswalks` run standalone) the
 *     source table is absent, so the check defers for that table instead of
 *     reporting every mapped column as missing;
 * (b) each (role_id, grant_level_id) must exist in demos_app.role;
 * (c) grant_level_id must be 'Demonstration' and exist in
 *     demos_app.demonstration_grant_level_limit;
 * (d) at most one is_primary column per source_table (the primary-PO slot).
 */
DO $$
DECLARE
  bad_col int;
  bad_role int;
  bad_grant int;
  bad_primary int;
BEGIN
  IF to_regclass('mysql_raw.crosswalk_demonstration_role') IS NULL THEN
    RAISE NOTICE 'crosswalk_demonstration_role check skipped: table not created yet';
    RETURN;
  END IF;
  -- (a) every mapped source_column exists on its source_table. The
  -- source_table EXISTS guard defers rows whose source table is not yet loaded
  -- into mysql_raw, so a standalone `migrate crosswalks` (before load-full) is
  -- a no-op here rather than reporting every mapped column as absent.
  SELECT
    count(*) INTO bad_col
  FROM
    mysql_raw.crosswalk_demonstration_role x
  WHERE
    EXISTS (
      SELECT
        1
      FROM
        information_schema.tables t
      WHERE
        t.table_schema = 'mysql_raw'
        AND t.table_name = x.source_table)
    AND NOT EXISTS (
      SELECT
        1
      FROM
        information_schema.columns c
      WHERE
        c.table_schema = 'mysql_raw'
        AND c.table_name = x.source_table
        AND c.column_name = x.source_column);
  IF bad_col > 0 THEN
    RAISE EXCEPTION 'crosswalk_demonstration_role maps % column(s) absent from their (loaded) mysql_raw source table', bad_col;
  END IF;
  IF to_regclass('demos_app.role') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_role
    FROM
      mysql_raw.crosswalk_demonstration_role x
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
      RAISE EXCEPTION 'crosswalk_demonstration_role has % (role_id, grant_level_id) pair(s) not in demos_app.role', bad_role;
    END IF;
  END IF;
  IF to_regclass('demos_app.demonstration_grant_level_limit') IS NOT NULL THEN
    SELECT
      count(*) INTO bad_grant
    FROM
      mysql_raw.crosswalk_demonstration_role x
    WHERE
      x.grant_level_id <> 'Demonstration'
      OR NOT EXISTS (
        SELECT
          1
        FROM
          demos_app.demonstration_grant_level_limit g
        WHERE
          g.id = x.grant_level_id);
    IF bad_grant > 0 THEN
      RAISE EXCEPTION 'crosswalk_demonstration_role has % row(s) whose grant_level_id is not a valid Demonstration limit', bad_grant;
    END IF;
  END IF;
  -- (d) one primary slot per source table at most.
  SELECT
    count(*) INTO bad_primary
  FROM (
    SELECT
      source_table
    FROM
      mysql_raw.crosswalk_demonstration_role
    WHERE
      is_primary
    GROUP BY
      source_table
    HAVING
      count(*) > 1) t;
  IF bad_primary > 0 THEN
    RAISE EXCEPTION 'crosswalk_demonstration_role has % source_table(s) with more than one is_primary column', bad_primary;
  END IF;
END
$$;

