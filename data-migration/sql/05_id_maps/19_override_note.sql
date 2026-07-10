/*
 * Purpose: Create the (empty) migration._id_map_override_note table mapping a legacy deliverable id (mdcd_dlvrbl.mdcd_dlvrbl_id, one budget-neutrality override note per deliverable) to a minted DEMOS private_comment uuid; populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, reports/crosswalks/proposed/deliverable_type_bn_routing.md
 *
 * Id map: legacy mysql_raw.mdcd_dlvrbl.mdcd_dlvrbl_id (int) -> a NEW DEMOS uuid
 * for the private_comment that carries the deliverable's budget-neutrality
 * override note (bdgt_ntrlty_ovrrd_cmt_txt). The note is 1:1 with its
 * deliverable, so the deliverable id is a natural key; a fresh uuid is minted
 * (the note is a distinct row from the deliverable, so it cannot reuse the
 * deliverable's uuid).
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/10_stg/34_populate_id_map_override_note.sql: the build applies 05_id_maps
 * BEFORE 10_stg, and the map is populated only from deliverables that minted a
 * UUID and carry a non-empty override note (cascade from
 * migration._id_map_mdcd_dlvrbl), so the INSERT cannot run here. Creating the
 * table in 05 keeps it available by name to the stg/app transforms that JOIN it
 * (sql/10_stg/35_override_note_resolved.sql, sql/20_app/51_override_note.sql).
 */
CREATE TABLE IF NOT EXISTS migration._id_map_override_note(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

