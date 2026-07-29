/*
 * Purpose:    Load demos_app.private_comment + demos_app.public_comment from stg.comment_resolved, routing each deliverable comment by the authored cmt_orgn_cd crosswalk, defaulting a code-less comment to private (state-authored: public).
 * Inputs:     stg.comment_resolved; mysql_raw.crosswalk_comment_origin (authored); demos_app.deliverable (loaded-parent JOIN).
 * Outputs:    demos_app.private_comment, demos_app.public_comment
 * Invariants: runs inside the deferred-constraint build_app txn; RETURNs before the INSERTs while stg.comment_resolved is absent (app-layers idempotency harness no-op); inner-join demos_app.deliverable so a comment whose parent deliverable was not loaded is held back; private route requires a CMS author person_type (cms_user_person_type_limit); public route requires an auth-user person_type (user_person_type_limit) so its author_user_id FK holds; empty content + unresolved author held back; held-back rows logged for SME review by the parity views; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       sql/04_crosswalks/68_comment_origin.sql, sql/10_stg/36_comment_resolved.sql, sql/99_parity/44_comment_held.sql, sql/99_parity/45_comment_completeness.sql, sql/99_parity/46_comment_integrity.sql, sql/99_parity/47_comment_routing_coverage.sql, docs/specs/comment-deliverable-resourcing-spec.md
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
 * (state-visible). The legacy cmt_orgn_cd code chooses the route via
 * mysql_raw.crosswalk_comment_origin (sql/04_crosswalks/68_*, authored in
 * reports/crosswalks/comment_origin.csv):
 *   route = COALESCE(crosswalk_comment_origin.demos_route,
 *                    CASE WHEN author is a state user THEN 'public'
 *                         ELSE 'private' END)
 *
 * An authored route always wins. The fallback only covers a comment with NO
 * origin code (paper comments, and 96 deliverable comments), and it defaults to
 * PRIVATE rather than inferring visibility from who typed the comment. That
 * inference does not hold: 649 of 650 'R' comments and all 172 'B' comments are
 * CMS-authored yet sit in state threads, so an author-type rule and a route rule
 * disagree on ~822 rows, and publishing a CMS comment to a state cannot be undone
 * after cutover. sql/04_crosswalks/73_comment_origin_check.sql fails the run if a
 * code appears that no SME has ruled on, so the private default can never become
 * the answer for a whole new code.
 *
 * The one exception is a STATE-authored comment, which routes public: the state
 * wrote it, so showing it back to that state discloses nothing, and defaulting it
 * private would instead hold it back (private_comment requires a CMS author
 * person_type) and lose it for no safety gain.
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
 * DEFERRED-SME: (1) codes 'R' and 'B' are routed private on the fail-safe rule
 * rather than on a positive SME determination -- the source cannot distinguish a
 * CMS reply the state should see from a CMS internal note in a state thread. If
 * SME later rules either one state-facing, the reversal is a one-line CSV edit
 * (demos_route public) plus a rebuild; there is no data loss in the meantime,
 * only reduced state visibility. reports/generated/comment_route_diff.csv (from
 * scripts/sme_review_exports.py comment-route-diff) is the review artifact;
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
    COALESCE(co.demos_route, CASE WHEN r.author_person_type_id = 'demos-state-user' THEN
        'public'
      ELSE
        'private'
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
    COALESCE(co.demos_route, CASE WHEN r.author_person_type_id = 'demos-state-user' THEN
        'public'
      ELSE
        'private'
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

