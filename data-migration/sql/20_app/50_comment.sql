/*
 * Purpose:    Load demos_app.private_comment + demos_app.public_comment from stg.comment_resolved, routing each deliverable comment by the (gated) cmt_orgn_cd crosswalk or the author-person-type default.
 * Inputs:     stg.comment_resolved; mysql_raw.crosswalk_comment_origin (gated, empty today); demos_app.deliverable (loaded-parent JOIN).
 * Outputs:    demos_app.private_comment, demos_app.public_comment
 * Invariants: runs inside the deferred-constraint build_app txn; RETURNs before the INSERTs while stg.comment_resolved is absent (app-layers idempotency harness no-op); inner-join demos_app.deliverable so a comment whose parent deliverable was not loaded is held back; private route requires a CMS author person_type (cms_user_person_type_limit); public route requires an auth-user person_type (user_person_type_limit) so its author_user_id FK holds; empty content + unresolved author held back; held-back rows logged for SME review by the parity views; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       sql/04_crosswalks/68_comment_origin.sql, sql/10_stg/33_comment_resolved.sql, sql/99_parity/44_comment_held.sql, sql/99_parity/45_comment_completeness.sql, sql/99_parity/46_comment_integrity.sql, sql/99_parity/47_comment_routing_coverage.sql, docs/specs/comment-deliverable-resourcing-spec.md
 *
 * App load: demos_app.private_comment / demos_app.public_comment from the
 * deliverable comments resolved in stg.comment_resolved (10_stg/33_*).
 *
 * Comments cascade from deliverables: the loader inner-joins
 * demos_app.deliverable, so a comment loads once its parent deliverable loads.
 * With the deliverable_type crosswalk now authored (sql/04_crosswalks/52_*),
 * deliverables load and their comments cascade in with no further change; a
 * comment whose parent was held back is itself held back and logged.
 *
 * Routing: DEMOS splits comments into private_comment (CMS-internal; author
 * person_type FK -> cms_user_person_type_limit) and public_comment
 * (state-visible). The legacy cmt_orgn_cd code chooses the route via the GATED
 * crosswalk mysql_raw.crosswalk_comment_origin (sql/04_crosswalks/68_*), which
 * is EMPTY until SME authors a route per origin code. While empty, the route
 * falls back to the author's person_type:
 *   route = COALESCE(crosswalk_comment_origin.demos_route,
 *                    CASE WHEN author is CMS user THEN 'private' ELSE 'public' END)
 * Paper comments (source='paper') carry no origin code, so they always take the
 * author-default route.
 *
 * Hold-backs (logged, non-gating; see sql/99_parity/44_comment_held.sql):
 *   - parent deliverable not loaded (held-back deliverable)
 *   - author user_id did not migrate (author_user_id IS NULL)
 *   - empty/whitespace content
 *   - route='private' but the author is not a CMS user (caught here by the
 *     person_type floor, surfaced as an integrity anomaly)
 *   - route='public' but the author is not an auth user -- e.g. a
 *     non-user-contact (external evaluator) who has a person row but no users
 *     row; the user_person_type_limit floor holds these back so the
 *     public_comment.author_user_id -> users FK holds at the constraints phase
 *
 * DEFERRED-SME: (1) the cmt_orgn_cd routes for the observed code domain
 * {A,B,C,I,R,S} are not authored yet (crosswalk_comment_origin is gated);
 * (2) the non-deliverable comment sources (mdcd_demo_cmt, mdcd_demo_amndmt_cmt,
 * mdcd_demo_rnwl_cmt, mdcd_pgm_cmt, mdcd_demo_finl_dcsn_dtl_cmt,
 * mdcd_demo_pgm_mntrg_doc_cmt, bdgt_ntrlty_fil_doc_cmt) have no deliverable and
 * are out of scope here pending an SME routing decision; (3) cmt_aftr_acptd_ind
 * has no DEMOS target. See docs/sme/explanation-comments-routing.adoc.
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.comment_resolved') IS NULL THEN
    RAISE NOTICE 'skip comment load: stg.comment_resolved not built yet';
    RETURN;
  END IF;
  INSERT INTO demos_app.private_comment(id, deliverable_id, author_user_id, author_person_type_id, content, created_at, updated_at)
  SELECT
    r.new_uuid,
    r.deliverable_id,
    r.author_user_id,
    r.author_person_type_id,
    r.content,
    r.created_at,
    r.updated_at
  FROM
    stg.comment_resolved r
    JOIN demos_app.deliverable d ON d.id = r.deliverable_id
    LEFT JOIN mysql_raw.crosswalk_comment_origin co ON co.legacy_cd = r.origin_cd
  WHERE
    COALESCE(co.demos_route, CASE WHEN r.author_person_type_id IN ('demos-admin', 'demos-cms-user') THEN
        'private'
      ELSE
        'public'
      END) = 'private'
    AND r.author_user_id IS NOT NULL
    AND r.author_person_type_id IN ('demos-admin', 'demos-cms-user')
    AND r.content <> ''
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.private_comment ex
      WHERE
        ex.id = r.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
  INSERT INTO demos_app.public_comment(id, deliverable_id, author_user_id, content, created_at, updated_at)
  SELECT
    r.new_uuid,
    r.deliverable_id,
    r.author_user_id,
    r.content,
    r.created_at,
    r.updated_at
  FROM
    stg.comment_resolved r
    JOIN demos_app.deliverable d ON d.id = r.deliverable_id
    LEFT JOIN mysql_raw.crosswalk_comment_origin co ON co.legacy_cd = r.origin_cd
  WHERE
    COALESCE(co.demos_route, CASE WHEN r.author_person_type_id IN ('demos-admin', 'demos-cms-user') THEN
        'private'
      ELSE
        'public'
      END) = 'public'
    AND r.author_user_id IS NOT NULL
    AND r.author_person_type_id IN (
      SELECT
        id
      FROM
        demos_app.user_person_type_limit)
    AND r.content <> ''
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.public_comment ex
      WHERE
        ex.id = r.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
  SELECT
    count(*)
  INTO
    held
  FROM
    stg.comment_resolved r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.private_comment p
      WHERE
        p.id = r.new_uuid)
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.public_comment q
      WHERE
        q.id = r.new_uuid);
  IF held > 0 THEN
    RAISE NOTICE 'comment load: % comment(s) held back (parent deliverable not loaded, unresolved author, empty content, private route with non-CMS author, or public route with non-auth author); see migration._parity_comment_held', held;
  END IF;
END
$$;

