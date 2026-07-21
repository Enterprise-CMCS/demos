/*
 * Purpose:    Mint a stable UUID per budget-neutrality override note (one per deliverable that minted a UUID and carries a non-empty override comment) into the override-note id map.
 * Inputs:     mysql_raw.mdcd_dlvrbl, migration._id_map_mdcd_dlvrbl
 * Outputs:    INSERT INTO migration._id_map_override_note (ON CONFLICT DO NOTHING)
 * Invariants: source-only; idempotent via ON CONFLICT DO NOTHING (UUID stability); cascades from the deliverable id map, so no UUID is minted for a note whose parent deliverable was dropped by the demo/deliverable filter; only deliverables with a non-empty bdgt_ntrlty_ovrrd_cmt_txt mint a note.
 * Refs:       docs/developer/reference-id-maps.adoc, reports/crosswalks/proposed/deliverable_type_bn_routing.md
 *
 * Populate migration._id_map_override_note from PMDA-valid deliverables (those
 * that minted a UUID in migration._id_map_mdcd_dlvrbl, populated in
 * 26_populate_id_map_mdcd_dlvrbl.sql) that carry a non-empty budget-neutrality
 * override comment. Runs after the id maps (build applies 05_id_maps then
 * 10_stg).
 *
 * ON CONFLICT DO NOTHING keeps each note's UUID stable across rebuilds on the
 * same mysql_raw snapshot. The join to the deliverable id map cascades the
 * demo/deliverable filter (which already excludes soft-deleted deliverables),
 * so a note whose parent deliverable was dropped gets no UUID (and so cannot be
 * loaded).
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_override_note(legacy_int_id)
SELECT
  d.mdcd_dlvrbl_id
FROM
  mysql_raw.mdcd_dlvrbl d
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = d.mdcd_dlvrbl_id
WHERE
  btrim(coalesce(d.bdgt_ntrlty_ovrrd_cmt_txt, '')) <> '' ON CONFLICT
      DO NOTHING;

