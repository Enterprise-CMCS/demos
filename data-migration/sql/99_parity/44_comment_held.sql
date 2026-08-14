/*
 * Purpose:    Durable per-row log of deliverable comments the loader held back from the load and why (parent deliverable not loaded, unresolved author, empty content, a private route with a non-CMS author, or a public route with a non-auth author such as a non-user-contact evaluator).
 * Inputs:     stg.comment_resolved; mysql_raw.crosswalk_comment_origin; demos_app.deliverable; demos_app.private_comment; demos_app.public_comment
 * Outputs:    migration._parity_comment_held
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard on stg.comment_resolved so the app-layers idempotency harness applies it as a no-op; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "comment held"); sql/20_app/50_comment.sql; complements 45_comment_completeness.sql
 *
 * Parity check: comments held back from the load (durable per-row log for SME
 * review).
 *
 * The loader (sql/20_app/50_comment.sql) holds back every comment it cannot
 * place rather than failing the build. Each comment inner-joins its parent
 * demos_app.deliverable, so a comment whose parent deliverable was held back is
 * itself held back. The reasons are computed from the inputs that exist, so an
 * SME can see why each held-back comment did not load (parent deliverable not
 * loaded, unresolved author, empty content, a private route assigned to a
 * non-CMS author, or a public route whose author is not an auth user -- e.g. a
 * non-user-contact evaluator with a person row but no users row).
 *
 * The reading parity check is NON-GATING (it surfaces the count + per-row rows).
 * The completeness check (45_comment_completeness.sql) excludes these held-back
 * rows so a deliberate hold-back does not also trip the gating check RED.
 *
 * Conditional DDL: guarded on stg.comment_resolved, which exists only in the
 * full pipeline and never in the app-layers idempotency harness; the harness
 * applies this file as a clean no-op, and re-apply is idempotent via CREATE OR
 * REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.comment_resolved') IS NULL THEN
    RAISE NOTICE 'parity comment_held: stg.comment_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_comment_held AS
    SELECT
      r.new_uuid       AS comment_id,
      r.legacy_id      AS legacy_id,
      r.deliverable_id AS deliverable_id,
      r.source         AS source,
      r.origin_cd      AS origin_cd,
      concat_ws('; ',
        CASE WHEN NOT EXISTS (
               SELECT 1 FROM demos_app.deliverable d WHERE d.id = r.deliverable_id)
             THEN 'parent deliverable not loaded' END,
        CASE WHEN r.author_user_id IS NULL
             THEN 'author did not migrate (unresolved user_id)' END,
        CASE WHEN r.content = ''
             THEN 'empty comment content' END,
        CASE WHEN COALESCE(co.demos_route,
                    CASE WHEN r.author_person_type_id IN ('demos-admin', 'demos-cms-user')
                         THEN 'private' ELSE 'public' END) = 'private'
                  AND r.author_user_id IS NOT NULL
                  AND (r.author_person_type_id IS NULL
                       OR r.author_person_type_id NOT IN ('demos-admin', 'demos-cms-user'))
             THEN 'private route but author is not a CMS user (anomaly)' END,
        CASE WHEN COALESCE(co.demos_route,
                    CASE WHEN r.author_person_type_id IN ('demos-admin', 'demos-cms-user')
                         THEN 'private' ELSE 'public' END) = 'public'
                  AND r.author_user_id IS NOT NULL
                  AND (r.author_person_type_id IS NULL
                       OR r.author_person_type_id NOT IN (
                            SELECT id FROM demos_app.user_person_type_limit))
             THEN 'public route but author is not an auth user (no users row)' END
      )                AS reason
    FROM stg.comment_resolved r
    LEFT JOIN mysql_raw.crosswalk_comment_origin co ON co.legacy_cd = r.origin_cd
    WHERE NOT EXISTS (
            SELECT 1 FROM demos_app.private_comment p WHERE p.id = r.new_uuid
          )
      AND NOT EXISTS (
            SELECT 1 FROM demos_app.public_comment q WHERE q.id = r.new_uuid
          );
  $v$;
END
$$;

