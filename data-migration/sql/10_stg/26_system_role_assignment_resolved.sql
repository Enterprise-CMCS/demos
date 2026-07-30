/*
 * Purpose:    Project the user-level (System grant) RBAC rows: one System role per migrated user, derived from the user's person_type.
 * Inputs:     stg.users_resolved, mysql_raw.crosswalk_system_role
 * Outputs:    CREATE OR REPLACE VIEW stg.system_role_assignment_resolved
 * Invariants: source-only (mysql_raw + stg); idempotent (CREATE OR REPLACE VIEW); exactly one System role per user (person_type is 1:1 with a System role in the crosswalk); composite FKs stay satisfiable because the row's person_type is the user's own person_type and the crosswalk pairs it with a role_person_type-permitted role.
 * Refs:       sql/04_crosswalks/44_system_role.sql
 *
 * Staging projection for demos_app.system_role_assignment, the user-level
 * (System grant) RBAC rows. Source-only (mysql_raw + stg), consumed by
 * sql/23_app_derived/20_system_role_assignment.sql.
 *
 * Every migrated user gets the System role that matches its derived
 * person_type (stg.users_resolved, most-privileged-role-wins), via
 * mysql_raw.crosswalk_system_role (sql/04_crosswalks/44_system_role.sql), which
 * pairs each person_type with exactly one System role (demos-admin -> Admin
 * User, demos-cms-user -> CMS User, demos-state-user -> State User). This
 * matches how DEMOS creates users in-app and how the dbt loader derives system
 * roles, so a CMS user (who has no legacy System role code) still receives the
 * CMS User role instead of loading permission-less.
 *
 * The composite FKs stay satisfiable row-by-row because the emitted
 * person_type_id is the user's own person_type and the crosswalk only carries
 * role_person_type-permitted pairings (enforced by 45_system_role_check.sql):
 *   system_role_assignment(person_id, person_type_id) -> person(id, person_type_id)
 *   system_role_assignment(role_id, person_type_id)   -> role_person_type(...)
 *
 * user_role_asgnmt has no demonstration context, so the Demonstration-level
 * roles are out of scope and live in a separate workstream
 * (46_demonstration_role.sql).
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.system_role_assignment_resolved AS SELECT DISTINCT
  r.new_uuid AS person_id,
  csr.role_id AS role_id,
  r.person_type_id AS person_type_id,
  csr.grant_level_id AS grant_level_id
FROM
  stg.users_resolved r
  JOIN mysql_raw.crosswalk_system_role csr ON csr.person_type_id = r.person_type_id;

