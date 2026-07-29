/*
 * Purpose:    Materialize demos_app.application_phase (one row per phase per loaded application) with a date-derived phase_status, and pre-set the Federal Comment phase so the DEMOS nightly cron cannot spuriously advance a window that closed by cutover.
 * Inputs:     demos_app.demonstration, demos_app.amendment, demos_app.phase, demos_app.application_date.
 * Outputs:    demos_app.application_phase
 * Invariants: runs in the deferred-constraint build_app txn (23_app_derived, after 20_app + application_date); guarded inert until demos_app.application_phase exists; one row per (application_id, phase_id) for the 8 real phases (phase_number > 0); status derived from the loaded current_phase_id ordinal (earlier=Completed, current=Started, later=Not Started); Concept is never 'Not Started' because current_phase_id is always Concept or later; idempotent via ON CONFLICT (application_id, phase_id) DO NOTHING + a status-guarded failsafe UPDATE.
 * Refs:       server/src/sql/functions.sql (update_federal_comment_phase_status, create_phases_and_dates_for_new_application), sql/20_app/36_application_date.sql
 *
 * DEMOS auto-creates application_phase rows via an AFTER INSERT trigger on
 * application, but that trigger is installed by the DEMOS deploy AFTER this
 * migration loads, so it never fires for migrated rows. This loader therefore
 * materializes the per-phase status set the DEMOS UI and the phase cron expect,
 * from the current_phase_id the demonstration / amendment loaders already
 * derived (§6.1 highest-started-phase-by-date, with status fallback).
 *
 * Applications covered: every demonstration (approved + pending 'Under Review')
 * and every amendment -- all IS-A application sharing the id. Extensions are
 * deferred post-MVP.
 *
 * Status derivation: for each of the 8 real phases, Completed if its
 * phase_number is below the application's current phase, Started if equal, Not
 * Started if above. This respects phase_phase_status (Concept, always the
 * current phase or earlier, is only ever Started/Completed -- never the
 * forbidden 'Not Started').
 *
 * Federal Comment guard (cutover 2026-08-20 Eastern midnight -- keep in sync
 * with the go-live date): the DEMOS nightly cron update_federal_comment_phase_status() advances
 * the Federal Comment / SDG Preparation phases (and inserts an 'SDG Preparation
 * Start Date' of "today") for any application whose Federal Comment window has
 * dates and whose Federal Comment phase is still 'Not Started'/'Started'. For a
 * historical window that already closed by cutover that advance is spurious, so
 * we force Federal Comment = Completed whenever its loaded end date is before
 * cutover; a window still open at cutover keeps its derived status and the cron
 * transitions it correctly on schedule.
 *
 * Idempotent: the INSERT uses ON CONFLICT DO NOTHING and the failsafe UPDATE
 * only touches rows still in ('Not Started','Started'), so a second apply is a
 * no-op.
 */
SET search_path TO demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.application_phase') IS NULL THEN
    RAISE NOTICE 'skip application_phase load: demos_app.application_phase not built yet';
    RETURN;
  END IF;

  INSERT INTO demos_app.application_phase(application_id, phase_id, phase_status_id, created_at, updated_at)
  WITH app_current AS (
    SELECT
      id AS application_id,
      current_phase_id,
      created_at,
      updated_at
    FROM
      demos_app.demonstration
    UNION ALL
    SELECT
      id AS application_id,
      current_phase_id,
      created_at,
      updated_at
    FROM
      demos_app.amendment
  )
  SELECT
    ac.application_id,
    ph.id,
    CASE
    WHEN ph.phase_number < cur.phase_number THEN
      'Completed'
    WHEN ph.phase_number = cur.phase_number THEN
      'Started'
    ELSE
      'Not Started'
    END,
    ac.created_at,
    ac.updated_at
  FROM
    app_current ac
    JOIN demos_app.phase cur ON cur.id = ac.current_phase_id
    CROSS JOIN demos_app.phase ph
  WHERE
    ph.phase_number > 0
  ON CONFLICT(application_id,
    phase_id)
    DO NOTHING;

  UPDATE
    demos_app.application_phase ap
  SET
    phase_status_id = 'Completed',
    updated_at = ap.updated_at
  FROM
    demos_app.application_date ad
  WHERE
    ap.phase_id = 'Federal Comment'
    AND ap.phase_status_id IN ('Not Started', 'Started')
    AND ad.application_id = ap.application_id
    AND ad.date_type_id = 'Federal Comment Period End Date'
    -- Cutover boundary is Eastern midnight (-04:00 EDT on 2026-08-20): date_value
    -- is anchored to America/New_York, so the threshold must be the same instant.
    AND ad.date_value < TIMESTAMPTZ '2026-08-20 00:00:00-04:00';
END
$$;
