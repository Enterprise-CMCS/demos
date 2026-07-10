/*
 * Purpose:    Mint a stable UUID per deliverable comment whose parent deliverable minted a UUID, into the comment id map.
 * Inputs:     mysql_raw.mdcd_dlvrbl_cmt, migration._id_map_mdcd_dlvrbl
 * Outputs:    INSERT INTO migration._id_map_mdcd_dlvrbl_cmt (ON CONFLICT DO NOTHING)
 * Invariants: source-only; idempotent via ON CONFLICT DO NOTHING (UUID stability); cascades from the deliverable id map, so no UUID is minted for a comment whose parent deliverable was dropped by the demo/deliverable filter.
 * Refs:       docs/developer/reference-id-maps.adoc, docs/specs/comment-deliverable-resourcing-spec.md
 *
 * Populate migration._id_map_mdcd_dlvrbl_cmt from deliverable comments whose
 * parent deliverable already minted a UUID (migration._id_map_mdcd_dlvrbl,
 * populated in 26_populate_id_map_mdcd_dlvrbl.sql). Runs after the id maps
 * (build applies 05_id_maps then 10_stg).
 *
 * ON CONFLICT DO NOTHING keeps each legacy comment's UUID stable across rebuilds
 * on the same mysql_raw snapshot. The join to the deliverable id map cascades
 * the demo/deliverable filter, so a comment whose parent deliverable was dropped
 * gets no UUID (and so cannot be loaded).
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_dlvrbl_cmt(legacy_int_id)
SELECT
  c.mdcd_dlvrbl_cmt_id
FROM
  mysql_raw.mdcd_dlvrbl_cmt c
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = c.mdcd_dlvrbl_id
ON CONFLICT
  DO NOTHING;
