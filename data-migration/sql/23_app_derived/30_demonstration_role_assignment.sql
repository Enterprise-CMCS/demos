/*
 * Purpose:    Load demos_app.demonstration_role_assignment (demonstration-level RBAC) from stg.demonstration_role_assignment_resolved.
 * Inputs:     stg.demonstration_role_assignment_resolved; demos_app.demonstration, demos_app.person, demos_app.person_state, demos_app.role_person_type, demos_app.role.
 * Outputs:    demos_app.demonstration_role_assignment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; the five JOINs make every composite FK satisfiable row-by-row so any unsatisfiable candidate is dropped (not loaded) rather than failing a RESTRICT FK, and is surfaced in migration._parity_demonstration_role_assignment_flags; SELECT DISTINCT collapses multi-column folds to one row per role; guarded inert until the resolved view is built and demos_app.demonstration is loaded; idempotent via ON CONFLICT (person_id, demonstration_id, role_id) DO NOTHING.
 * Refs:       sql/99_parity/24_demonstration_role_assignment_provenance.sql
 *
 * App load: demos_app.demonstration_role_assignment (demonstration-level RBAC)
 * from stg.demonstration_role_assignment_resolved.
 *
 * The JOINs make every composite FK satisfiable row-by-row, so any candidate
 * that cannot satisfy one is dropped here (not loaded) rather than failing the
 * RESTRICT FK at constraint time:
 *   demonstration(id, state_id)           -- the assignment's state IS the demo's state
 *   person(id, person_type_id)            -- the migrated person + its derived type
 *   person_state(person_id, state_id)     -- the person must be authorized for that state
 *   role_person_type(role_id, person_type_id) -- the type may hold the role
 *   role(id, grant_level_id)              -- the role exists at this grant level
 * Dropped candidates are surfaced for SME review in
 * migration._parity_demonstration_role_assignment_flags
 * (sql/99_parity/24_demonstration_role_assignment_provenance.sql).
 *
 * Because role_id is part of the PK, a person who fills several columns that
 * fold to the same role on one demonstration collapses to one row; a person who
 * fills columns that fold to different roles gets one row per role.
 *
 * GUARDED / inert until stg.demonstration_role_assignment_resolved is built and
 * demos_app.demonstration is loaded.
 *
 * Idempotent: ON CONFLICT (person_id, demonstration_id, role_id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.demonstration_role_assignment_resolved') IS NULL THEN
    RAISE NOTICE 'skip demonstration_role_assignment load: stg.demonstration_role_assignment_resolved not built yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip demonstration_role_assignment load: demos_app.demonstration not yet loaded';
  RETURN;
END IF;
INSERT INTO demos_app.demonstration_role_assignment(person_id, demonstration_id, role_id, state_id, person_type_id, grant_level_id)
SELECT DISTINCT
  r.person_id,
  r.demonstration_id,
  r.role_id,
  r.state_id,
  r.person_type_id,
  r.grant_level_id
FROM
  stg.demonstration_role_assignment_resolved r
  JOIN demos_app.demonstration dm ON dm.id = r.demonstration_id
    AND dm.state_id = r.state_id
  JOIN demos_app.person p ON p.id = r.person_id
    AND p.person_type_id = r.person_type_id
  JOIN demos_app.person_state ps ON ps.person_id = r.person_id
    AND ps.state_id = r.state_id
  JOIN demos_app.role_person_type rpt ON rpt.role_id = r.role_id
    AND rpt.person_type_id = r.person_type_id
  JOIN demos_app.role ro ON ro.id = r.role_id
    AND ro.grant_level_id = r.grant_level_id
  ON CONFLICT (person_id,
    demonstration_id,
    role_id)
    DO NOTHING;
  SELECT
    count(*) INTO held
  FROM ( SELECT DISTINCT
      r.person_id,
      r.demonstration_id,
      r.role_id
    FROM
      stg.demonstration_role_assignment_resolved r) c
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration_role_assignment dra
    WHERE
      dra.person_id = c.person_id
      AND dra.demonstration_id = c.demonstration_id
      AND dra.role_id = c.role_id);
  IF held > 0 THEN
    RAISE NOTICE 'demonstration_role_assignment load: % candidate (person, demo, role) tuple(s) held back (person_type/person_state/demonstration FK unsatisfiable); see migration._parity_demonstration_role_assignment_flags', held;
  END IF;
END
$$;

