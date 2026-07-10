/*
 * Purpose:    Load demos_app.primary_demonstration_role_assignment (one primary Project Officer per demonstration) from the is_primary tuples in stg.demonstration_role_assignment_resolved.
 * Inputs:     stg.demonstration_role_assignment_resolved; demos_app.demonstration_role_assignment (JOIN).
 * Outputs:    demos_app.primary_demonstration_role_assignment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; the JOIN to demonstration_role_assignment enforces FK051 (a primary row must reference an existing assignment), so a dropped project officer yields no primary row; the DEMOS check_demonstration_retains_primary_project_officer trigger fires only on UPDATE/DELETE and is deployed AFTER this load; guarded inert until demos_app.demonstration_role_assignment is populated; idempotent via ON CONFLICT (demonstration_id, role_id) DO NOTHING.
 * Refs:       sql/04_crosswalks/46_demonstration_role.sql
 *
 * App load: demos_app.primary_demonstration_role_assignment from the
 * is_primary tuples in stg.demonstration_role_assignment_resolved.
 *
 * DEMOS records, per (demonstration, role), the single PRIMARY holder. Only the
 * PMDA proj_ofcr_user_id column is marked is_primary in
 * crosswalk_demonstration_role, so this loads one primary Project Officer per
 * demonstration. The JOIN to demos_app.demonstration_role_assignment enforces
 * FK051 (a primary row must reference an existing assignment): if the project
 * officer was dropped upstream (person_type / person_state / unloaded demo),
 * no primary row is created for that demonstration.
 *
 * The DEMOS check_demonstration_retains_primary_project_officer trigger fires
 * only on UPDATE/DELETE and is deployed by the DEMOS app AFTER this load, so it
 * does not interfere here.
 *
 * GUARDED / inert until demos_app.demonstration_role_assignment is populated.
 *
 * Idempotent: ON CONFLICT (demonstration_id, role_id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_role_assignment_resolved') IS NULL THEN
    RAISE NOTICE 'skip primary_demonstration_role_assignment load: stg.demonstration_role_assignment_resolved not built yet';
    RETURN;
  END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      demos_app.demonstration_role_assignment) THEN
  RAISE NOTICE 'skip primary_demonstration_role_assignment load: demos_app.demonstration_role_assignment not yet loaded';
  RETURN;
END IF;
INSERT INTO demos_app.primary_demonstration_role_assignment(person_id, demonstration_id, role_id)
SELECT DISTINCT
  r.person_id,
  r.demonstration_id,
  r.role_id
FROM
  stg.demonstration_role_assignment_resolved r
  JOIN demos_app.demonstration_role_assignment dra ON dra.person_id = r.person_id
    AND dra.demonstration_id = r.demonstration_id
    AND dra.role_id = r.role_id
WHERE
  r.is_primary
ON CONFLICT(demonstration_id,
  role_id)
  DO NOTHING;
END
$$;

