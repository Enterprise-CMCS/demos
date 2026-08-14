/*
 * Purpose:    Parity for the budget-neutrality override-note load: a durable per-row log of held-back notes (non-gating) and a completeness assertion that every resolvable note is either loaded or recorded as held (gating).
 * Inputs:     stg.override_note_resolved; demos_app.deliverable; demos_app.private_comment
 * Outputs:    migration._parity_override_note_held, migration._parity_override_note_completeness
 * Invariants: held view NON-GATING (surfaces the count + per-row rows); completeness view non-empty -> RED at Gate 6; conditional-DDL guard on stg.override_note_resolved (+ the held view) so the app-layers idempotency harness applies this as a no-op; idempotent via CREATE OR REPLACE; held created before completeness reads it (same file, top-to-bottom).
 * Refs:       migration/phases/parity.py ("override-note held" + "override-note completeness"); sql/20_app/51_override_note.sql; mirrors 45_comment_completeness.sql + 44_comment_held.sql
 *
 * Parity check: budget-neutrality override notes (10_stg/35_* ->
 * demos_app.private_comment via 20_app/51_*).
 *
 * The loader holds back every override note it cannot place (parent deliverable
 * not loaded, unresolved author, non-CMS author, or empty content) rather than
 * failing the build. The held view is a durable per-row log for SME review and
 * is NON-GATING. The completeness view is its gating counterpart: every note
 * resolved by stg.override_note_resolved that is NOT a recorded hold-back must
 * be materialized in demos_app.private_comment -- a row there is a note the
 * loader should have placed but did not (a migration bug).
 *
 * Conditional DDL: reads stg.override_note_resolved (and, for completeness, the
 * held view), which exist only in the full pipeline and never in the app-layers
 * idempotency harness; guarded so the harness applies this file as a clean
 * no-op, and re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.override_note_resolved') IS NULL THEN
    RAISE NOTICE 'parity override_note_held: stg.override_note_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_override_note_held AS
    SELECT
      r.new_uuid       AS comment_id,
      r.legacy_id      AS legacy_id,
      r.deliverable_id AS deliverable_id,
      concat_ws('; ',
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.deliverable d WHERE d.id = r.deliverable_id)
             THEN 'parent deliverable not loaded' END,
        CASE WHEN r.author_user_id IS NULL
             THEN 'author did not migrate (unresolved user_id)' END,
        CASE WHEN r.author_user_id IS NOT NULL
                  AND (r.author_person_type_id IS NULL
                       OR r.author_person_type_id NOT IN ('demos-admin', 'demos-cms-user'))
             THEN 'author is not a CMS user (private_comment requires a CMS author)' END,
        CASE WHEN r.content = ''
             THEN 'empty override comment' END
      )                AS reason
    FROM stg.override_note_resolved r
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.private_comment p WHERE p.id = r.new_uuid
          );
  $v$;
END
$$;

DO $$
BEGIN
  IF to_regclass('stg.override_note_resolved') IS NULL THEN
    RAISE NOTICE 'parity override_note_completeness: stg.override_note_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration._parity_override_note_held') IS NULL THEN
    RAISE NOTICE 'parity override_note_completeness: migration._parity_override_note_held absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_override_note_completeness AS
    SELECT
      r.new_uuid       AS comment_id,
      r.legacy_id      AS legacy_id,
      r.deliverable_id AS deliverable_id
    FROM stg.override_note_resolved r
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.private_comment p WHERE p.id = r.new_uuid
          )
      AND NOT EXISTS (
            SELECT 1 FROM migration._parity_override_note_held h
             WHERE h.comment_id = r.new_uuid
          );
  $v$;
END
$$;

