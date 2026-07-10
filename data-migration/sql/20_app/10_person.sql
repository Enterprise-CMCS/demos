/*
 * Purpose:    Load demos_app.person, one row per migrated account, so the composite users -> person FK has its prerequisite parent present.
 * Inputs:     stg.users_resolved (person.id reuses the shared UUID minted in migration._id_map_users).
 * Outputs:    demos_app.person
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until stg.users_resolved is built and every row resolves a non-NULL person_type (person.person_type_id is NOT NULL); contact-only persons (P5) load via their own loader; idempotent via ON CONFLICT (id) DO NOTHING.
 * Refs:       docs/developer/reference-users-person-migration.adoc, sql/04_crosswalks/42_role_person_type.sql
 *
 * App load: demos_app.person from migrated users (stg.users_resolved).
 *
 * Every migrated account needs a person row: the composite FK
 * users(id, person_type_id) -> person(id, person_type_id) makes person a
 * prerequisite for users, so person.id reuses the shared UUID from
 * migration._id_map_users. (Contact-only persons -- the mdcd_*_cntct
 * deferral, P5 -- are added by their own loader, not here.)
 *
 * Every migrated user has a real, validated email (17_filter_user.sql
 * requires it), so demos_app.person.email (NOT NULL) is satisfied without
 * any schema change. The person_type domain is already seeded by the
 * pinned Prisma DDL (demos-admin, demos-cms-user, demos-state-user,
 * non-user-contact), so no Tier C seeding is needed.
 *
 * person_type is derived in stg.users_resolved from each user's role
 * assignment (sql/04_crosswalks/42_role_person_type.sql) with an euaId
 * fallback, so every row resolves a non-NULL person_type. The guards below
 * keep the loader inert when stg.users_resolved has not been built yet
 * (e.g. the idempotency harness) and act as a safety net should any role
 * code go unmapped (person.person_type_id is NOT NULL).
 * See docs/developer/reference-users-person-migration.adoc.
 *
 * Idempotent: ON CONFLICT (id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.users_resolved') IS NULL THEN
    RAISE NOTICE 'skip person load: stg.users_resolved not built yet';
    RETURN;
  END IF;
  IF EXISTS(
    SELECT
      1
    FROM
      stg.users_resolved
    WHERE
      person_type_id IS NULL) THEN
  RAISE NOTICE 'skip person load: person_type derivation pending (role crosswalk)';
  RETURN;
END IF;
INSERT INTO demos_app.person(id, person_type_id, email, first_name, last_name, created_at, updated_at)
SELECT
  r.new_uuid,
  r.person_type_id,
  r.email,
  r.first_name,
  r.last_name,
  r.created_at,
  r.updated_at
FROM
  stg.users_resolved r
ON CONFLICT(id)
  DO NOTHING;
END
$$;

