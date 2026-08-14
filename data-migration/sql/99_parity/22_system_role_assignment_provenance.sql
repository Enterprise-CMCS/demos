/*
 * Purpose:    Asserts integrity + provenance of demos_app.system_role_assignment (composite FK to person, permitted role/person_type, id-map provenance).
 * Inputs:     demos_app.system_role_assignment; demos_app.person; demos_app.role_person_type; migration._id_map_users
 * Outputs:    migration._parity_system_role_assignment_integrity
 * Invariants: Non-empty -> RED at Gate 6; vacuously GREEN until sql/23_app_derived/20_system_role_assignment.sql populates the base table; plain view (no conditional-DDL guard), idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "system_role_assignment integrity" CheckResult; sql/23_app_derived/20_system_role_assignment.sql
 *
 * Parity check: integrity + provenance of demos_app.system_role_assignment.
 *
 * migration._parity_system_role_assignment_integrity surfaces (RED at Gate 6):
 *   a) a row whose (person_id, person_type_id) has no demos_app.person
 *      (the composite FK);
 *   b) a (role_id, person_type_id) not permitted by demos_app.role_person_type;
 *   c) a person_id the migration did not mint (migration._id_map_users).
 *
 * Returns 0 rows until sql/23_app_derived/20_system_role_assignment.sql
 * populates the base table, so it is vacuously GREEN beforehand. Consumed by
 * migration/phases/parity.py as the "system_role_assignment integrity"
 * CheckResult.
 */
SET search_path TO demos_app, migration, public;

CREATE OR REPLACE VIEW migration._parity_system_role_assignment_integrity AS
SELECT
  sra.person_id::text AS offending_id,
  sra.role_id,
  'sra_without_matching_person' AS reason
FROM
  demos_app.system_role_assignment sra
  LEFT JOIN demos_app.person p ON p.id = sra.person_id
    AND p.person_type_id = sra.person_type_id
WHERE
  p.id IS NULL
UNION ALL
SELECT
  sra.person_id::text,
  sra.role_id,
  'sra_role_person_type_not_permitted'
FROM
  demos_app.system_role_assignment sra
  LEFT JOIN demos_app.role_person_type rp ON rp.role_id = sra.role_id
    AND rp.person_type_id = sra.person_type_id
WHERE
  rp.role_id IS NULL
UNION ALL
SELECT
  sra.person_id::text,
  sra.role_id,
  'sra_person_not_in_id_map'
FROM
  demos_app.system_role_assignment sra
  LEFT JOIN migration._id_map_users m ON m.new_uuid = sra.person_id
WHERE
  m.new_uuid IS NULL;

