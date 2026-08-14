/*
 * Purpose:    Mint a stable UUID per deliverable-paper comment whose parent deliverable (via the paper 2-hop) minted a UUID, into the paper-comment id map.
 * Inputs:     mysql_raw.mdcd_dlvrbl_paper_cmt, mysql_raw.mdcd_dlvrbl_paper, migration._id_map_mdcd_dlvrbl
 * Outputs:    INSERT INTO migration._id_map_mdcd_dlvrbl_paper_cmt (ON CONFLICT DO NOTHING)
 * Invariants: source-only; idempotent via ON CONFLICT DO NOTHING; cascades from the deliverable id map through mdcd_dlvrbl_paper.mdcd_dlvrbl_id (2-hop), so no UUID is minted for a comment whose parent deliverable was dropped.
 * Refs:       docs/developer/reference-id-maps.adoc, docs/specs/comment-deliverable-resourcing-spec.md
 *
 * Populate migration._id_map_mdcd_dlvrbl_paper_cmt from paper comments whose
 * parent deliverable already minted a UUID. mdcd_dlvrbl_paper_cmt has no direct
 * deliverable column, so it joins through mdcd_dlvrbl_paper.mdcd_dlvrbl_id (the
 * 2-hop) into migration._id_map_mdcd_dlvrbl. Runs after the id maps (build
 * applies 05_id_maps then 10_stg).
 *
 * ON CONFLICT DO NOTHING keeps each legacy comment's UUID stable across rebuilds.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_dlvrbl_paper_cmt(legacy_int_id)
SELECT
  pc.mdcd_dlvrbl_paper_cmt_id
FROM
  mysql_raw.mdcd_dlvrbl_paper_cmt pc
  JOIN mysql_raw.mdcd_dlvrbl_paper p ON p.mdcd_dlvrbl_paper_id = pc.mdcd_dlvrbl_paper_id
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = p.mdcd_dlvrbl_id
ON CONFLICT
  DO NOTHING;
