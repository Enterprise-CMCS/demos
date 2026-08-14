/*
 * Purpose:    Asserts every PMDA-valid resolved deliverable that is not a recorded hold-back is materialized in demos_app.deliverable.
 * Inputs:     stg.deliverable_resolved; demos_app.deliverable; migration._parity_deliverable_held
 * Outputs:    migration._parity_deliverable_completeness
 * Invariants: Non-empty -> RED at Gate 6; conditional-DDL guard (created only when stg.deliverable_resolved + the held-back view are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "15. Deliverable load completeness" CheckResult; completeness counterpart to 40_deliverable_held.sql
 *
 * Parity check 15: deliverable load completeness (loadable-but-unloaded rows).
 *
 * Invariant: every PMDA-valid deliverable resolved by stg.deliverable_resolved
 * (10_stg/28_*) that is NOT a recorded hold-back must be materialized in
 * demos_app.deliverable by the loader (sql/20_app/40_deliverable.sql). A row in
 * this view is a deliverable the loader should have placed but did not -- a
 * migration bug. It is the completeness counterpart to the held-back log
 * (40_deliverable_held.sql): a deliverable is either loaded, or held back with
 * a recorded reason, never silently dropped.
 *
 * With the deliverable_type crosswalk authored, deliverables load; every
 * unloaded resolved row must also be in _parity_deliverable_held (a recorded
 * reason), so this view stays empty -> GREEN. It catches any loadable
 * deliverable that nonetheless failed to land.
 *
 * Consumed by migration/phases/parity.py as the "15. Deliverable load
 * completeness" CheckResult. Non-empty -> RED.
 *
 * Conditional DDL: reads stg.deliverable_resolved and the held-back view, which
 * exist only in the full pipeline and never in the app-layers idempotency
 * harness; guarded so the harness applies this file as a clean no-op, and
 * re-apply is idempotent via CREATE OR REPLACE. apply order (lexical) builds
 * 40_deliverable_held before this file, so the held view is present.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.deliverable_resolved') IS NULL THEN
    RAISE NOTICE 'parity deliverable_completeness: stg.deliverable_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration._parity_deliverable_held') IS NULL THEN
    RAISE NOTICE 'parity deliverable_completeness: migration._parity_deliverable_held absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_completeness AS
    SELECT
      r.new_uuid         AS deliverable_id,
      r.legacy_id        AS legacy_id,
      r.demonstration_id AS demonstration_id
    FROM stg.deliverable_resolved r
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.deliverable d WHERE d.id = r.new_uuid
          )
      AND NOT EXISTS (
            SELECT 1 FROM migration._parity_deliverable_held h
             WHERE h.deliverable_id = r.new_uuid
          );
  $v$;
END
$$;

