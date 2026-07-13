/*
 * Purpose: Create the four migration-pipeline schemas (mysql_raw, stg, demos_app, migration) owned by migration_owner and pin per-role search_path defaults for the current database; idempotent.
 * Refs:    server/src/sql/permissions.sql
 *
 * Schemas for the four logical tiers of the migration pipeline.
 *
 *   mysql_raw  -- 1:1 mirror of the source MySQL database, populated by
 *                pgloader during the full and delta loads.
 *   stg        -- staging views and helper tables: row-level filters,
 *                id maps, and any per-anchor cleanup that has to happen
 *                before app.* is rebuilt.
 *   demos_app  -- the canonical DEMOS schema seen by the application.
 *                Owned by Prisma (tables/columns/FKs/indexes/seeds); this
 *                file only (re)creates the empty schema so the Prisma
 *                artifact -- which only `SET search_path TO demos_app` and
 *                never CREATE SCHEMAs it -- can apply.
 *   migration  -- bookkeeping (jsonb_schemas, _id_map_*, helper fns).
 *
 * AUTHORIZATION is fixed to migration_owner so every dependent object
 * (table, function, default privilege) has a stable, role-owned parent.
 * Re-running this file is safe (CREATE SCHEMA IF NOT EXISTS).
 */
CREATE SCHEMA IF NOT EXISTS mysql_raw AUTHORIZATION migration_owner;

CREATE SCHEMA IF NOT EXISTS stg AUTHORIZATION migration_owner;

CREATE SCHEMA IF NOT EXISTS demos_app AUTHORIZATION migration_owner;

CREATE SCHEMA IF NOT EXISTS migration AUTHORIZATION migration_owner;

-- Application-facing grants on demos_app (USAGE, table/sequence privileges,
-- and ALTER DEFAULT PRIVILEGES for demos_read / demos_write / demos_delete)
-- are owned by DEMOS server/src/sql/permissions.sql, applied by the operator
-- via refreshDbObjects.ts AFTER this pipeline finishes building. We do NOT
-- set them here so the two sources of truth cannot drift.
-- Per-role search_path defaults, pinned to the current database. We use
-- ALTER ROLE ... IN DATABASE so the path only takes effect on this DB
-- and does not leak into shared clusters that host other services.
DO $$
DECLARE
  db text := current_database();
BEGIN
  EXECUTE format('ALTER ROLE demos_read IN DATABASE %I SET search_path = demos_app, public', db);
  EXECUTE format('ALTER ROLE demos_write IN DATABASE %I SET search_path = demos_app, public', db);
  EXECUTE format('ALTER ROLE demos_delete IN DATABASE %I SET search_path = demos_app, public', db);
  EXECUTE format('ALTER ROLE migration_owner IN DATABASE %I '
    'SET search_path = demos_app, stg, mysql_raw, migration, public', db);
END
$$;

