/*
 * Purpose: Create the (empty) migration._id_map_mdcd_dlvrbl_paper_cmt table mapping legacy mdcd_dlvrbl_paper_cmt.mdcd_dlvrbl_paper_cmt_id to a minted DEMOS uuid; populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, docs/specs/comment-deliverable-resourcing-spec.md
 *
 * Id map: legacy mysql_raw.mdcd_dlvrbl_paper_cmt.mdcd_dlvrbl_paper_cmt_id (int)
 * -> DEMOS uuid.
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/10_stg/32_populate_id_map_mdcd_dlvrbl_paper_cmt.sql: the build applies
 * 05_id_maps BEFORE 10_stg, and the map is populated only from paper comments
 * whose parent deliverable (mdcd_dlvrbl_paper.mdcd_dlvrbl_id, the 2-hop) already
 * minted a UUID (cascade from migration._id_map_mdcd_dlvrbl), so the INSERT
 * cannot run here. Creating the table in 05 keeps it available by name to any
 * stg/app transform that JOINs the map (sql/10_stg/33_comment_resolved.sql,
 * sql/20_app/50_comment.sql).
 */
CREATE TABLE IF NOT EXISTS migration._id_map_mdcd_dlvrbl_paper_cmt(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);
