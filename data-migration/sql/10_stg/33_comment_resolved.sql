/*
 * Purpose:    Project each deliverable comment (direct + paper) into the column set the demos_app private/public comment loader consumes; one row per comment that minted a UUID.
 * Inputs:     mysql_raw.mdcd_dlvrbl_cmt, mysql_raw.mdcd_dlvrbl_paper_cmt, mysql_raw.mdcd_dlvrbl_paper, migration._id_map_mdcd_dlvrbl_cmt, migration._id_map_mdcd_dlvrbl_paper_cmt, migration._id_map_mdcd_dlvrbl, migration._id_map_users, stg.users_resolved
 * Outputs:    CREATE OR REPLACE VIEW stg.comment_resolved
 * Invariants: source-only (mysql_raw + id maps + stg only; never crosswalks 04 / seeds 02); idempotent (CREATE OR REPLACE VIEW); deliverable_id always resolvable (inner join the deliverable id map -- the same cascade that minted the comment UUID); routing (private vs public) and the author-person-type floor are deferred to the loader.
 * Refs:       docs/specs/comment-deliverable-resourcing-spec.md, reports/source_target_columns.csv, sql/20_app/50_comment.sql
 *
 * Staging projection of each deliverable comment into the column set the
 * demos_app.private_comment / demos_app.public_comment loader consumes
 * (sql/20_app/50_comment.sql). Two source families are unioned:
 *   - mdcd_dlvrbl_cmt        direct deliverable comments; carry the cmt_orgn_cd
 *                            routing key.
 *   - mdcd_dlvrbl_paper_cmt  comments on a deliverable paper; reach the
 *                            deliverable through mdcd_dlvrbl_paper (the 2-hop)
 *                            and carry NO origin code.
 *
 * Source-only by design: this view references ONLY mysql_raw source tables, the
 * id maps, and stg.users_resolved -- never the crosswalks (04) or seeds (02).
 * The cmt_orgn_cd -> route crosswalk (crosswalk_comment_origin), the CMS-vs-state
 * author default, and the cms_user_person_type_limit floor all live in the
 * loader, which runs after crosswalks + seeds.
 *
 * Column derivations (see reports/source_target_columns.csv):
 *   new_uuid                  shared UUID from the comment id map
 *   deliverable_id            parent deliverable UUID via
 *                             migration._id_map_mdcd_dlvrbl (direct, or the paper
 *                             2-hop); inner join, so only comments whose parent
 *                             deliverable minted a UUID appear here
 *   author_user_id            comment author via migration._id_map_users
 *                             (LEFT JOIN; NULL -> held back by the loader)
 *   author_person_type_id     that author's person_type via stg.users_resolved;
 *                             the loader routes a non-CMS author to public and
 *                             holds back any private-routed non-CMS author
 *   content                   btrim(cmt_txt); the loader holds back empty content
 *   origin_cd                 cmt_orgn_cd for direct comments, NULL for paper
 *                             comments (no origin code -> author-default route)
 *   created_at / updated_at   creatd_dt (the source carries no updated column)
 *   source                    'dlvrbl' | 'paper' (provenance for parity)
 *
 * cmt_aftr_acptd_ind has no DEMOS target column and is dropped (SME to confirm).
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.comment_resolved AS
SELECT
  c.mdcd_dlvrbl_cmt_id AS legacy_id,
  m.new_uuid AS new_uuid,
  dm.new_uuid AS deliverable_id,
  au.new_uuid AS author_user_id,
  ur.person_type_id AS author_person_type_id,
  btrim(c.cmt_txt) AS content,
  c.cmt_orgn_cd AS origin_cd,
  c.creatd_dt::timestamptz AS created_at,
  c.creatd_dt::timestamptz AS updated_at,
  'dlvrbl'::text AS source
FROM
  mysql_raw.mdcd_dlvrbl_cmt c
  JOIN migration._id_map_mdcd_dlvrbl_cmt m ON m.legacy_int_id = c.mdcd_dlvrbl_cmt_id
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = c.mdcd_dlvrbl_id
  LEFT JOIN migration._id_map_users au ON au.legacy_int_id = c.user_id
  LEFT JOIN stg.users_resolved ur ON ur.new_uuid = au.new_uuid
UNION ALL
SELECT
  pc.mdcd_dlvrbl_paper_cmt_id AS legacy_id,
  pm.new_uuid AS new_uuid,
  dm.new_uuid AS deliverable_id,
  au.new_uuid AS author_user_id,
  ur.person_type_id AS author_person_type_id,
  btrim(pc.cmt_txt) AS content,
  NULL::text AS origin_cd,
  pc.creatd_dt::timestamptz AS created_at,
  pc.creatd_dt::timestamptz AS updated_at,
  'paper'::text AS source
FROM
  mysql_raw.mdcd_dlvrbl_paper_cmt pc
  JOIN migration._id_map_mdcd_dlvrbl_paper_cmt pm ON pm.legacy_int_id = pc.mdcd_dlvrbl_paper_cmt_id
  JOIN mysql_raw.mdcd_dlvrbl_paper p ON p.mdcd_dlvrbl_paper_id = pc.mdcd_dlvrbl_paper_id
  JOIN migration._id_map_mdcd_dlvrbl dm ON dm.legacy_int_id = p.mdcd_dlvrbl_id
  LEFT JOIN migration._id_map_users au ON au.legacy_int_id = pc.user_id
  LEFT JOIN stg.users_resolved ur ON ur.new_uuid = au.new_uuid;
