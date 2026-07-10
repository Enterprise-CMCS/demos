/*
 * Purpose: Create the migration cluster's roles (build/owner migration_owner and the DEMOS app-facing demos_read/demos_write/demos_delete) if absent; idempotent, run once per cluster.
 * Refs:    server/src/sql/permissions.sql
 *
 * Roles for the migration cluster.
 * Run once per cluster. Idempotent.
 *
 * migration_owner is the build/owner role this pipeline runs as.
 *
 * demos_read / demos_write / demos_delete are the DEMOS app-facing roles.
 * DEMOS owns their final grants via server/src/sql/permissions.sql
 * (applied by the operator through refreshDbObjects.ts after the build);
 * we only ensure they exist so that artifact does not fail on a fresh
 * staging clone. Final role attributes (LOGIN, membership) are a DEMOS
 * deployment concern.
 */
DO $$
BEGIN
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles
    WHERE
      rolname = 'migration_owner') THEN
  CREATE ROLE migration_owner LOGIN CREATEDB;
END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles
    WHERE
      rolname = 'demos_read') THEN
  CREATE ROLE demos_read LOGIN;
END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles
    WHERE
      rolname = 'demos_write') THEN
  CREATE ROLE demos_write LOGIN;
END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles
    WHERE
      rolname = 'demos_delete') THEN
  CREATE ROLE demos_delete LOGIN;
END IF;
END
$$;

