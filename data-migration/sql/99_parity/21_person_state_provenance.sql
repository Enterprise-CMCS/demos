/*
 * Purpose:    Asserts integrity + provenance of migrated demos_app.person_state, plus a flags view of source-side anomalies that were intentionally not turned into grants.
 * Inputs:     demos_app.person_state; demos_app.person; demos_app.state; migration._id_map_users; stg.person_state_flags
 * Outputs:    migration._parity_person_state_integrity; migration._parity_person_state_flags
 * Invariants: Integrity view non-empty -> RED at Gate 6, vacuously GREEN until the guarded loaders populate the base table; flags view is a conditional-DDL guarded passthrough of stg.person_state_flags with an empty stand-in when stg is absent (so the idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "person_state integrity" CheckResult; sql/10_stg/23_person_state_resolved.sql
 *
 * Parity check: integrity + provenance of the migrated demos_app.person_state.
 *
 * migration._parity_person_state_integrity surfaces hard violations among the
 * LOADED rows (RED at Gate 6):
 *   a) a person_state row whose person_id has no demos_app.person;
 *   b) a state_id that is not a known demos_app.state (FK target);
 *   c) a person_id the migration did not mint (migration._id_map_users).
 *
 * migration._parity_person_state_flags surfaces source-side anomalies that
 * were intentionally NOT turned into grants and need SME triage (PENDING):
 * non-CMS users authorized for 'XX' (all states) and unmapped state codes.
 * It is a guarded passthrough of stg.person_state_flags (built in
 * sql/10_stg/23_person_state_resolved.sql), with an empty stand-in when stg
 * is not built (e.g. the deeper-layer idempotency harness).
 *
 * Both views return 0 rows until the guarded loaders populate the base table,
 * so they are vacuously GREEN beforehand. Consumed by
 * migration/phases/parity.py as the "person_state integrity" CheckResult.
 */
SET search_path TO demos_app, migration, public;

CREATE OR REPLACE VIEW migration._parity_person_state_integrity AS
SELECT
  ps.person_id::text AS offending_id,
  ps.state_id,
  'person_state_without_person' AS reason
FROM
  demos_app.person_state ps
  LEFT JOIN demos_app.person p ON p.id = ps.person_id
WHERE
  p.id IS NULL
UNION ALL
SELECT
  ps.person_id::text,
  ps.state_id,
  'person_state_state_not_in_state'
FROM
  demos_app.person_state ps
  LEFT JOIN demos_app.state s ON s.id = ps.state_id
WHERE
  s.id IS NULL
UNION ALL
SELECT
  ps.person_id::text,
  ps.state_id,
  'person_state_person_not_in_id_map'
FROM
  demos_app.person_state ps
  LEFT JOIN migration._id_map_users m ON m.new_uuid = ps.person_id
WHERE
  m.new_uuid IS NULL;

DO $$
BEGIN
  IF to_regclass('stg.person_state_flags') IS NOT NULL THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_person_state_flags AS
      SELECT user_id, person_id, email, state_cd, reason FROM stg.person_state_flags
    $v$;
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_person_state_flags AS
      SELECT NULL::bigint AS user_id, NULL::uuid AS person_id, NULL::text AS email,
             NULL::text AS state_cd, NULL::text AS reason
       WHERE false
    $v$;
  END IF;
END
$$;

