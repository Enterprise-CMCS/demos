/*
 * Purpose:    Project the user-level (System grant) RBAC rows, emitting a row only when the user's derived person_type matches the System role's required person_type.
 * Inputs:     mysql_raw.user_role_asgnmt, mysql_raw.crosswalk_system_role, migration._id_map_users, stg.users_resolved
 * Outputs:    CREATE OR REPLACE VIEW stg.system_role_assignment_resolved
 * Invariants: source-only (mysql_raw + migration + stg); idempotent (CREATE OR REPLACE VIEW); person_type must equal the role's required person_type so the composite FKs stay satisfiable row-by-row; scoped to the two System roles (codes 1 and 4).
 * Refs:       -
 *
 * Staging projection for demos_app.system_role_assignment, the user-level
 * (System grant) RBAC rows. Source-only (mysql_raw + migration + stg),
 * consumed by sql/23_app_derived/20_system_role_assignment.sql.
 *
 * Source is mysql_raw.user_role_asgnmt (PK (user_id, role_cd)), mapped through
 * mysql_raw.crosswalk_system_role (sql/04_crosswalks/44_system_role.sql),
 * which is scoped to the two System roles -- code 1 (Internal Administrator
 * -> Admin User / demos-admin) and code 4 (State User -> State User /
 * demos-state-user). user_role_asgnmt has no demonstration context, so the
 * Demonstration-level roles are out of scope and live in a separate workstream.
 *
 * A row is emitted only when the user's derived person_type (stg.users_resolved,
 * most-privileged-role-wins) equals the System role's required person_type.
 * That keeps the composite FKs satisfiable row-by-row:
 *   system_role_assignment(person_id, person_type_id) -> person(id, person_type_id)
 *   system_role_assignment(role_id, person_type_id)   -> role_person_type(...)
 * and it correctly drops, e.g., the State User assignment for a user who is
 * also an Admin (their person_type is demos-admin, so only the Admin row holds).
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.system_role_assignment_resolved AS SELECT DISTINCT
  r.new_uuid AS person_id,
  csr.role_id AS role_id,
  r.person_type_id AS person_type_id,
  csr.grant_level_id AS grant_level_id
FROM
  mysql_raw.user_role_asgnmt a
  JOIN mysql_raw.crosswalk_system_role csr ON csr.legacy_role_cd = a.role_cd
  JOIN migration._id_map_users m ON m.legacy_int_id = a.user_id
  JOIN stg.users_resolved r ON r.new_uuid = m.new_uuid
WHERE
  r.person_type_id = csr.person_type_id;

