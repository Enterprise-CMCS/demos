/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy role_rfrnc.role_cd to a DEMOS System-grant role assignment tuple (role_id, grant_level_id, person_type_id).
 * Inputs:     none (DDL only); rows loaded from reports/crosswalks/system_role.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_system_role
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); scoped to the System roles (codes 1, 4) only; the CSV is the single source (never edit the table directly); 45_system_role_check.sql validates every row against the DEMOS seeds.
 * Refs:       reports/crosswalks/system_role.csv, sql/04_crosswalks/46_demonstration_role.sql
 *
 * Crosswalk: legacy MySQL role_rfrnc.role_cd (integer) -> DEMOS *system* role
 * assignment tuple. SELF-CONTAINED and deliberately scoped to the two System
 * roles, so the user-level RBAC backfill (system_role_assignment) is wired
 * independently of the Demonstration-level tuples (46_demonstration_role.sql)
 * and the external-evaluator code 3. (The earlier unified crosswalk_role
 * workstream, 40_role.sql / 41_role_check.sql, was superseded by this split
 * and removed.)
 *
 * user_role_asgnmt is keyed at the USER grain (user_id, role_cd) with no
 * demonstration context, so it can only feed demos_app.system_role_assignment
 * (System grant level). The Demonstration-level roles (codes 2, 5, 6, 7, 8, 9)
 * require a demonstration_id and are sourced from mdcd_demo / mdcd_demo_cntct
 * in a separate workstream -- they are intentionally absent here. Code 3
 * (Third Party Evaluation Analyst -> non-user-contact) yields a person but no
 * role assignment, so it is intentionally absent too.
 *
 * Each row is the (role_id, grant_level_id, person_type_id) the assignment
 * carries. 45_system_role_check.sql validates every row against the DEMOS
 * seeds:
 *   (role_id, grant_level_id) ∈ demos_app.role
 *   grant_level_id            ∈ demos_app.system_grant_level_limit
 *   (role_id, person_type_id) ∈ demos_app.role_person_type
 * and that codes 1 + 4 exist in mysql_raw.role_rfrnc.
 *
 * Rows are loaded from reports/crosswalks/system_role.csv by the crosswalks
 * phase (the CSV is the single source). The CSV is committed so reviewers can
 * see the mapping at a glance, but the table regenerates from the CSV whenever
 * the crosswalks phase runs -- never edit the table directly.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_system_role;

CREATE TABLE mysql_raw.crosswalk_system_role(
  legacy_role_cd integer PRIMARY KEY,
  legacy_name text,
  role_id text NOT NULL,
  grant_level_id text NOT NULL,
  person_type_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/system_role.csv by the crosswalks phase.
