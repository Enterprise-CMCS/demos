/*
 * Purpose:    Coverage cross-check that every realistically-active PMDA user (not deleted/soft-deleted, accessed since 2020) made it into the migrated set.
 * Inputs:     mysql_raw.users; migration._id_map_users
 * Outputs:    migration._parity_active_users_coverage
 * Invariants: Non-empty -> RED at Gate 6 (an active user the filter dropped; confirm the exclusion or force-keep via reports/filter/keep_ids.csv); conditional-DDL guard emits an empty stand-in view when mysql_raw.users or the id map is absent (so vacuously GREEN there); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py active-users coverage check; sql/10_stg/17_filter_user.sql; reports/filter/keep_ids.csv
 *
 * Parity cross-check: every realistically-active PMDA user made it into the
 * migration. This is the team's "who is actually using the app" definition --
 * not deleted, not soft-deleted, and seen this decade -- reframed as a
 * coverage invariant against the migrated set (migration._id_map_users).
 *
 * Source heuristic (the team's live query):
 *   deleted_at IS NULL AND deleted = 0 AND lastAccess IS NOT NULL
 *   AND lastAccess LIKE '202%'
 * pgloader stores lastAccess as a timestamp, so the '202%' string test becomes
 * `lastaccess >= 2020-01-01`.
 *
 * Any row is an active user the filter (sql/10_stg/17_filter_user.sql) dropped
 * -- e.g. a test-pattern username or a missing/invalid email on an account
 * that is nonetheless in active use. RED at Gate 6: confirm the exclusion or
 * force-keep via reports/filter/keep_ids.csv.
 *
 * Guarded: emits an empty stand-in view when mysql_raw.users (the frozen
 * source copy) or the id map is not present (e.g. the deeper-layer harness),
 * so the check is vacuously GREEN there.
 */
SET search_path TO migration, mysql_raw, public;

DO $$
BEGIN
  IF to_regclass('mysql_raw.users') IS NOT NULL AND to_regclass('migration._id_map_users') IS NOT NULL THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_active_users_coverage AS
      SELECT u.id AS user_id, u.email
      FROM mysql_raw.users u
      WHERE u.deleted_at IS NULL
        AND u.deleted = 0
        AND u.lastaccess IS NOT NULL
        AND u.lastaccess >= TIMESTAMP '2020-01-01'
        AND NOT EXISTS (
          SELECT 1 FROM migration._id_map_users m WHERE m.legacy_int_id = u.id)
    $v$;
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_active_users_coverage AS
      SELECT NULL::bigint AS user_id, NULL::text AS email
       WHERE false
    $v$;
  END IF;
END
$$;

