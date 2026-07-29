/*
 * Purpose:    Durable per-row log of loaded demonstrations that have no primary Project Officer (the DEMOS check_demonstration_primary_project_officer invariant).
 * Inputs:     stg.demonstration_role_assignment_resolved (full-run signal); demos_app.demonstration; demos_app.primary_demonstration_role_assignment
 * Outputs:    migration._parity_demonstration_missing_primary_officer
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only in a full run where the stg input + both demos_app tables exist, so the app-layers idempotency harness -- which builds demos_app but not stg or the derived role layer -- applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       server/src/sql/functions.sql (check_demonstration_primary_project_officer, lines 102-127); sql/23_app_derived/40_primary_demonstration_role_assignment.sql; migration/phases/parity.py (non-gating check 22)
 *
 * Parity check 22: demonstrations loaded without a primary Project Officer.
 *
 * DEMOS enforces, via the constraint trigger
 * check_demonstration_primary_project_officer (server/src/sql/functions.sql),
 * that every demonstration has a primary_demonstration_role_assignment whose
 * role_id = 'Project Officer'. That trigger is deployed by refreshDbObjects.ts
 * AFTER the migration load (the cutover step after P5), and an AFTER INSERT
 * constraint trigger does NOT retroactively validate the rows this migration
 * already inserted -- so a migrated demo missing a primary PO does not abort
 * the load, but it is semantically invalid for DEMOS and would fail the trigger
 * on any later re-insert / integrity sweep. The primary-PO loader
 * (sql/23_app_derived/40_primary_demonstration_role_assignment.sql) yields no
 * primary row when the PO holder was dropped upstream (unresolved person_type /
 * person_state / unloaded demo), so some loaded demos can legitimately lack one.
 *
 * This view is the per-row record of exactly which loaded demonstrations have
 * no primary Project Officer, so the omission is reviewable by SME instead of
 * surfacing only when DEMOS later rejects the row. The fallback loader
 * (sql/23_app_derived/41_primary_po_fallback.sql) backfills a configurable
 * fallback PO onto every such demonstration before parity runs, so this view
 * normally returns zero rows; any residual row is a demonstration the fallback
 * could not cover (unconfigured fallback, or a fallback person who cannot hold
 * the demonstration's state). Per the cutover scope decision the parity check
 * that reads it is NON-GATING (it surfaces the count + per-row rows, does not
 * RED the gate); see migration/phases/parity.py.
 *
 * Conditional DDL: like the sibling hold-back views (11/12/13/14), this view
 * is scoped to a full migration run. It guards first on
 * stg.demonstration_role_assignment_resolved -- the staging input that drives
 * the primary-PO derivation (sql/23_app_derived/40_*) -- which exists only in
 * the full pipeline. The app-layers idempotency harness builds demos_app but
 * neither stg nor the derived role layer, so primary_demonstration_role_assignment
 * is never populated there; gating on the stg signal keeps the view absent in
 * that harness (a clean no-op) instead of spuriously flagging every fake demo.
 * Re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_role_assignment_resolved') IS NULL THEN
    RAISE NOTICE 'parity primary_officer_missing: stg.demonstration_role_assignment_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'parity primary_officer_missing: demos_app.demonstration absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('demos_app.primary_demonstration_role_assignment') IS NULL THEN
    RAISE NOTICE 'parity primary_officer_missing: demos_app.primary_demonstration_role_assignment absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_missing_primary_officer AS
    SELECT
      d.id          AS demonstration_id,
      d.medicaid_id AS medicaid_id,
      d.state_id    AS state_id,
      d.status_id   AS status_id
    FROM demos_app.demonstration d
    WHERE NOT EXISTS (
      SELECT 1
      FROM demos_app.primary_demonstration_role_assignment pdra
      WHERE pdra.demonstration_id = d.id
        AND pdra.role_id = 'Project Officer'
    );
  $v$;
END
$$;

