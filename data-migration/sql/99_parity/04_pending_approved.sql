/*
 * Purpose:    Pending/approved unification audit: no pending demonstration leaks into the demonstration target, and enumerate the pending-only deferred set for SME sign-off.
 * Inputs:     mysql_raw.mdcd_pendg_demo, mysql_raw.mdcd_demo, stg._valid_pendg_demo_ids, migration._id_map_mdcd_pendg_demo, demos_app.demonstration.
 * Outputs:    migration._parity_pending_approved (category, legacy_pendg_demo_id, medicaid_id, reason).
 * Invariants: category='leaked' rows are a HARD violation -> RED at Gate 4 (a pending demo loaded as a demonstration); category='pending_only_deferred' rows are the intentionally-deferred pending-only set reconciled against reports/parity_accepted/pending_approved_deferrals.csv. Conditional-DDL guarded to an empty view when any dependency is absent (idempotency harness no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "4. Pending/approved unification audit"; reports/narrative/pending_approved_decisions.md (decision table + sign-off).
 *
 * Parity check 4 (pending/approved unification audit).
 *
 * The decision table in reports/narrative/pending_approved_decisions.md collapses the
 * MySQL mdcd_demo / mdcd_pendg_demo pair into the DEMOS application +
 * demonstration flow with the rule "approved wins; a pending demo with no
 * approved counterpart is deferred (workflow 7), a pending demo with an approved
 * counterpart folds into the approved row". The demonstration loader
 * (sql/10_stg/22_demonstration_resolved.sql) therefore reads ONLY mdcd_demo, so
 * no pending demo should ever appear in demos_app.demonstration.
 *
 * This view surfaces two categories:
 *
 *   - 'leaked' (HARD, RED): a demos_app.demonstration.id that resolves back to
 *     migration._id_map_mdcd_pendg_demo -- a pending demo loaded as a
 *     demonstration, violating the unification rule. Expected empty.
 *
 *   - 'pending_only_deferred' (baseline set): a VALID pending demo
 *     (stg._valid_pendg_demo_ids) with no approved counterpart, keyed by the
 *     canonical project number (mdcd_demo_num). These are the demonstrations the
 *     migration deliberately does NOT load; Gate 4 reconciles them against the
 *     SME-signed baseline reports/parity_accepted/pending_approved_deferrals.csv
 *     so a newly-appearing pending-only demo forces re-review.
 *
 * Strengthening path (deliberately NOT enforced yet, leakage-only per SME):
 * a stronger invariant would also assert that every valid pending demo WITH an
 * approved counterpart has that approved counterpart present in the target OR
 * recorded as a hold-back. That overlaps the existing dup-medicaid (check 21)
 * and division hold-back (check 13) gates, so it is left out to avoid
 * double-gating; add a 'counterpart_missing' category here if SMEs want it.
 *
 * Conditional DDL: references the stg pending filter and the loaded target,
 * which exist only in the full pipeline; guarded so the app-layers idempotency
 * harness applies this as a clean no-op, and re-apply is idempotent via
 * CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
DECLARE
  deps text[] := ARRAY['mysql_raw.mdcd_pendg_demo', 'mysql_raw.mdcd_demo', 'stg._valid_pendg_demo_ids', 'migration._id_map_mdcd_pendg_demo', 'demos_app.demonstration'];
  d text;
BEGIN
  FOREACH d IN ARRAY deps LOOP
    IF to_regclass(d) IS NULL THEN
      RAISE NOTICE 'parity pending_approved: % absent; empty view', d;
      EXECUTE $e$
        CREATE OR REPLACE VIEW migration._parity_pending_approved AS
        SELECT NULL::text AS category, NULL::bigint AS legacy_pendg_demo_id,
               NULL::text AS medicaid_id, NULL::text AS reason
         WHERE false
      $e$;
      RETURN;
    END IF;
  END LOOP;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_pending_approved AS
    SELECT
      'leaked'::text AS category,
      pm.legacy_int_id AS legacy_pendg_demo_id,
      NULLIF(btrim(p.mdcd_demo_num), '') AS medicaid_id,
      'pending_demo_loaded_as_demonstration'::text AS reason
    FROM demos_app.demonstration dm
    JOIN migration._id_map_mdcd_pendg_demo pm ON pm.new_uuid = dm.id
    JOIN mysql_raw.mdcd_pendg_demo p ON p.mdcd_pendg_demo_id = pm.legacy_int_id
    UNION ALL
    SELECT
      'pending_only_deferred'::text AS category,
      v.demo_id AS legacy_pendg_demo_id,
      NULLIF(btrim(p.mdcd_demo_num), '') AS medicaid_id,
      CASE WHEN p.mdcd_demo_num IS NULL OR btrim(p.mdcd_demo_num) = '' THEN
        'no_project_number'
      ELSE
        'no_approved_counterpart'
      END AS reason
    FROM stg._valid_pendg_demo_ids v
    JOIN mysql_raw.mdcd_pendg_demo p ON p.mdcd_pendg_demo_id = v.demo_id
    WHERE NOT (p.mdcd_demo_num IS NOT NULL
      AND btrim(p.mdcd_demo_num) <> ''
      AND EXISTS (
        SELECT 1 FROM mysql_raw.mdcd_demo ad
         WHERE btrim(ad.mdcd_demo_num) = btrim(p.mdcd_demo_num)));
  $v$;
END
$$;

