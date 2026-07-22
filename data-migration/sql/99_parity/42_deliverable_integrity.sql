/*
 * Purpose:    Asserts every LOADED deliverable satisfies the target invariants the loader enforces (Approved demonstration status, CMS-user owner person_type, composite FK targets).
 * Inputs:     demos_app.deliverable; demos_app.cms_user_person_type_limit; demos_app.demonstration; demos_app.users (guarded on stg.deliverable_resolved)
 * Outputs:    migration._parity_deliverable_integrity
 * Invariants: Non-empty -> RED at Gate 6, empty today (0 deliverables loaded); conditional-DDL guard on stg.deliverable_resolved (NOT demos_app.deliverable) so the fake-row app-layers idempotency harness does not create it and break test_parity_views_empty; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "16. Deliverable integrity" CheckResult
 *
 * Parity check 16: demos_app.deliverable post-load integrity (fail-closed).
 *
 * Every LOADED deliverable must satisfy the target invariants the loader
 * enforces by construction, so this view is empty == healthy. A row here is a
 * deliverable that slipped through with:
 *   - demonstration_status_id <> 'Approved' (approved_application_status_limit
 *     seeds only 'Approved'), or
 *   - a cms_owner_person_type_id outside cms_user_person_type_limit
 *     {demos-admin, demos-cms-user} (a state-user owner anomaly), or
 *   - a (demonstration_id, demonstration_status_id) pair that does not match an
 *     Approved demonstration (the composite FK target), or
 *   - a (cms_owner_user_id, cms_owner_person_type_id) pair that is not a real
 *     users row (the composite owner FK target).
 * The declared FKs already enforce these once VALIDATEd in the constraints
 * phase; this view is the belt-and-suspenders pre-image so a loader regression
 * is caught and named rather than only surfacing as a raw FK violation.
 *
 * Consumed by migration/phases/parity.py as the "16. Deliverable integrity"
 * CheckResult. Non-empty -> RED. Expected empty (every loaded deliverable is
 * internally consistent).
 *
 * Conditional DDL: guarded on stg.deliverable_resolved (NOT on
 * demos_app.deliverable) so it is NOT created in the app-layers idempotency
 * harness -- that harness loads FAKE deliverable rows with FK/CHECK constraints
 * dropped, which would otherwise make this view non-empty and break
 * test_parity_views_empty. stg.deliverable_resolved exists only in the full
 * pipeline, where build_app has already populated demos_app.deliverable, so the
 * body's reference to it is safe. Re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.deliverable_resolved') IS NULL THEN
    RAISE NOTICE 'parity deliverable_integrity: stg.deliverable_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_integrity AS
    SELECT
      d.id                       AS deliverable_id,
      d.demonstration_id         AS demonstration_id,
      d.demonstration_status_id  AS demonstration_status_id,
      d.cms_owner_user_id        AS cms_owner_user_id,
      d.cms_owner_person_type_id AS cms_owner_person_type_id,
      concat_ws('; ',
        CASE WHEN d.demonstration_status_id <> 'Approved'
             THEN 'demonstration_status_id not Approved' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.cms_user_person_type_limit l
                WHERE l.id = d.cms_owner_person_type_id)
             THEN 'owner person_type not a CMS user type' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.demonstration dm
                WHERE dm.id = d.demonstration_id
                  AND dm.status_id = d.demonstration_status_id)
             THEN 'no Approved demonstration for (demonstration_id, status)' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.users u
                WHERE u.id = d.cms_owner_user_id
                  AND u.person_type_id = d.cms_owner_person_type_id)
             THEN 'cms_owner not a users row with that person_type' END
      )                          AS reason
    FROM demos_app.deliverable d
    WHERE d.demonstration_status_id <> 'Approved'
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.cms_user_person_type_limit l
             WHERE l.id = d.cms_owner_person_type_id)
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.demonstration dm
             WHERE dm.id = d.demonstration_id
               AND dm.status_id = d.demonstration_status_id)
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.users u
             WHERE u.id = d.cms_owner_user_id
               AND u.person_type_id = d.cms_owner_person_type_id);
  $v$;
END
$$;

