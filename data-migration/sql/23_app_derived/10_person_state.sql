/*
 * Purpose:    Load demos_app.person_state grants: CMS users/admins to every state, other users to only their explicitly authorized states.
 * Inputs:     demos_app.person, demos_app.state, migration._id_map_users; stg.person_state_resolved (explicit branch).
 * Outputs:    demos_app.person_state
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until demos_app.person is loaded (the explicit branch additionally until stg.person_state_resolved exists); restricted to migration-minted persons (migration._id_map_users) so the provenance parity check holds; materializes the assign_cms_user_to_all_states grants here because that DEMOS trigger is installed AFTER this bulk load; idempotent via ON CONFLICT (person_id, state_id) DO NOTHING.
 * Refs:       -
 *
 * App load: demos_app.person_state (per-person state authorization).
 *
 * Two populations:
 *   (1) CMS users + admins -> EVERY demos_app.state row. This mirrors the
 *       DEMOS assign_cms_user_to_all_states trigger; that app-level trigger
 *       is installed (by refreshDbObjects.ts) AFTER this bulk load, so it
 *       does not fire for migrated persons -- we materialize the grants here.
 *   (2) state (and other non-CMS) users -> only their explicitly authorized
 *       states, from stg.person_state_resolved (the 'XX' all-states sentinel
 *       and junk codes are excluded there and surfaced in
 *       stg.person_state_flags / parity check 10).
 *
 * GUARDED / inert until demos_app.person is loaded (the FK person_state ->
 * person), and the explicit branch additionally until stg.person_state_resolved
 * exists. Restricted to migration-minted persons (migration._id_map_users) so
 * the provenance parity check holds.
 *
 * Idempotent: ON CONFLICT (person_id, state_id) DO NOTHING.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF NOT EXISTS(
    SELECT
      1
    FROM
      demos_app.person) THEN
  RAISE NOTICE 'skip person_state load: demos_app.person not yet loaded';
  RETURN;
END IF;
INSERT INTO demos_app.person_state(person_id, state_id)
SELECT
  p.id,
  s.id
FROM
  demos_app.person p
  JOIN migration._id_map_users m ON m.new_uuid = p.id
  CROSS JOIN demos_app.state s
WHERE
  p.person_type_id IN('demos-admin', 'demos-cms-user')
ON CONFLICT(person_id,
  state_id)
  DO NOTHING;
  IF to_regclass('stg.person_state_resolved') IS NOT NULL THEN
    INSERT INTO demos_app.person_state(person_id, state_id)
    SELECT
      r.person_id,
      r.state_id
    FROM
      stg.person_state_resolved r
      JOIN demos_app.person p ON p.id = r.person_id
      JOIN demos_app.state s ON s.id = r.state_id
    ON CONFLICT(person_id,
      state_id)
      DO NOTHING;
  ELSE
    RAISE NOTICE 'person_state explicit load skipped: stg.person_state_resolved not built yet';
  END IF;
END
$$;

