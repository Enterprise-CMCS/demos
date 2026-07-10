/*
 * Purpose:    Asserts every resolved deliverable comment that is not a recorded hold-back is materialized in demos_app.private_comment or demos_app.public_comment.
 * Inputs:     stg.comment_resolved; demos_app.private_comment; demos_app.public_comment; migration._parity_comment_held
 * Outputs:    migration._parity_comment_completeness
 * Invariants: Non-empty -> RED at Gate 6; conditional-DDL guard (created only when stg.comment_resolved + the held-back view are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "comment completeness" CheckResult; sql/20_app/50_comment.sql; completeness counterpart to 44_comment_held.sql
 *
 * Parity check: comment load completeness (loadable-but-unloaded rows).
 *
 * Every comment resolved by stg.comment_resolved (10_stg/33_*) that is NOT a
 * recorded hold-back must be materialized by the loader
 * (sql/20_app/50_comment.sql) into exactly one of demos_app.private_comment /
 * demos_app.public_comment. A row here is a comment the loader should have
 * placed but did not -- a migration bug. It is the completeness counterpart to
 * the held-back log (44_comment_held.sql): a comment is either loaded, or held
 * back with a recorded reason, never silently dropped.
 *
 * Comments cascade from deliverables; every unloaded resolved comment must also
 * be in _parity_comment_held (a recorded reason), so this view is empty -> GREEN.
 *
 * Conditional DDL: reads stg.comment_resolved and the held-back view, which
 * exist only in the full pipeline and never in the app-layers idempotency
 * harness; guarded so the harness applies this file as a clean no-op, and
 * re-apply is idempotent via CREATE OR REPLACE. apply order (lexical) builds
 * 44_comment_held before this file (held view materialized first), so the
 * dependency on migration._parity_comment_held is satisfied and this gating
 * view is actually created in the full pipeline rather than skipped.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.comment_resolved') IS NULL THEN
    RAISE NOTICE 'parity comment_completeness: stg.comment_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration._parity_comment_held') IS NULL THEN
    RAISE NOTICE 'parity comment_completeness: migration._parity_comment_held absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_comment_completeness AS
    SELECT
      r.new_uuid       AS comment_id,
      r.legacy_id      AS legacy_id,
      r.deliverable_id AS deliverable_id,
      r.source         AS source
    FROM stg.comment_resolved r
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.private_comment p WHERE p.id = r.new_uuid
          )
      AND NOT EXISTS (
            SELECT 1 FROM demos_app.public_comment q WHERE q.id = r.new_uuid
          )
      AND NOT EXISTS (
            SELECT 1 FROM migration._parity_comment_held h
             WHERE h.comment_id = r.new_uuid
          );
  $v$;
END
$$;

