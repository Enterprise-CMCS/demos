/*
 * Purpose:    SME-facing log of loaded deliverables that received no synthesized action chain, with the reason, so a seed gap is visible rather than showing up only as an empty timeline in the DEMOS UI.
 * Inputs:     migration._parity_deliverable_action_held; demos_app.deliverable; demos_app.demonstration
 * Outputs:    migration._parity_deliverable_action_held_report
 * Invariants: non-gating (reported, never RED); conditional-DDL guard so the app-layers idempotency harness applies this file as a no-op; idempotent via CREATE OR REPLACE; expected to be EMPTY today because every loaded deliverable status has a seeded chain.
 * Refs:       migration/phases/parity.py "Deliverable actions not synthesized" CheckResult; sql/23_app_derived/60_deliverable_action.sql, sql/02_seeds_static/30_deliverable_action_chain.sql
 *
 * Non-gating report: deliverables with no synthesized action chain.
 *
 * A deliverable lands here when its loaded status has no chain in
 * migration.deliverable_action_chain. That is a seed gap rather than a data
 * defect, and the consequence is narrow and non-destructive (the deliverable
 * loads and displays correctly; only its history is empty), so it is reported
 * rather than gated. The gating assertion sits in
 * 62_deliverable_action_completeness.sql, which covers every deliverable that
 * is NOT recorded here.
 *
 * Expected to be empty: the seed covers all seven statuses any loaded
 * deliverable currently carries. It becomes non-empty if DEMOS adds a
 * deliverable status, or if a soft-deleted deliverable ever reaches the load
 * (the 'Deleted' status is deliberately unseeded), which is exactly the moment
 * an SME needs to be told.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('migration._parity_deliverable_action_held') IS NULL THEN
    RAISE NOTICE 'parity deliverable_action_held: held log absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_action_held_report AS
    SELECT h.deliverable_id,
           h.status_id,
           d.name          AS deliverable_name,
           dm.name         AS demonstration_name,
           h.reason
    FROM migration._parity_deliverable_action_held h
    LEFT JOIN demos_app.deliverable d    ON d.id = h.deliverable_id
    LEFT JOIN demos_app.demonstration dm ON dm.id = d.demonstration_id
    ORDER BY dm.name, d.name;
  $v$;
END
$$;

