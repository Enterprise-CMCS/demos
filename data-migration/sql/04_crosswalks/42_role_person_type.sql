/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy role_rfrnc.role_cd to a DEMOS person_type (the identity class of the account).
 * Inputs:     none (DDL only); values live in reports/crosswalks/role_person_type.csv, COPY'd via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_role_person_type
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); each legacy role code maps to exactly one person_type (PK is legacy_int_cd alone); 43_role_person_type_check.sql validates completeness, names, and the person_type domain.
 * Refs:       reports/crosswalks/role_person_type.csv, reports/crosswalks/registry.yaml, sql/10_stg/21_users_resolved.sql
 *
 * Crosswalk: legacy role_rfrnc.role_cd (integer) -> DEMOS person_type.
 *
 * Distinct from the role ASSIGNMENT crosswalks (44_system_role.sql /
 * 46_demonstration_role.sql), which map a legacy role to an assignment tuple
 * and may fan out. person_type is the identity CLASS of the account
 * (admin / CMS user / state user / non-user contact), so each
 * legacy role code maps to exactly one person_type and the PK is
 * legacy_int_cd alone.
 *
 * PMDA has no system-vs-state distinction on the account, but DEMOS requires
 * person.person_type_id (NOT NULL). The legacy role NAME carries the signal:
 * the internal admin role -> demos-admin, every CMS-side role -> demos-cms-user,
 * State User -> demos-state-user, and the external evaluator -> non-user-contact
 * (a person, not a DEMOS login). When a user holds several roles the stage
 * derivation in sql/10_stg/21_users_resolved.sql keeps the most-privileged
 * (demos-admin > demos-cms-user > demos-state-user > non-user-contact); a user
 * with no role assignment falls back to the euaId CMS-vs-state signal there.
 *
 * The person_type domain values are seeded by the pinned Prisma DDL.
 * 43_role_person_type_check.sql validates completeness, the names against
 * role_rfrnc, and the values against demos_app.person_type.
 *
 * Values live in reports/crosswalks/role_person_type.csv (load-ready), COPY'd
 * via reports/crosswalks/registry.yaml. This file is DDL only.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_role_person_type;

CREATE TABLE mysql_raw.crosswalk_role_person_type(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text NOT NULL,
  person_type_id text NOT NULL,
  notes text
);

