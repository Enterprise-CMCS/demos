/*
 * Purpose:    Pending/approved unification audit (workflow 7 now BUILT): no pending demo that must NOT load leaks into the demonstration target, and enumerate the residual no-project-number deferred set for SME sign-off; plus a per-row log of pending demos held back at load (state/dup-medicaid).
 * Inputs:     stg._pendg_demo_fold, stg.pending_demonstration_resolved, migration.state_region, demos_app.demonstration.
 * Outputs:    migration._parity_pending_approved (category, legacy_pendg_demo_id, medicaid_id, reason); migration._parity_pending_demonstration_held (legacy_pendg_demo_id, medicaid_id, reason).
 * Invariants: category='leaked' rows are a HARD violation -> RED at Gate 4 (a folded or no-project-number pending demo that must NOT load nevertheless got its own demonstration row); category='pending_only_deferred' rows are the residual no-project-number pending demos reconciled against reports/parity_accepted/pending_approved_deferrals.csv (the SME-signed reversal record); the held view is a NON-GATING per-row log of pending demos held at load. Conditional-DDL guarded to empty views when any dependency is absent (idempotency harness no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "4. Pending/approved unification audit"; reports/narrative/pending_approved_decisions.md (decision table + reversal sign-off); sql/10_stg/23_pendg_demo_fold.sql; sql/20_app/31_pending_demonstration.sql.
 *
 * Parity check 4 (pending/approved unification audit) -- REDEFINED for the
 * workflow-7 reversal (reports/narrative/pending_approved_decisions.md).
 *
 * Prior behavior loaded NO pending demo: any pending demo in the target was a
 * hard "leaked" violation, and the full pending-only set was deferred. The
 * 2026-07-10 SME answers reverse workflow 7: an ORPHAN pending demo (a project
 * number, no approved counterpart) now LOADS as its own 'Under Review'
 * demonstration (sql/20_app/31_pending_demonstration.sql); a pending demo that
 * FOLDS into an approved counterpart, or that has NO project number, still does
 * not load. The classification is owned by stg._pendg_demo_fold.
 *
 * migration._parity_pending_approved surfaces two categories:
 *
 *   - 'leaked' (HARD, RED): a pending demo whose disposition is NOT
 *     'orphan_loadable' (i.e. 'folded' or 'held_no_project') yet whose OWN
 *     pending UUID appears in demos_app.demonstration -- a row that must not have
 *     loaded but did (a fold that got its own row, or a no-project row loaded).
 *     Expected empty: the loader only ever loads orphan_loadable rows.
 *
 *   - 'pending_only_deferred' (baseline set): the residual pending demos the
 *     migration deliberately does NOT load -- the no-project-number pending
 *     demos ('held_no_project'), reason 'no_project_number'. Gate 4 reconciles
 *     them against reports/parity_accepted/pending_approved_deferrals.csv, which
 *     doubles as the SME-signed record of the workflow-7 reversal, so a newly-
 *     appearing no-project pending demo forces re-review.
 *
 * migration._parity_pending_demonstration_held is a NON-GATING per-row log of
 * loadable orphan pending demos that were nonetheless held back at load: state
 * unresolvable in migration.state_region, or the non-winning row of a duplicate
 * medicaid_id (the RED-4 hold-back mirrored from the approved loader). It is for
 * SME review, not a gate (the deliberate hold-backs must not RED the build).
 *
 * Conditional DDL: references the stg fold view, the pending resolved view, and
 * the loaded target, which exist only in the full pipeline; guarded so the
 * app-layers idempotency harness applies this as a clean no-op, and re-apply is
 * idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
DECLARE
  deps text[] := ARRAY['stg._pendg_demo_fold', 'stg.pending_demonstration_resolved', 'migration.state_region', 'demos_app.demonstration'];
  d text;
BEGIN
  FOREACH d IN ARRAY deps LOOP
    IF to_regclass(d) IS NULL THEN
      RAISE NOTICE 'parity pending_approved: % absent; empty views', d;
      EXECUTE $e$
        CREATE OR REPLACE VIEW migration._parity_pending_approved AS
        SELECT NULL::text AS category, NULL::bigint AS legacy_pendg_demo_id,
               NULL::text AS medicaid_id, NULL::text AS reason
         WHERE false
      $e$;
      EXECUTE $e$
        CREATE OR REPLACE VIEW migration._parity_pending_demonstration_held AS
        SELECT NULL::bigint AS legacy_pendg_demo_id, NULL::text AS medicaid_id,
               NULL::text AS reason
         WHERE false
      $e$;
      RETURN;
    END IF;
  END LOOP;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_pending_approved AS
    SELECT
      'leaked'::text AS category,
      f.legacy_pendg_demo_id AS legacy_pendg_demo_id,
      f.medicaid_id AS medicaid_id,
      'pending_demo_that_must_not_load_was_loaded'::text AS reason
    FROM stg._pendg_demo_fold f
    JOIN demos_app.demonstration dm ON dm.id = f.pending_uuid
    WHERE f.disposition <> 'orphan_loadable'
    UNION ALL
    SELECT
      'pending_only_deferred'::text AS category,
      f.legacy_pendg_demo_id AS legacy_pendg_demo_id,
      f.medicaid_id AS medicaid_id,
      'no_project_number'::text AS reason
    FROM stg._pendg_demo_fold f
    WHERE f.disposition = 'held_no_project';
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_pending_demonstration_held AS
    SELECT
      r.legacy_pendg_demo_id AS legacy_pendg_demo_id,
      r.medicaid_id AS medicaid_id,
      'state_unresolvable'::text AS reason
    FROM stg.pending_demonstration_resolved r
    WHERE NOT EXISTS (
      SELECT 1 FROM migration.state_region sr WHERE sr.state_id = r.state_id)
    UNION ALL
    SELECT
      ranked.legacy_pendg_demo_id AS legacy_pendg_demo_id,
      ranked.medicaid_id AS medicaid_id,
      'duplicate_medicaid_id'::text AS reason
    FROM (
      SELECT
        r.legacy_pendg_demo_id AS legacy_pendg_demo_id,
        r.medicaid_id AS medicaid_id,
        ROW_NUMBER() OVER (PARTITION BY r.medicaid_id ORDER BY
          CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
            AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
              OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
            THEN 0 ELSE 1 END,
          r.legacy_pendg_demo_id) AS rn
      FROM stg.pending_demonstration_resolved r
      JOIN migration.state_region sr ON sr.state_id = r.state_id
      WHERE r.medicaid_id IS NOT NULL
    ) ranked
    WHERE ranked.rn > 1;
  $v$;
END
$$;
