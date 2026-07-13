/*
 * Purpose:    Unpivot the 15 per-role user_id FK columns on each kept demonstration into candidate (person, demonstration, role) tuples for the RBAC loader.
 * Inputs:     mysql_raw.mdcd_demo, stg._valid_demo_ids, migration._id_map_mdcd_demo, mysql_raw.crosswalk_state, mysql_raw.crosswalk_demonstration_role, migration._id_map_users, stg.users_resolved
 * Outputs:    CREATE OR REPLACE VIEW stg.demonstration_role_assignment_resolved
 * Invariants: source-only (mysql_raw + migration + stg); idempotent (CREATE OR REPLACE VIEW); emits ALL candidate tuples (no person_type/person_state filter -- composite-FK satisfaction enforced by the loader); live mdcd_demo only (pending out of scope); treat_zero_as_null honored.
 * Refs:       -
 *
 * Staging projection for demos_app.demonstration_role_assignment, the
 * demonstration-level (Demonstration grant) RBAC rows. Source-only (mysql_raw +
 * migration + stg), consumed by sql/23_app_derived/30_demonstration_role_assignment.sql
 * and 40_primary_demonstration_role_assignment.sql.
 *
 * SOURCE: PMDA has no (user, demonstration, role) association table. mdcd_demo
 * carries one user_id FK column per functional role; each populated column on a
 * kept demonstration is one (person, demonstration, role) tuple, with the role
 * fixed by the COLUMN (mapped via mysql_raw.crosswalk_demonstration_role,
 * sql/04_crosswalks/46_demonstration_role.sql). The 15 columns are unpivoted
 * here so the mapping stays data-driven.
 *
 * This view emits ALL candidate tuples. It does NOT filter on person_type or
 * person_state (a Demonstration role has no single required person_type), so
 * the row-by-row composite-FK satisfaction is enforced by the loader's JOINs:
 *   demonstration_role_assignment(person_id, person_type_id) -> person
 *   demonstration_role_assignment(role_id, person_type_id)   -> role_person_type
 *   demonstration_role_assignment(person_id, state_id)       -> person_state
 *   demonstration_role_assignment(demonstration_id, state_id)-> demonstration
 * Candidates that cannot satisfy a target FK are dropped by the loader and
 * surfaced in migration._parity_demonstration_role_assignment_flags for SME
 * review (e.g. a demos-state-user sitting in a CMS column, or a state POC on a
 * demonstration in a state they are not authorized for).
 *
 * state_id is the demonstration's own state (geo_ansi_state_cd -> crosswalk_state),
 * which is exactly the value the demonstration loader stores on demos_app.demonstration,
 * so it satisfies both the person_state and demonstration legs of the composite FK.
 *
 * SCOPE: live mdcd_demo only. mdcd_pendg_demo rows are intentionally absent
 * from the crosswalk (they are not yet loaded as demonstrations), so adding the
 * pending source later is a crosswalk + a second unpivot block, no schema change.
 *
 * is_primary / source_column carry through so 40_primary_demonstration_role_assignment.sql
 * can pick the single primary project officer per demonstration.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.demonstration_role_assignment_resolved AS SELECT DISTINCT
  mu.new_uuid AS person_id,
  md.new_uuid AS demonstration_id,
  cw.role_id AS role_id,
  cw.grant_level_id AS grant_level_id,
  cs.demos_text_id AS state_id,
  ur.person_type_id AS person_type_id,
  cw.is_primary AS is_primary,
  col.source_column AS source_column
FROM
  mysql_raw.mdcd_demo d
  JOIN stg._valid_demo_ids v ON v.demo_id = d.mdcd_demo_id
  JOIN migration._id_map_mdcd_demo md ON md.legacy_int_id = d.mdcd_demo_id
  JOIN mysql_raw.crosswalk_state cs ON cs.legacy_cd = d.geo_ansi_state_cd
  CROSS JOIN LATERAL (
    VALUES ('proj_ofcr_user_id', d.proj_ofcr_user_id),
('bkup_proj_ofcr_user_id', d.bkup_proj_ofcr_user_id),
('ro_fincl_lead_user_id', d.ro_fincl_lead_user_id),
('tchncl_drctr_user_id', d.tchncl_drctr_user_id),
('mntrg_eval_tchncl_drctr_user_id', d.mntrg_eval_tchncl_drctr_user_id),
('ro_mntrg_lead_user_id', d.ro_mntrg_lead_user_id),
('anlyst_user_id', d.anlyst_user_id),
('anlyst_scndry_user_id', d.anlyst_scndry_user_id),
('mc_anlyst_id', d.mc_anlyst_id),
('hcbs_anlyst_id', d.hcbs_anlyst_id),
('state_prmry_poc_user_id', d.state_prmry_poc_user_id),
('state_scndry_poc_user_id', d.state_scndry_poc_user_id),
('state_3rd_poc_user_id', d.state_3rd_poc_user_id),
('state_4th_poc_user_id', d.state_4th_poc_user_id),
('state_5th_poc_user_id', d.state_5th_poc_user_id)) AS col(source_column, legacy_user_id)
  JOIN mysql_raw.crosswalk_demonstration_role cw ON cw.source_table = 'mdcd_demo'
      AND cw.source_column = col.source_column
    JOIN migration._id_map_users mu ON mu.legacy_int_id = col.legacy_user_id
    JOIN stg.users_resolved ur ON ur.new_uuid = mu.new_uuid
  WHERE
    col.legacy_user_id IS NOT NULL
      AND NOT (cw.treat_zero_as_null
        AND col.legacy_user_id = 0);

