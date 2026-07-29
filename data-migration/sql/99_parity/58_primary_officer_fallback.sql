/*
 * Purpose:    Durable per-row log of demonstrations whose primary Project Officer was backfilled with the configurable fallback PO (provenance for the SME decision).
 * Inputs:     migration._primary_officer_fallback_applied (written by sql/23_app_derived/41_primary_po_fallback.sql); demos_app.demonstration
 * Outputs:    migration._parity_demonstration_primary_officer_fallback
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when the provenance table + demos_app.demonstration exist, so partial harnesses that never run the fallback loader apply it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       sql/23_app_derived/41_primary_po_fallback.sql; sql/99_parity/57_primary_officer_missing.sql; migration/phases/parity.py (non-gating check 23)
 *
 * Parity check 23: demonstrations that received the fallback primary Project
 * Officer.
 *
 * The fallback loader (sql/23_app_derived/41_primary_po_fallback.sql) backfills
 * a configurable Project Officer onto every demonstration that would otherwise
 * load without a primary PO (the DEMOS check_demonstration_primary_project_officer
 * invariant), and records each one in
 * migration._primary_officer_fallback_applied. This view is the reviewable
 * per-row record of exactly which demonstrations carry a synthetic (fallback)
 * primary PO rather than a real one migrated from PMDA, so the SME can audit
 * the decision at the gate. Per the cutover scope decision the parity check
 * that reads it is NON-GATING.
 *
 * Conditional DDL: the provenance table exists only after a full run in which
 * the fallback loader found and filled at least one gap. When it is absent
 * (no gaps, or a partial harness that never runs the derived role layer), the
 * view is not created and parity check 23 is vacuously GREEN. Re-apply is
 * idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('migration._primary_officer_fallback_applied') IS NULL THEN
    RAISE NOTICE 'parity primary_officer_fallback: migration._primary_officer_fallback_applied absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'parity primary_officer_fallback: demos_app.demonstration absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_primary_officer_fallback AS
    SELECT
      f.demonstration_id      AS demonstration_id,
      d.medicaid_id           AS medicaid_id,
      d.state_id              AS state_id,
      d.status_id             AS status_id,
      f.legacy_user_id        AS fallback_legacy_user_id
    FROM migration._primary_officer_fallback_applied f
    JOIN demos_app.demonstration d ON d.id = f.demonstration_id;
  $v$;
END
$$;
