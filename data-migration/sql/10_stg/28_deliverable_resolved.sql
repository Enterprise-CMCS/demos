/*
 * Purpose:    Project each PMDA-valid deliverable into the column set the demos_app.deliverable loader consumes.
 * Inputs:     mysql_raw.mdcd_dlvrbl, stg._valid_dlvrbl_ids, migration._id_map_mdcd_dlvrbl, migration._id_map_mdcd_demo, migration._id_map_users, stg.users_resolved
 * Outputs:    CREATE OR REPLACE VIEW stg.deliverable_resolved
 * Invariants: source-only (mysql_raw + id maps + stg only; never crosswalks 04 / seeds 02); idempotent (CREATE OR REPLACE VIEW); soft-delete exclusion (dltd_ind = 1); status-tuple and deliverable_type routing deferred to the loader.
 * Refs:       docs/specs/pmda-cross-cutting-derivation-spec.md, reports/inputs/source_target_columns.proposed.csv
 *
 * Staging projection of each PMDA-valid deliverable (mysql_raw.mdcd_dlvrbl)
 * into the column set the demos_app.deliverable loader consumes
 * (sql/20_app/40_deliverable.sql). One row per kept deliverable
 * (stg._valid_dlvrbl_ids), carrying the shared UUID minted in
 * migration._id_map_mdcd_dlvrbl.
 *
 * Source-only by design: this view references ONLY mysql_raw source tables,
 * the id maps, and other stg views (stg._valid_dlvrbl_ids, stg.users_resolved)
 * -- never the crosswalks (04) or seeds (02). The status tuple crosswalk
 * (crosswalk_deliverable_status), the constant 'Approved' demonstration_status,
 * the parent-Approved gate and the (still-unsigned) deliverable_type routing
 * all live in the loader, which runs after crosswalks + seeds.
 *
 * Column derivations (see docs/specs/pmda-cross-cutting-derivation-spec.md and
 * reports/inputs/source_target_columns.proposed.csv):
 *   demonstration_id          parent demo UUID via migration._id_map_mdcd_demo
 *   name                      btrim(mdcd_dlvrbl_name) -- the loader holds back
 *                             an empty name (check_non_empty_name) and the
 *                             trim satisfies
 *                             check_deliverable_name_has_no_leading_trailing_whitespace
 *   status_cd                 mdcd_dlvrbl_crnt_stus_cd (loader crosswalks the
 *                             tuple status_id / due_date_type_id /
 *                             expected_to_be_submitted)
 *   cms_owner_user_id         creatd_user_id via migration._id_map_users
 *   cms_owner_person_type_id  that owner's person_type via stg.users_resolved;
 *                             the loader holds back any owner whose type is not
 *                             in cms_user_person_type_limit {demos-admin,
 *                             demos-cms-user} (a state-user creator is an
 *                             anomaly, surfaced in _parity_deliverable_held)
 *   due_date                  dlvrbl_due_dt, else dlvrbl_prd_strt_dt +
 *                             dlvrbl_days_due_num days, else dlvrbl_due_dt_chg_dt
 *   deliverable_type_cd /     carried raw; deliverable_type_cd feeds the
 *   budget_neutrality_ind     single-input deliverable_type crosswalk
 *                             (sql/04_crosswalks/52_*; the code is the rich
 *                             report-occurrence value); budget_neutrality_ind is
 *                             carried for the non-gating BN QA check only
 *                             (sql/99_parity/43_deliverable_bn_qa.sql), no longer
 *                             a routing input
 *
 * Soft deletes (mdcd_dlvrbl.dltd_ind = 1) are excluded here: whether a
 * soft-deleted deliverable should resurrect as the DEMOS 'Deleted'
 * deliverable_status is a deferred SME decision, so we do not invent it. This
 * mirrors stg.demonstration_resolved's soft-delete handling.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.deliverable_resolved AS
SELECT
  d.mdcd_dlvrbl_id AS legacy_id,
  m.new_uuid AS new_uuid,
  dm.new_uuid AS demonstration_id,
  btrim(d.mdcd_dlvrbl_name) AS name,
  d.mdcd_dlvrbl_crnt_stus_cd::int AS status_cd,
  d.mdcd_dlvrbl_type_cd::int AS deliverable_type_cd,
(d.bdgt_ntrlty_ind)::int AS budget_neutrality_ind,
  ou.new_uuid AS cms_owner_user_id,
  ur.person_type_id AS cms_owner_person_type_id,
  COALESCE(d.dlvrbl_due_dt::timestamptz,(d.dlvrbl_prd_strt_dt::date +(d.dlvrbl_days_due_num::int) * interval '1 day')::timestamptz, d.dlvrbl_due_dt_chg_dt::timestamptz) AS due_date,
  d.creatd_dt::timestamptz AS created_at,
  COALESCE(d.updtd_dt, d.creatd_dt)::timestamptz AS updated_at
FROM
  mysql_raw.mdcd_dlvrbl d
  JOIN stg._valid_dlvrbl_ids v ON v.dlvrbl_id = d.mdcd_dlvrbl_id
  JOIN migration._id_map_mdcd_dlvrbl m ON m.legacy_int_id = d.mdcd_dlvrbl_id
  JOIN migration._id_map_mdcd_demo dm ON dm.legacy_int_id = d.mdcd_demo_id
  LEFT JOIN migration._id_map_users ou ON ou.legacy_int_id = d.creatd_user_id
  LEFT JOIN stg.users_resolved ur ON ur.new_uuid = ou.new_uuid
WHERE (d.dltd_ind)::int IS DISTINCT FROM 1;

