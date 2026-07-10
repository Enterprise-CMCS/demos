/*
 * Purpose:    Mint a stable UUID per PMDA-valid amendment id into the amendment id map.
 * Inputs:     stg._valid_amndmt_ids
 * Outputs:    INSERT INTO migration._id_map_mdcd_demo_amndmt (ON CONFLICT DO NOTHING)
 * Invariants: source-only (reads only the valid-ids view); idempotent via ON CONFLICT DO NOTHING (UUID stable across rebuilds on a fixed mysql_raw snapshot); no UUID minted for an amendment id that is not PMDA-valid.
 * Refs:       docs/developer/reference-id-maps.adoc
 *
 * Populate migration._id_map_mdcd_demo_amndmt from the PMDA-valid amendment
 * ids only (stg._valid_amndmt_ids, defined in 13_filter_amndmt.sql).
 *
 * Runs after the filter views (build applies 05_id_maps then 10_stg).
 * ON CONFLICT DO NOTHING keeps each legacy row's UUID stable across rebuilds on
 * the same mysql_raw snapshot (idempotency depends on this). No UUID is minted
 * for an amendment id that is not PMDA-valid. See docs/developer/reference-id-maps.adoc.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_demo_amndmt(legacy_int_id)
SELECT
  amndmt_id
FROM
  stg._valid_amndmt_ids
ON CONFLICT
  DO NOTHING;

