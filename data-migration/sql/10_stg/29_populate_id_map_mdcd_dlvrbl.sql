/*
 * Purpose:    Mint a stable UUID per PMDA-valid deliverable id into the deliverable id map.
 * Inputs:     stg._valid_dlvrbl_ids
 * Outputs:    INSERT INTO migration._id_map_mdcd_dlvrbl (ON CONFLICT DO NOTHING)
 * Invariants: source-only (reads only the valid-ids view); idempotent via ON CONFLICT DO NOTHING (UUID + deliverable_history snapshot depend on stability); cascades from the demo filter, so no UUID minted for a deliverable whose parent demo was dropped.
 * Refs:       docs/developer/reference-id-maps.adoc
 *
 * Populate migration._id_map_mdcd_dlvrbl from the PMDA-valid deliverable ids
 * only (stg._valid_dlvrbl_ids, defined in 15_filter_dlvrbl.sql).
 *
 * Runs after the filter views (build applies 05_id_maps then 10_stg).
 * ON CONFLICT DO NOTHING keeps each legacy row's UUID stable across rebuilds on
 * the same mysql_raw snapshot (idempotency + the deliverable_history snapshot
 * depend on this). _valid_dlvrbl_ids already cascades from the demonstration
 * filter, so no UUID is minted for a deliverable whose parent demo was dropped.
 * See docs/developer/reference-id-maps.adoc.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_dlvrbl(legacy_int_id)
SELECT
  dlvrbl_id
FROM
  stg._valid_dlvrbl_ids
ON CONFLICT
  DO NOTHING;

