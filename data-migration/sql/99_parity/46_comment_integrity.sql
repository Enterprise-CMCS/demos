/*
 * Purpose:    Asserts every LOADED comment satisfies the target invariants the loader enforces (real deliverable; real author users row; private author limited to a CMS person_type).
 * Inputs:     demos_app.private_comment; demos_app.public_comment; demos_app.deliverable; demos_app.users; demos_app.cms_user_person_type_limit (guarded on stg.comment_resolved)
 * Outputs:    migration._parity_comment_integrity
 * Invariants: Non-empty -> RED at Gate 6, expected empty (every loaded comment is consistent); conditional-DDL guard on stg.comment_resolved (NOT the demos_app targets) so the fake-row app-layers idempotency harness does not create it; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "comment integrity" CheckResult; sql/20_app/50_comment.sql
 *
 * Parity check: comment post-load integrity (fail-closed).
 *
 * Every LOADED comment must satisfy the target invariants the loader enforces
 * by construction, so this view is empty == healthy. A row here is a comment
 * that slipped through with:
 *   - a deliverable_id that is not a loaded demos_app.deliverable, or
 *   - a public_comment author_user_id that is not a real users row, or
 *   - a private_comment (author_user_id, author_person_type_id) that is not a
 *     real users row, or
 *   - a private_comment author_person_type_id outside cms_user_person_type_limit
 *     {demos-admin, demos-cms-user}.
 * The declared FKs already enforce these once VALIDATEd; this view is the
 * belt-and-suspenders pre-image so a loader regression is caught and named.
 *
 * Conditional DDL: guarded on stg.comment_resolved (NOT on the demos_app comment
 * tables) so it is NOT created in the app-layers idempotency harness, which
 * loads fake rows with constraints dropped. Re-apply idempotent via CREATE OR
 * REPLACE.
 */
SET search_path TO migration, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.comment_resolved') IS NULL THEN
    RAISE NOTICE 'parity comment_integrity: stg.comment_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_comment_integrity AS
    SELECT
      p.id                    AS comment_id,
      'private_comment'::text AS comment_table,
      p.deliverable_id        AS deliverable_id,
      p.author_user_id        AS author_user_id,
      p.author_person_type_id AS author_person_type_id,
      concat_ws('; ',
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.deliverable d WHERE d.id = p.deliverable_id)
             THEN 'deliverable_id not a loaded deliverable' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.cms_user_person_type_limit l
                WHERE l.id = p.author_person_type_id)
             THEN 'author person_type not a CMS user type' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.users u
                WHERE u.id = p.author_user_id
                  AND u.person_type_id = p.author_person_type_id)
             THEN 'author not a users row with that person_type' END
      )                       AS reason
    FROM demos_app.private_comment p
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.deliverable d WHERE d.id = p.deliverable_id)
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.cms_user_person_type_limit l
             WHERE l.id = p.author_person_type_id)
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.users u
             WHERE u.id = p.author_user_id
               AND u.person_type_id = p.author_person_type_id)
    UNION ALL
    SELECT
      q.id                   AS comment_id,
      'public_comment'::text AS comment_table,
      q.deliverable_id       AS deliverable_id,
      q.author_user_id       AS author_user_id,
      NULL::text             AS author_person_type_id,
      concat_ws('; ',
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.deliverable d WHERE d.id = q.deliverable_id)
             THEN 'deliverable_id not a loaded deliverable' END,
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.users u WHERE u.id = q.author_user_id)
             THEN 'author not a users row' END
      )                      AS reason
    FROM demos_app.public_comment q
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.deliverable d WHERE d.id = q.deliverable_id)
       OR NOT EXISTS (
            SELECT 1 FROM demos_app.users u WHERE u.id = q.author_user_id);
  $v$;
END
$$;

