/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_dlvrbl_cmt.cmt_orgn_cd single-char origin codes to a DEMOS comment route ('private' | 'public').
 * Inputs:     none (DDL only); values load from reports/crosswalks/comment_origin.csv via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_comment_origin
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); demos_route CHECK constrains values to {private, public}; a code-less comment routes PRIVATE in the loader (sql/20_app/50_comment.sql) unless its author is a state user, so CMS content is never published by default; coverage is fail-closed via sql/04_crosswalks/73_comment_origin_check.sql (plus the non-gating parity check 47_comment_routing_coverage.sql).
 * Refs:       docs/sme/explanation-comments-routing.adoc, sql/20_app/50_comment.sql, sql/99_parity/47_comment_routing_coverage.sql
 *
 * Crosswalk: legacy MySQL mdcd_dlvrbl_cmt.cmt_orgn_cd (char(1)) -> DEMOS comment
 * route. PMDA records a single-character comment-origin code (observed domain
 * {A, B, C, I, R, S}); DEMOS splits comments into demos_app.private_comment
 * (CMS-internal, FK author_person_type_id -> cms_user_person_type_limit) and
 * demos_app.public_comment (state-visible). One legacy code maps to one route.
 *
 * AUTHORED: routes live in reports/crosswalks/comment_origin.csv and load via
 * the registry. All six codes the live source uses are mapped: 'S' (the only
 * state-origin code -- 4320 of its 4325 rows are state-authored) is public;
 * A, B, C, I and R are private.
 *
 * WHY EVERYTHING BUT 'S' IS PRIVATE, AND HOW TO REVERSE IT
 *
 * The routes are NOT derived from who authored the comment. 649 of 650 'R' rows
 * and 172 of 172 'B' rows are CMS-authored, yet 85-88% of their deliverables also
 * carry state comments, so they plausibly belong to the CMS<->state exchange --
 * but only 40-50% actually follow a state comment in time, and nothing in the
 * source separates "CMS reply the state should read" from "CMS note that happens
 * to sit in a state thread". Routing them public would make 822 CMS-authored
 * comments state-visible, and after cutover that cannot be taken back; the SME
 * guidance in docs/sme/explanation-comments-routing.adoc explicitly warns that
 * CMS-internal comments may carry sensitive evaluation language.
 *
 * So they route private, which is the recoverable direction: the cost is reduced
 * state visibility, not disclosure. If SME rules that 'R' and/or 'B' are
 * state-facing, change demos_route to 'public' for that row in
 * reports/crosswalks/comment_origin.csv and rebuild -- no other file changes, and
 * no data is lost in the meantime. reports/generated/comment_route_diff.csv
 * (scripts/sme_review_exports.py comment-route-diff) shows exactly which rows each
 * candidate route moves.
 *
 * Coverage is fail-closed in sql/04_crosswalks/73_comment_origin_check.sql: a live
 * cmt_orgn_cd that is neither mapped here nor on that file's SME-deferred
 * allow-list stops the run, so a seventh code cannot be silently absorbed by the
 * private default. The non-gating parity check
 * sql/99_parity/47_comment_routing_coverage.sql reports coverage per run.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_comment_origin;

CREATE TABLE mysql_raw.crosswalk_comment_origin(
  legacy_cd text PRIMARY KEY,
  demos_route text NOT NULL,
  notes text,
  CONSTRAINT crosswalk_comment_origin_route_chk CHECK (demos_route IN ('private', 'public'))
);

