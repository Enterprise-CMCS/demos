/*
 * Purpose:    Load demos_app.users auth accounts (one per migrated account) sharing the person UUID, with cognito_subject NULL, username NULL, is_migrated_from_pmda = true, has_logged_in = false.
 * Inputs:     stg.users_resolved; demos_app.person (JOIN), demos_app.user_person_type_limit; information_schema.columns (Tier C guard).
 * Outputs:    demos_app.users
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until demos_app.users.is_migrated_from_pmda exists (Tier C) AND demos_app.person is loaded; the composite FK users(id, person_type_id) -> person is made satisfiable by the JOIN to demos_app.person; non-auth person_types filtered via user_person_type_limit; idempotent via ON CONFLICT (id) DO NOTHING.
 * Refs:       docs/developer/reference-users-person-migration.adoc
 *
 * App load: demos_app.users (auth accounts) from migrated users.
 *
 * users.id reuses the shared UUID (= the person row's id). Authentication
 * is owned by AWS Cognito; PMDA has no cognito_subject, so every migrated
 * account is loaded with cognito_subject = NULL. CMS gov IDM binds the
 * cognito_subject (and username) at the user's first login.
 *
 * The 20260623222056_add_migrated_user_features migration adds two NOT NULL
 * columns (is_migrated_from_pmda, has_logged_in), makes cognito_subject and
 * username nullable, and adds two CHECK constraints:
 *   check_all_regular_users_are_logged_in:
 *     (NOT is_migrated_from_pmda AND has_logged_in) OR (is_migrated_from_pmda)
 *   check_external_fields_exist_for_logged_in_users:
 *     (has_logged_in AND cognito_subject IS NOT NULL AND username IS NOT NULL)
 *     OR (NOT has_logged_in AND cognito_subject IS NULL AND username IS NULL)
 * For migrated PMDA users: is_migrated_from_pmda = TRUE (satisfies the first
 * OR unconditionally) and has_logged_in = FALSE (they have not logged into
 * DEMOS yet; the app flips this on first Cognito login). Because has_logged_in
 * is FALSE, the second CHECK forces cognito_subject AND username to be NULL at
 * load; the real build drops only FKs (not CHECKs), so this must hold at insert
 * time. username is bound at first login (matched by person.email), not here.
 *
 * GUARDED / inert until the DEMOS Tier C schema work lands. The loader
 * skips with a NOTICE unless BOTH are true:
 *   1. demos_app.users.is_migrated_from_pmda exists (the Tier C flag), and
 *   2. demos_app.person has been loaded (the composite FK
 *      users(id, person_type_id) -> person requires the matching person
 *      row to exist first).
 * The JOIN to demos_app.person also guarantees the composite FK is
 * satisfiable row-by-row. Persons whose derived person_type is not an
 * auth-user type (e.g. 'non-user-contact', the external evaluator) are
 * filtered out via user_person_type_limit -- they get a person row but no
 * login. See docs/developer/reference-users-person-migration.adoc.
 *
 * Idempotent: ON CONFLICT (id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF NOT EXISTS(
    SELECT
      1
    FROM
      information_schema.columns
    WHERE
      table_schema = 'demos_app'
      AND table_name = 'users'
      AND column_name = 'is_migrated_from_pmda') THEN
  RAISE NOTICE 'skip users load: demos_app.users.is_migrated_from_pmda column absent (Tier C pending)';
  RETURN;
END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      demos_app.person) THEN
  RAISE NOTICE 'skip users load: demos_app.person not yet loaded';
  RETURN;
END IF;
INSERT INTO demos_app.users(id, person_type_id, cognito_subject, username, is_migrated_from_pmda, has_logged_in, created_at, updated_at)
SELECT
  r.new_uuid,
  r.person_type_id,
  NULL::uuid,
  NULL::text,
  TRUE,
  FALSE,
  r.created_at,
  r.updated_at
FROM
  stg.users_resolved r
  JOIN demos_app.person p ON p.id = r.new_uuid
WHERE
  r.person_type_id IN(
    SELECT
      id
    FROM
      demos_app.user_person_type_limit)
ON CONFLICT(id)
  DO NOTHING;
END
$$;

