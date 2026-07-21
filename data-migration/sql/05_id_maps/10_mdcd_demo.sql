/*
 * Purpose: Create the (empty) migration._id_map_mdcd_demo table mapping legacy mdcd_demo.mdcd_demo_id to a minted DEMOS uuid; populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc
 *
 * Id map: legacy mysql_raw.mdcd_demo.mdcd_demo_id (int) -> DEMOS uuid.
 * See docs/developer/reference-id-maps.adoc.
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/10_stg/18_populate_id_map_mdcd_demo.sql: the build applies
 * 05_id_maps BEFORE 10_stg, and the demonstration-ID invariant requires
 * populating the map only from stg._valid_demo_ids (a 10_stg view), so the
 * INSERT cannot run here. Creating the table in 05 keeps it available by
 * name to any stg/app transform that JOINs the map.
 */
CREATE TABLE IF NOT EXISTS migration._id_map_mdcd_demo(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

