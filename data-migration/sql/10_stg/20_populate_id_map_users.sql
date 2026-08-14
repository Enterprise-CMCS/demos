/*
 * Purpose:    Mint a stable UUID per PMDA-valid user id into the users id map.
 * Inputs:     stg._valid_user_ids
 * Outputs:    INSERT INTO migration._id_map_users (ON CONFLICT DO NOTHING)
 * Invariants: source-only (reads only the valid-ids view); idempotent via ON CONFLICT DO NOTHING (UUID stable across rebuilds on a fixed mysql_raw snapshot); no UUID minted for a user id that is not PMDA-valid.
 * Refs:       -
 *
 * Populate migration._id_map_users from the PMDA-valid user ids only
 * (stg._valid_user_ids, defined in 17_filter_user.sql).
 *
 * Runs after the filter views (build applies 05_id_maps then 10_stg).
 * ON CONFLICT DO NOTHING keeps each legacy row's UUID stable across
 * rebuilds on the same mysql_raw snapshot (idempotency depends on this).
 * No UUID is minted for a user id that is not PMDA-valid.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_users(legacy_int_id)
SELECT
  user_id
FROM
  stg._valid_user_ids
ON CONFLICT
  DO NOTHING;

