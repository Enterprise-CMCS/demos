/*
 * Purpose: Create the (empty) migration._id_map_users table mapping legacy users.id to a minted DEMOS uuid (reused for both demos_app.person.id and demos_app.users.id); populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, docs/developer/reference-users-person-migration.adoc
 *
 * Id map: legacy mysql_raw.users.id (int) -> DEMOS uuid.
 * See docs/developer/reference-id-maps.adoc and
 * docs/developer/reference-users-person-migration.adoc.
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/10_stg/20_populate_id_map_users.sql: the build applies 05_id_maps
 * BEFORE 10_stg, and the map must be populated only from the PMDA-valid
 * user view stg._valid_user_ids (a 10_stg view), so the INSERT cannot run
 * here. Creating the table in 05 keeps it available by name to any
 * stg/app transform that JOINs the map.
 *
 * The same UUID is reused for BOTH demos_app.person.id and
 * demos_app.users.id: the composite FK users(id, person_type_id) ->
 * person(id, person_type_id) makes a shared identity mandatory.
 */
CREATE TABLE IF NOT EXISTS migration._id_map_users(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

