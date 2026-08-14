/*
 * Purpose:    Row-count reconciliation per consolidated BUILT family: every loadable source row is either in the target or in a recorded hold-back (no silent gaps, no over-count).
 * Inputs:     stg.*_resolved (loadable source-of-truth); demos_app.* targets; migration._parity_*_held / dup hold-back views.
 * Outputs:    migration._parity_row_counts (one row per family: source_count, target_count, held_count, delta).
 * Invariants: Any row with delta<>0 -> RED at Gate 1; the column cross-foot (sum source vs sum target+held) is Gate 2's count-checksum; conditional-DDL guarded to an empty view when any dependency is absent (idempotency harness no-op); idempotent via CREATE OR REPLACE. Applies after 14/40/44/48 (lexical order 90 > those) so the held views exist.
 * Refs:       migration/phases/parity.py "1. Row count parity" + "2. Numeric sum parity" CheckResults; reports/narrative/pending_approved_decisions.md (family rules).
 *
 * Parity check 1 (row-count parity) + check 2 (count-checksum).
 *
 * For each BUILT consolidated family whose relationship to the source is a
 * clean count identity, reconcile:
 *
 *     source_count (loadable resolver) == target_count + held_count
 *
 * so delta = source - target - held is 0 when nothing is silently dropped and
 * nothing is over-counted (e.g. a duplicated target row). This is the single
 * SME-readable cross-foot the per-family completeness gates (15/comment/8) do
 * not provide: they only catch *missing* rows, not *extra* ones.
 *
 * Families reconciled here (verified delta 0):
 *   - person                 : stg.users_resolved -> demos_app.person (contacts
 *                              deferred, so person == resolved users today; if a
 *                              contact loader lands, person exceeds it and this
 *                              gate goes RED, forcing an update -- intended).
 *   - demonstration          : stg.demonstration_resolved -> demonstration
 *                              + duplicate-medicaid_id hold-back.
 *   - deliverable            : stg.deliverable_resolved -> deliverable + held.
 *   - comment                : stg.comment_resolved + stg.override_note_resolved
 *                              -> private_comment + public_comment
 *                              + comment held + override-note held.
 *   - system_role_assignment : stg.system_role_assignment_resolved -> target.
 *
 * BUILT families deliberately NOT reconciled by count here because the
 * source->target relationship is structural, not 1:1, and is covered by a
 * dedicated gate:
 *   - users (subset of person with an account; Gate 11 active-users coverage);
 *   - application / application_date (1:1 / derived from demonstration; Gate 8);
 *   - amendment (Gate 19 load accounting);
 *   - person_state (one resolver grant expands to many per-state rows,
 *     incl. XX -> all states; Gate 10 integrity + provenance);
 *   - demonstration_role_assignment (candidate/target keys differ; Gate 12);
 *   - demonstration_type_tag_assignment (PARTIAL, out of the BUILT scope).
 *
 * Conditional DDL: references stg resolvers and the hold-back views, which
 * exist only in the full pipeline; guarded so the app-layers idempotency
 * harness applies this as a clean no-op, and re-apply is idempotent via
 * CREATE OR REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
DECLARE
  deps text[] := ARRAY['stg.users_resolved', 'stg.demonstration_resolved', 'stg.deliverable_resolved', 'stg.comment_resolved', 'stg.override_note_resolved', 'stg.system_role_assignment_resolved', 'migration._parity_deliverable_held', 'migration._parity_comment_held', 'migration._parity_override_note_held', 'migration._parity_demonstration_held_dup_medicaid_id'];
  d text;
BEGIN
  FOREACH d IN ARRAY deps LOOP
    IF to_regclass(d) IS NULL THEN
      RAISE NOTICE 'parity row_counts: % absent; empty view', d;
      EXECUTE $e$
        CREATE OR REPLACE VIEW migration._parity_row_counts AS
        SELECT NULL::text AS family, NULL::bigint AS source_count,
               NULL::bigint AS target_count, NULL::bigint AS held_count,
               NULL::bigint AS delta
         WHERE false
      $e$;
      RETURN;
    END IF;
  END LOOP;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_row_counts AS
    WITH fam(family, source_count, target_count, held_count) AS (
      VALUES
        ('person',
          (SELECT count(*) FROM stg.users_resolved),
          (SELECT count(*) FROM demos_app.person),
          0::bigint),
        ('demonstration',
          (SELECT count(*) FROM stg.demonstration_resolved),
          (SELECT count(*) FROM demos_app.demonstration),
          (SELECT count(*) FROM migration._parity_demonstration_held_dup_medicaid_id)),
        ('deliverable',
          (SELECT count(*) FROM stg.deliverable_resolved),
          (SELECT count(*) FROM demos_app.deliverable),
          (SELECT count(*) FROM migration._parity_deliverable_held)),
        ('comment',
          (SELECT count(*) FROM stg.comment_resolved)
            + (SELECT count(*) FROM stg.override_note_resolved),
          (SELECT count(*) FROM demos_app.private_comment)
            + (SELECT count(*) FROM demos_app.public_comment),
          (SELECT count(*) FROM migration._parity_comment_held)
            + (SELECT count(*) FROM migration._parity_override_note_held)),
        ('system_role_assignment',
          (SELECT count(*) FROM stg.system_role_assignment_resolved),
          (SELECT count(*) FROM demos_app.system_role_assignment),
          0::bigint)
    )
    SELECT family, source_count, target_count, held_count,
           source_count - target_count - held_count AS delta
      FROM fam;
  $v$;
END
$$;

