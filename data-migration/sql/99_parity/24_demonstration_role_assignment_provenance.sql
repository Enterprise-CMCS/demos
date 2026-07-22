/*
 * Purpose:    Asserts integrity + provenance of demos_app.demonstration_role_assignment, plus a flags view of candidate tuples that did not load.
 * Inputs:     demos_app.demonstration_role_assignment; demos_app.person; demos_app.role_person_type; demos_app.person_state; demos_app.demonstration; migration._id_map_users; migration._id_map_mdcd_demo; stg.demonstration_role_assignment_resolved
 * Outputs:    migration._parity_demonstration_role_assignment_integrity; migration._parity_demonstration_role_assignment_flags
 * Invariants: Integrity view non-empty -> RED at Gate 6, vacuously GREEN until the guarded loader populates the base table; flags view is conditional-DDL guarded with an empty stand-in when stg.demonstration_role_assignment_resolved is absent (so the idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "demonstration role assignment" CheckResult
 *
 * Parity check: integrity + provenance of demos_app.demonstration_role_assignment.
 *
 * migration._parity_demonstration_role_assignment_integrity surfaces hard
 * violations among the LOADED rows (RED at Gate 6):
 *   a) a row whose (person_id, person_type_id) has no demos_app.person;
 *   b) a (role_id, person_type_id) not permitted by demos_app.role_person_type;
 *   c) a row whose (person_id, state_id) has no demos_app.person_state grant;
 *   d) a row whose (demonstration_id, state_id) has no demos_app.demonstration;
 *   e) a person_id the migration did not mint (migration._id_map_users);
 *   f) a demonstration_id the migration did not mint (_id_map_mdcd_demo).
 * The loader's JOINs already enforce (a)-(d), so a non-empty result is a real
 * defect; the check is the belt-and-suspenders that proves it.
 *
 * migration._parity_demonstration_role_assignment_flags surfaces candidate
 * tuples (from stg.demonstration_role_assignment_resolved) that did NOT load
 * and the reason, for SME triage (PENDING): a person_type the Demonstration
 * role forbids, a person not authorized for the demonstration's state (e.g. a
 * state POC on an out-of-state demonstration), or a demonstration that did not
 * load. It also exposes legacy_user_id and legacy_demonstration_id (resolved
 * via the id-maps) so the SME accepted-flags baseline in reports/parity_accepted/
 * keys on stable legacy ids rather than the non-deterministic gen_random_uuid()
 * surrogates. It is a guarded view with an empty stand-in when the stg resolver
 * is not built (e.g. a deeper-layer idempotency harness).
 *
 * Both views return 0 rows until the guarded loader populates the base table,
 * so they are vacuously GREEN beforehand. Consumed by
 * migration/phases/parity.py as the "demonstration role assignment" CheckResult.
 */
SET search_path TO demos_app, migration, public;

CREATE OR REPLACE VIEW migration._parity_demonstration_role_assignment_integrity AS
SELECT
  dra.person_id::text AS offending_id,
  dra.demonstration_id::text AS demonstration_id,
  dra.role_id,
  'dra_without_matching_person' AS reason
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN demos_app.person p ON p.id = dra.person_id
    AND p.person_type_id = dra.person_type_id
WHERE
  p.id IS NULL
UNION ALL
SELECT
  dra.person_id::text,
  dra.demonstration_id::text,
  dra.role_id,
  'dra_role_person_type_not_permitted'
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN demos_app.role_person_type rp ON rp.role_id = dra.role_id
    AND rp.person_type_id = dra.person_type_id
WHERE
  rp.role_id IS NULL
UNION ALL
SELECT
  dra.person_id::text,
  dra.demonstration_id::text,
  dra.role_id,
  'dra_without_person_state'
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN demos_app.person_state ps ON ps.person_id = dra.person_id
    AND ps.state_id = dra.state_id
WHERE
  ps.person_id IS NULL
UNION ALL
SELECT
  dra.person_id::text,
  dra.demonstration_id::text,
  dra.role_id,
  'dra_demonstration_state_mismatch'
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN demos_app.demonstration dm ON dm.id = dra.demonstration_id
    AND dm.state_id = dra.state_id
WHERE
  dm.id IS NULL
UNION ALL
SELECT
  dra.person_id::text,
  dra.demonstration_id::text,
  dra.role_id,
  'dra_person_not_in_id_map'
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN migration._id_map_users m ON m.new_uuid = dra.person_id
WHERE
  m.new_uuid IS NULL
UNION ALL
SELECT
  dra.person_id::text,
  dra.demonstration_id::text,
  dra.role_id,
  'dra_demonstration_not_in_id_map'
FROM
  demos_app.demonstration_role_assignment dra
  LEFT JOIN migration._id_map_mdcd_demo m ON m.new_uuid = dra.demonstration_id
WHERE
  m.new_uuid IS NULL;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_role_assignment_resolved') IS NOT NULL THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_demonstration_role_assignment_flags AS
      WITH cand AS (
        SELECT DISTINCT person_id, demonstration_id, role_id, state_id, person_type_id
        FROM stg.demonstration_role_assignment_resolved
      ),
      not_loaded AS (
        SELECT c.* FROM cand c
        WHERE NOT EXISTS (
          SELECT 1 FROM demos_app.demonstration_role_assignment dra
          WHERE dra.person_id = c.person_id
            AND dra.demonstration_id = c.demonstration_id
            AND dra.role_id = c.role_id)
      ),
      flagged AS (
        SELECT person_id, demonstration_id, role_id, person_type_id,
               'person_type_not_permitted' AS reason
          FROM not_loaded c
         WHERE NOT EXISTS (SELECT 1 FROM demos_app.role_person_type rp
                            WHERE rp.role_id = c.role_id AND rp.person_type_id = c.person_type_id)
        UNION ALL
        SELECT person_id, demonstration_id, role_id, person_type_id,
               'person_state_missing_for_state'
          FROM not_loaded c
         WHERE NOT EXISTS (SELECT 1 FROM demos_app.person_state ps
                            WHERE ps.person_id = c.person_id AND ps.state_id = c.state_id)
        UNION ALL
        SELECT person_id, demonstration_id, role_id, person_type_id,
               'demonstration_not_loaded'
          FROM not_loaded c
         WHERE NOT EXISTS (SELECT 1 FROM demos_app.demonstration dm
                            WHERE dm.id = c.demonstration_id AND dm.state_id = c.state_id)
      )
      -- Resolve the minted UUIDs back to stable legacy keys so the SME
      -- accepted-flags baseline (reports/parity_accepted/) survives the
      -- non-deterministic gen_random_uuid() id-map across rebuilds.
      SELECT f.person_id, f.demonstration_id, f.role_id, f.person_type_id, f.reason,
             um.legacy_int_id AS legacy_user_id,
             COALESCE(dm.legacy_int_id, pdm.legacy_int_id) AS legacy_demonstration_id
        FROM flagged f
        LEFT JOIN migration._id_map_users um ON um.new_uuid = f.person_id
        LEFT JOIN migration._id_map_mdcd_demo dm ON dm.new_uuid = f.demonstration_id
        LEFT JOIN migration._id_map_mdcd_pendg_demo pdm ON pdm.new_uuid = f.demonstration_id
    $v$;
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_demonstration_role_assignment_flags AS
      SELECT NULL::uuid AS person_id, NULL::uuid AS demonstration_id,
             NULL::text AS role_id, NULL::text AS person_type_id, NULL::text AS reason,
             NULL::bigint AS legacy_user_id, NULL::bigint AS legacy_demonstration_id
       WHERE false
    $v$;
  END IF;
END
$$;

