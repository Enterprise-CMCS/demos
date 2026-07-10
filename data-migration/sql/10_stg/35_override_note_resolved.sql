/*
 * Purpose:    Project each deliverable's budget-neutrality override note into the column set the demos_app.private_comment loader consumes; one row per note that minted a UUID.
 * Inputs:     mysql_raw.mdcd_dlvrbl, migration._id_map_override_note, migration._id_map_mdcd_dlvrbl, migration._id_map_users, stg.users_resolved
 * Outputs:    CREATE OR REPLACE VIEW stg.override_note_resolved
 * Invariants: source-only (mysql_raw + id maps + stg only; never crosswalks 04 / seeds 02); idempotent (CREATE OR REPLACE VIEW); deliverable_id always resolvable (inner join the deliverable id map -- the same cascade that minted the note UUID); author resolved as updtd_user_id first then creatd_user_id, kept as a (uuid, person_type) pair; the CMS-author floor and the parent-loaded join are deferred to the loader.
 * Refs:       reports/crosswalks/proposed/deliverable_type_bn_routing.md, sql/20_app/51_override_note.sql, sql/10_stg/33_comment_resolved.sql
 *
 * Staging projection of each deliverable's budget-neutrality override note
 * (mdcd_dlvrbl.bdgt_ntrlty_ovrrd_cmt_txt) into the column set the
 * demos_app.private_comment loader consumes (sql/20_app/51_override_note.sql).
 * The note is 1:1 with its deliverable; only deliverables that minted an
 * override-note UUID (migration._id_map_override_note, populated in
 * 34_populate_id_map_override_note.sql -- non-empty note + valid deliverable)
 * appear here.
 *
 * Source-only by design: this view references ONLY mysql_raw, the id maps, and
 * stg.users_resolved -- never the crosswalks (04) or seeds (02). The
 * CMS-author-only floor (private_comment.author_person_type_id FK ->
 * cms_user_person_type_limit) and the loaded-parent join live in the loader,
 * which runs after crosswalks + seeds.
 *
 * Column derivations:
 *   new_uuid                override-note UUID from the id map
 *   deliverable_id          parent deliverable UUID via
 *                           migration._id_map_mdcd_dlvrbl (inner join, so only
 *                           notes whose parent deliverable minted a UUID appear)
 *   author_user_id          note author via migration._id_map_users, resolved
 *                           as updtd_user_id first then creatd_user_id
 *                           (LEFT JOIN; NULL -> held back by the loader)
 *   author_person_type_id   that same author's person_type via
 *                           stg.users_resolved; the loader holds back any
 *                           non-CMS author (private_comment is CMS-internal)
 *   content                 btrim(bdgt_ntrlty_ovrrd_cmt_txt); the loader holds
 *                           back empty content
 *   created_at / updated_at creatd_dt / COALESCE(updtd_dt, creatd_dt)
 *
 * Author pairing: the author uuid and its person_type are chosen together --
 * when the updtd_user_id resolves to a users row, both come from that user;
 * otherwise both come from the creatd_user_id -- so the CMS floor in the loader
 * is applied to the same user whose uuid is stored.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.override_note_resolved AS
SELECT
  d.mdcd_dlvrbl_id AS legacy_id,
  onm.new_uuid AS new_uuid,
  dm.new_uuid AS deliverable_id,
  CASE WHEN uu.new_uuid IS NOT NULL THEN
    uu.new_uuid
  ELSE
    cu.new_uuid
  END AS author_user_id,
  CASE WHEN uu.new_uuid IS NOT NULL THEN
    uur.person_type_id
  ELSE
    cur.person_type_id
  END AS author_person_type_id,
  btrim(d.bdgt_ntrlty_ovrrd_cmt_txt) AS content,
  d.creatd_dt::timestamptz AS created_at,
  COALESCE(d.updtd_dt, d.creatd_dt)::timestamptz AS updated_at
FROM
  mysql_raw.mdcd_dlvrbl d
  JOIN migration._id_map_override_note onm ON onm.legacy_int_id = d.mdcd_dlvrbl_id
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = d.mdcd_dlvrbl_id
  LEFT JOIN migration._id_map_users uu ON uu.legacy_int_id = d.updtd_user_id
  LEFT JOIN stg.users_resolved uur ON uur.new_uuid = uu.new_uuid
  LEFT JOIN migration._id_map_users cu ON cu.legacy_int_id = d.creatd_user_id
  LEFT JOIN stg.users_resolved cur ON cur.new_uuid = cu.new_uuid;

