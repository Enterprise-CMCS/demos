/*
 * Purpose: Create the (empty) migration._id_map_mdcd_dlvrbl table mapping legacy mdcd_dlvrbl.mdcd_dlvrbl_id to a minted DEMOS uuid; populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc
 *
 * Id map: legacy mysql_raw.mdcd_dlvrbl.mdcd_dlvrbl_id (int) -> DEMOS uuid.
 * See docs/developer/reference-id-maps.adoc.
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/10_stg/26_populate_id_map_mdcd_dlvrbl.sql: the build applies 05_id_maps
 * BEFORE 10_stg, and the map is populated only from stg._valid_dlvrbl_ids (a
 * 10_stg view, defined in 15_filter_dlvrbl.sql), so the INSERT cannot run here.
 * Creating the table in 05 keeps it available by name to any stg/app transform
 * that JOINs the map (sql/10_stg/28_deliverable_resolved.sql,
 * sql/20_app/40_deliverable.sql).
 */
CREATE TABLE IF NOT EXISTS migration._id_map_mdcd_dlvrbl(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

