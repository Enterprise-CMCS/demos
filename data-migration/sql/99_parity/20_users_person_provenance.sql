/*
 * Purpose:    Asserts integrity + provenance of the migrated person/users pair (composite FK users -> person, allowed auth person_type, id-map provenance).
 * Inputs:     demos_app.users; demos_app.person; demos_app.user_person_type_limit; migration._id_map_users
 * Outputs:    migration._parity_users_person_integrity
 * Invariants: Non-empty -> RED at Gate 6; vacuously GREEN until the guarded sql/20_app loaders populate person/users; plain view (no conditional-DDL guard), idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "users_person_integrity" CheckResult
 *
 * Parity check: integrity of the migrated person/users pair.
 *
 * Three invariants, surfaced as one view with a reason column so a single
 * CheckResult can count every violation class:
 *
 *   a) every demos_app.users row has a matching demos_app.person row on
 *      (id, person_type_id) -- the composite FK users -> person;
 *   b) every demos_app.users.person_type_id is an allowed auth person_type
 *      (present in demos_app.user_person_type_limit);
 *   c) every demos_app.users.id was minted by migration._id_map_users
 *      (no auth account appears that the migration did not create).
 *
 * Consumed by migration/phases/parity.py as the "users_person_integrity"
 * CheckResult. Non-empty -> RED at Gate 6. Returns 0 rows until the
 * guarded sql/20_app loaders populate person/users (Tier C), so it is
 * vacuously GREEN beforehand.
 */
SET search_path TO demos_app, migration, public;

CREATE OR REPLACE VIEW migration._parity_users_person_integrity AS
SELECT
  u.id AS offending_id,
  'users_without_matching_person' AS reason
FROM
  demos_app.users u
  LEFT JOIN demos_app.person p ON p.id = u.id
    AND p.person_type_id = u.person_type_id
WHERE
  p.id IS NULL
UNION ALL
SELECT
  u.id,
  'users_person_type_not_in_user_limit'
FROM
  demos_app.users u
  LEFT JOIN demos_app.user_person_type_limit l ON l.id = u.person_type_id
WHERE
  l.id IS NULL
UNION ALL
SELECT
  u.id,
  'users_id_not_in_id_map'
FROM
  demos_app.users u
  LEFT JOIN migration._id_map_users m ON m.new_uuid = u.id
WHERE
  m.new_uuid IS NULL;

