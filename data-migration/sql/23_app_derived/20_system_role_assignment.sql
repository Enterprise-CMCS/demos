/*
 * Purpose:    Load demos_app.system_role_assignment (user-level System RBAC) from stg.system_role_assignment_resolved.
 * Inputs:     stg.system_role_assignment_resolved; demos_app.person (composite JOIN).
 * Outputs:    demos_app.system_role_assignment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; the JOIN to person on (id, person_type_id) makes the composite FK satisfiable row-by-row; role_id/grant_level_id/person_type_id were already validated against the DEMOS seeds by sql/04_crosswalks/45_system_role_check.sql; guarded inert until the resolved view is built and demos_app.person is loaded; idempotent via ON CONFLICT (person_id, role_id) DO NOTHING.
 * Refs:       sql/04_crosswalks/45_system_role_check.sql
 *
 * App load: demos_app.system_role_assignment (user-level System RBAC) from
 * stg.system_role_assignment_resolved.
 *
 * The JOIN to demos_app.person on (id, person_type_id) guarantees the
 * composite FK system_role_assignment(person_id, person_type_id) ->
 * person(id, person_type_id) is satisfiable row-by-row; role_id /
 * grant_level_id / person_type_id were already validated against the DEMOS
 * seeds by sql/04_crosswalks/45_system_role_check.sql.
 *
 * GUARDED / inert until stg.system_role_assignment_resolved is built and
 * demos_app.person is loaded.
 *
 * Idempotent: ON CONFLICT (person_id, role_id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.system_role_assignment_resolved') IS NULL THEN
    RAISE NOTICE 'skip system_role_assignment load: stg.system_role_assignment_resolved not built yet';
    RETURN;
  END IF;
  IF NOT EXISTS(
    SELECT
      1
    FROM
      demos_app.person) THEN
  RAISE NOTICE 'skip system_role_assignment load: demos_app.person not yet loaded';
  RETURN;
END IF;
INSERT INTO demos_app.system_role_assignment(person_id, role_id, person_type_id, grant_level_id)
SELECT
  r.person_id,
  r.role_id,
  r.person_type_id,
  r.grant_level_id
FROM
  stg.system_role_assignment_resolved r
  JOIN demos_app.person p ON p.id = r.person_id
    AND p.person_type_id = r.person_type_id
  ON CONFLICT(person_id,
    role_id)
    DO NOTHING;
END
$$;

