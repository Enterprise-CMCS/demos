/*
 * Purpose:    (Inert forward-scaffold) Classify each migrated document into DEMOS's three-state deliverable-link routing once a document loader exists.
 * Inputs:     stg.document_resolved (not yet authored; guarded by to_regclass)
 * Outputs:    CREATE OR REPLACE VIEW stg.document_deliverable_link_resolved (guarded no-op until stg.document_resolved exists)
 * Invariants: inert today (guards on to_regclass('stg.document_resolved'), RETURNs early as a clean no-op); idempotent (CREATE OR REPLACE VIEW); output routing pinned to the document contract (check_deliverable_null_states, no_submitted_deliverable_cms_files); column names against stg.document_resolved are speculative.
 * Refs:       docs/specs/pmda-cross-cutting-derivation-spec.md
 *
 * INERT FORWARD-SCAFFOLD -- NOT YET ACTIVE.
 *
 * Intended staging projection that classifies each migrated document into the
 * three-state deliverable-link routing DEMOS enforces on demos_app.document
 * (mirrors the pinned-DDL CHECKs check_deliverable_null_states and
 * no_submitted_deliverable_cms_files):
 *
 *   state 1  non-deliverable : deliverable_id IS NULL
 *                              -> all deliverable_* columns NULL; the DDL CHECK
 *                                 check_deliverable_null_states forces
 *                                 is_cms_attached_file = NULL (not false),
 *                                 submission_action_id = NULL
 *   state 2  state-submitted : linked + a state submission action
 *                              -> is_cms_attached_file = false,
 *                                 submission_action_id = <deliverable_action id>
 *   state 3  cms-attached    : linked + a CMS-attached file
 *                              -> is_cms_attached_file = true,
 *                                 submission_action_id = NULL
 *
 * WHY THIS IS A NO-OP TODAY: there is no document loader yet, so the source
 * projection stg.document_resolved does NOT exist in any schema. The document
 * source-family -> document_type / attachment-origin fan-in is still SME-blocked
 * (docs/specs/pmda-cross-cutting-derivation-spec.md, §6 "Deliverables,
 * Documents, Comments, BN" + Table 2 "Document Source Families"; "unresolved
 * document/reference mappings" in the Blocker Summary). This file therefore
 * GUARDS on to_regclass('stg.document_resolved') and RETURNs early as a clean
 * no-op everywhere it is applied today (the full pipeline included), only
 * minting the view once a future document loader authors stg.document_resolved.
 *
 * The SELECT below is written against PLAUSIBLE, not-yet-authored
 * stg.document_resolved columns (attachment_origin / submission_action_id are
 * speculative). Correctness of those names is intentionally secondary -- the
 * guard keeps the body inert -- but the routing shape and the three output
 * columns are pinned to the target document contract so the eventual loader can
 * adopt them unchanged. CREATE OR REPLACE keeps re-apply idempotent.
 */
SET search_path TO stg, mysql_raw, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.document_resolved') IS NULL THEN
    RAISE NOTICE 'stg document_deliverable_link_resolved: stg.document_resolved absent (no document loader yet); view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW stg.document_deliverable_link_resolved AS
    SELECT
      d.new_uuid            AS document_id,
      d.application_id      AS application_id,
      d.document_type_id    AS document_type_id,
      d.phase_id            AS phase_id,
      d.deliverable_id      AS deliverable_id,
      d.deliverable_type_id AS deliverable_type_id,
      -- state 1 -> NULL (check_deliverable_null_states); state 3 (cms-attached)
      -- -> true; state 2 (state-submitted) -> false
      CASE
        WHEN d.deliverable_id IS NULL             THEN NULL::boolean
        WHEN d.attachment_origin = 'cms_attached' THEN true
        ELSE false
      END                   AS deliverable_is_cms_attached_file,
      -- only state 2 (state-submitted) carries a submission action id; state 3
      -- must stay NULL here to satisfy no_submitted_deliverable_cms_files
      CASE
        WHEN d.deliverable_id IS NULL             THEN NULL
        WHEN d.attachment_origin = 'cms_attached' THEN NULL
        ELSE d.submission_action_id
      END                   AS deliverable_submission_action_id,
      CASE
        WHEN d.deliverable_id IS NULL             THEN 'non_deliverable'
        WHEN d.attachment_origin = 'cms_attached' THEN 'cms_attached'
        ELSE 'state_submitted'
      END                   AS link_state
    FROM stg.document_resolved d;
  $v$;
END
$$;

