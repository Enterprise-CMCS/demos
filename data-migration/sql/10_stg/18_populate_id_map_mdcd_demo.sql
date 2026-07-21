/*
 * Purpose:    Mint a stable UUID per PMDA-valid demonstration id into the demonstration id map.
 * Inputs:     stg._valid_demo_ids
 * Outputs:    INSERT INTO migration._id_map_mdcd_demo (ON CONFLICT DO NOTHING)
 * Invariants: source-only (reads only the valid-ids view); idempotent via ON CONFLICT DO NOTHING (UUID stable across rebuilds on a fixed mysql_raw snapshot); no UUID minted for a demo id that is not PMDA-valid.
 * Refs:       docs/developer/reference-id-maps.adoc
 *
 * Populate migration._id_map_mdcd_demo from the PMDA-valid demonstration
 * ids only (stg._valid_demo_ids, defined in 10_filter_demo.sql).
 *
 * Runs after the filter views (build applies 05_id_maps then 10_stg).
 * ON CONFLICT DO NOTHING keeps each legacy row's UUID stable across
 * rebuilds on the same mysql_raw snapshot (idempotency depends on this).
 * Enforces the demonstration-ID invariant: no UUID is
 * minted for a demo id that is not PMDA-valid. See
 * docs/developer/reference-id-maps.adoc.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_demo(legacy_int_id)
SELECT
  demo_id
FROM
  stg._valid_demo_ids
ON CONFLICT
  DO NOTHING;

