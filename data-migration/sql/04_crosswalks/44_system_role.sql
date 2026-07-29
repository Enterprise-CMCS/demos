/*
 * Purpose:    Define (DDL) the crosswalk table mapping a user's derived DEMOS person_type to its System-grant role assignment tuple (role_id, grant_level_id).
 * Inputs:     none (DDL only); rows loaded from reports/crosswalks/system_role.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_system_role
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); keyed by person_type_id (one System role per user person_type, matching demos_app.role_person_type at the System grant level); the CSV is the single source (never edit the table directly); 45_system_role_check.sql validates every row against the DEMOS seeds.
 * Refs:       reports/crosswalks/system_role.csv, sql/04_crosswalks/46_demonstration_role.sql
 *
 * Crosswalk: DEMOS user person_type -> DEMOS *system* role assignment tuple.
 * SELF-CONTAINED and deliberately scoped to the System grant level, so the
 * user-level RBAC backfill (system_role_assignment) is wired independently of
 * the Demonstration-level tuples (46_demonstration_role.sql).
 *
 * DEMOS resolves a user's permission set entirely from their
 * system_role_assignment rows (server/src/auth/user/findUserByClaims.ts), and
 * demos_app.role_person_type pairs each System role with exactly one user
 * person_type (Admin User<->demos-admin, CMS User<->demos-cms-user,
 * State User<->demos-state-user). The migration therefore assigns every
 * migrated user the System role that matches its derived person_type
 * (stg.users_resolved), so a migrated user has the same permissions it would
 * have had if created in-app. This is keyed by person_type rather than the
 * legacy role_rfrnc code so a CMS user (who has no legacy System role code)
 * still receives the CMS User role instead of loading permission-less; it
 * matches the dbt loader, which derives system roles from person_type too.
 * (The earlier code-based crosswalk keyed on role_rfrnc.role_cd -- which only
 * covered Admin=1 and State=4 -- was superseded by this person_type keying.)
 *
 * The Demonstration-level roles (codes 2, 5, 6, 7, 8, 9) require a
 * demonstration_id and are sourced from mdcd_demo / mdcd_demo_cntct in a
 * separate workstream (46_demonstration_role.sql) -- they are intentionally
 * absent here. Code 3 (Third Party Evaluation Analyst -> non-user-contact)
 * yields a person but no system role, so non-user-contact is intentionally
 * absent too.
 *
 * Each row is the (role_id, grant_level_id) the person_type's assignment
 * carries. 45_system_role_check.sql validates every row against the DEMOS
 * seeds:
 *   (role_id, grant_level_id) ∈ demos_app.role
 *   grant_level_id            ∈ demos_app.system_grant_level_limit
 *   (role_id, person_type_id) ∈ demos_app.role_person_type
 * and that every System-grant (role, person_type) pairing DEMOS seeds is
 * covered by a mapping row.
 *
 * Rows are loaded from reports/crosswalks/system_role.csv by the crosswalks
 * phase (the CSV is the single source). The CSV is committed so reviewers can
 * see the mapping at a glance, but the table regenerates from the CSV whenever
 * the crosswalks phase runs -- never edit the table directly.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_system_role;

CREATE TABLE mysql_raw.crosswalk_system_role(
  person_type_id text PRIMARY KEY,
  role_id text NOT NULL,
  grant_level_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/system_role.csv by the crosswalks phase.
