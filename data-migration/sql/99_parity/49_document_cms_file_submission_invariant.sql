/*
 * Purpose:    Forward-scaffold for the DEMOS no_submitted_deliverable_cms_files invariant: a CMS-attached file may NOT also carry a deliverable submission action.
 * Inputs:     demos_app.document (guarded on stg.document_resolved)
 * Outputs:    migration._parity_document_cms_file_submission
 * Invariants: Empty == healthy; INERT FORWARD-SCAFFOLD, NON-GATING for now (the parity runner does not yet read this view); conditional-DDL guard on stg.document_resolved (NOT demos_app.document) so the fake-row app-layers idempotency harness does not create it and break test_parity_views_empty; idempotent via CREATE OR REPLACE.
 * Refs:       Prisma migration 20260623125420_no_deliverable_submitted_cms_files; docs/specs/pmda-cross-cutting-derivation-spec.md, section 6 + Table 2 "Document Source Families"; migration/phases/parity.py
 *
 * Parity check (forward-scaffold): documents that VIOLATE the DEMOS invariant
 * no_submitted_deliverable_cms_files -- a CMS-attached file may NOT also carry a
 * deliverable submission action. Source migration:
 * 20260623125420_no_deliverable_submitted_cms_files (pinned Prisma DDL), whose
 * CHECK is NOT (deliverable_is_cms_attached_file = true AND
 * deliverable_submission_action_id IS NOT NULL). A row in this view is one the
 * CHECK forbids, so the view is empty == healthy.
 *
 * INERT FORWARD-SCAFFOLD -- NON-GATING for now. There is no document loader yet
 * (the document source-family fan-in is SME-blocked; see
 * docs/specs/pmda-cross-cutting-derivation-spec.md, §6 "Deliverables, Documents,
 * Comments, BN" + Table 2 "Document Source Families"), so nothing populates
 * demos_app.document and there is nothing to assert. The parity runner
 * (migration/phases/parity.py) does not yet read this view; it lands here so the
 * invariant is already wired the moment a real loader does.
 *
 * Conditional DDL -- WHY THE GUARD IS ON stg.document_resolved, NOT
 * demos_app.document: the app-layers idempotency harness
 * (tests/sql/test_app_layers_idempotency.py) stands up demos_app and loads FAKE
 * document rows with the CHECK constraints dropped, so guarding on
 * demos_app.document would create this view there and the planted rows would
 * make it NON-empty, breaking test_parity_views_empty. Guarding instead on the
 * staging projection stg.document_resolved -- which exists ONLY in the full
 * pipeline once a real document loader lands, and never in that harness -- keeps
 * this a clean no-op everywhere today. Whenever stg.document_resolved exists,
 * build_app has already created demos_app.document, so the EXECUTE body's
 * reference to it is safe. CREATE OR REPLACE keeps re-apply idempotent.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.document_resolved') IS NULL THEN
    RAISE NOTICE 'parity document_cms_file_submission: stg.document_resolved absent (no document loader yet); view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_document_cms_file_submission AS
    SELECT
      d.id                               AS document_id,
      d.application_id                   AS application_id,
      d.deliverable_id                   AS deliverable_id,
      d.deliverable_type_id              AS deliverable_type_id,
      d.deliverable_is_cms_attached_file AS deliverable_is_cms_attached_file,
      d.deliverable_submission_action_id AS deliverable_submission_action_id
    FROM demos_app.document d
    WHERE d.deliverable_is_cms_attached_file = true
      AND d.deliverable_submission_action_id IS NOT NULL;
  $v$;
END
$$;

