/*
 * Purpose:    Backfill a configurable fallback primary Project Officer onto every loaded demonstration that would otherwise have none, so the DEMOS check_demonstration_primary_project_officer invariant holds.
 * Inputs:     mysql_raw.crosswalk_primary_po_fallback, migration._id_map_users, demos_app.demonstration, demos_app.person, demos_app.person_state, demos_app.role_person_type, demos_app.primary_demonstration_role_assignment, demos_app.demonstration_role_assignment.
 * Outputs:    demos_app.demonstration_role_assignment, demos_app.primary_demonstration_role_assignment, migration._primary_officer_fallback_applied (provenance).
 * Invariants: runs inside the deferred-constraint build_app txn AFTER 40_primary_demonstration_role_assignment.sql (fills only genuine gaps); the fallback demonstration_role_assignment row satisfies every composite FK row-by-row via its JOINs (demo's own state, loaded person, person_state coverage, role_person_type, role); guarded inert until crosswalk + demos_app are present; skips cleanly when there are no gaps; fail-closed if the configured fallback user is unresolvable/unloadable AND there are gaps to fill; idempotent via ON CONFLICT.
 * Refs:       sql/04_crosswalks/69_primary_po_fallback.sql, sql/99_parity/57_primary_officer_missing.sql, sql/99_parity/58_primary_officer_fallback.sql
 *
 * DEMOS requires every demonstration to have a primary_demonstration_role_assignment
 * with role_id = 'Project Officer' (check_demonstration_primary_project_officer,
 * server/src/sql/functions.sql). The primary-PO loader (40) yields no primary
 * row when the PMDA PO column is empty or the holder was dropped upstream, so
 * some loaded demonstrations lack one.
 *
 * Per the SME decision, this backfills those gaps with a configurable fallback
 * PO (mysql_raw.crosswalk_primary_po_fallback, scope 'default', legacy user 828
 * by default -- a CMS user authorized for all states). For each demonstration
 * with no primary PO it:
 *   1. inserts a demonstration_role_assignment row (fallback person as Project
 *      Officer, the demonstration's own state), and
 *   2. inserts the primary_demonstration_role_assignment row,
 * then records the demonstration in migration._primary_officer_fallback_applied
 * for SME provenance (surfaced by parity check 23).
 *
 * The fallback demonstration_role_assignment row satisfies every composite FK
 * the demonstration_role_assignment loader (30) enforces, via the same JOINs:
 *   demonstration(id, state_id)               -- the demo's own state
 *   person(id, person_type_id)                -- the loaded fallback person
 *   person_state(person_id, state_id)         -- fallback must cover that state
 *   role_person_type(role_id, person_type_id) -- the type may hold Project Officer
 *   role(id, grant_level_id)                  -- Project Officer @ Demonstration
 * A CMS-user fallback fans out to every state (person_state), so it covers any
 * demonstration's state. If a configured fallback cannot cover a given state,
 * that demonstration is simply left in the gap (logged by parity check 22)
 * rather than violating an FK.
 *
 * GUARDED / inert until the fallback crosswalk and demos_app are present.
 * Idempotent: ON CONFLICT DO NOTHING on all three writes.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
DECLARE
  fb_legacy int;
  fb_person uuid;
  n_gaps int;
  n_filled int;
BEGIN
  IF to_regclass('mysql_raw.crosswalk_primary_po_fallback') IS NULL THEN
    RAISE NOTICE 'skip primary PO fallback: crosswalk_primary_po_fallback not loaded';
    RETURN;
  END IF;
  IF to_regclass('demos_app.primary_demonstration_role_assignment') IS NULL OR NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
    RAISE NOTICE 'skip primary PO fallback: demos_app not built yet';
    RETURN;
  END IF;
  -- Authoritative for the current run: (re)create empty so a targeted rebuild
  -- never leaves stale provenance from a previous run's gap set.
  CREATE TABLE IF NOT EXISTS migration._primary_officer_fallback_applied(
    demonstration_id uuid PRIMARY KEY,
    person_id uuid NOT NULL,
    legacy_user_id integer NOT NULL
  );
  TRUNCATE migration._primary_officer_fallback_applied;
  CREATE TEMP TABLE _po_gap ON COMMIT DROP AS
  SELECT
    d.id AS demonstration_id, d.state_id AS state_id
  FROM
    demos_app.demonstration d
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.primary_demonstration_role_assignment pdra
      WHERE
        pdra.demonstration_id = d.id
        AND pdra.role_id = 'Project Officer');
    SELECT
      count(*)
    INTO
      n_gaps
    FROM
      _po_gap;
    IF n_gaps = 0 THEN
      RAISE NOTICE 'primary PO fallback: no demonstrations missing a primary Project Officer; nothing to backfill';
      RETURN;
    END IF;
    SELECT
      legacy_user_id
    INTO
      fb_legacy
    FROM
      mysql_raw.crosswalk_primary_po_fallback
    WHERE
      scope = 'default';
    IF fb_legacy IS NULL THEN
      RAISE EXCEPTION 'primary PO fallback: % demonstration(s) need a fallback but no scope=default row is configured in crosswalk_primary_po_fallback', n_gaps;
    END IF;
    SELECT
      mu.new_uuid
    INTO
      fb_person
    FROM
      migration._id_map_users mu
    WHERE
      mu.legacy_int_id = fb_legacy;
    IF fb_person IS NULL THEN
      RAISE EXCEPTION 'primary PO fallback: configured legacy user % has no migration._id_map_users entry', fb_legacy;
    END IF;
    IF NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.person p
        JOIN demos_app.role_person_type rpt ON rpt.person_type_id = p.person_type_id
      WHERE
        p.id = fb_person
        AND rpt.role_id = 'Project Officer') THEN
    RAISE EXCEPTION 'primary PO fallback: configured person % (legacy user %) is not a loaded person whose person_type may hold Project Officer', fb_person, fb_legacy;
END IF;
INSERT INTO demos_app.demonstration_role_assignment(person_id, demonstration_id, role_id, state_id, person_type_id, grant_level_id)
SELECT
  fb_person,
  g.demonstration_id,
  'Project Officer',
  g.state_id,
  p.person_type_id,
  'Demonstration'
FROM
  _po_gap g
  JOIN demos_app.person p ON p.id = fb_person
  JOIN demos_app.person_state ps ON ps.person_id = fb_person
    AND ps.state_id = g.state_id
  ON CONFLICT (person_id,
    demonstration_id,
    role_id)
    DO NOTHING;
  INSERT INTO demos_app.primary_demonstration_role_assignment(person_id, demonstration_id, role_id)
  SELECT
    fb_person,
    g.demonstration_id,
    'Project Officer'
  FROM
    _po_gap g
    JOIN demos_app.demonstration_role_assignment dra ON dra.person_id = fb_person
      AND dra.demonstration_id = g.demonstration_id
      AND dra.role_id = 'Project Officer'
    ON CONFLICT (demonstration_id,
      role_id)
      DO NOTHING;
    INSERT INTO migration._primary_officer_fallback_applied(demonstration_id, person_id, legacy_user_id)
    SELECT
      g.demonstration_id,
      fb_person,
      fb_legacy
    FROM
      _po_gap g
      JOIN demos_app.primary_demonstration_role_assignment pdra ON pdra.demonstration_id = g.demonstration_id
        AND pdra.role_id = 'Project Officer'
        AND pdra.person_id = fb_person
      ON CONFLICT (demonstration_id)
        DO NOTHING;
    SELECT
      count(*)
    INTO
      n_filled
    FROM
      migration._primary_officer_fallback_applied;
    RAISE NOTICE 'primary PO fallback: backfilled % of % demonstration(s) missing a primary Project Officer with fallback legacy user %', n_filled, n_gaps, fb_legacy;
END
$$;

