/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_dlvrbl_cmt.cmt_orgn_cd single-char origin codes to a DEMOS comment route ('private' | 'public').
 * Inputs:     none (DDL only); values are authored later by SME and would load via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_comment_origin
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); GATED -- no registry/CSV entry yet, so the table is recreated EMPTY each run; demos_route CHECK constrains values to {private, public}; while empty the loader (sql/20_app/50_comment.sql) falls back to the author-person-type default; no fail-closed _check.sql yet (coverage is the non-gating parity check 47_comment_routing_coverage.sql).
 * Refs:       docs/sme/explanation-comments-routing.adoc, sql/20_app/50_comment.sql, sql/99_parity/47_comment_routing_coverage.sql, docs/specs/comment-deliverable-resourcing-spec.md
 *
 * Crosswalk: legacy MySQL mdcd_dlvrbl_cmt.cmt_orgn_cd (char(1)) -> DEMOS comment
 * route. PMDA records a single-character comment-origin code (observed domain
 * {A, B, C, I, R, S}); DEMOS splits comments into demos_app.private_comment
 * (CMS-internal, FK author_person_type_id -> cms_user_person_type_limit) and
 * demos_app.public_comment (state-visible). One legacy code maps to one route.
 *
 * GATED: this is DDL only and has NO entry in reports/crosswalks/registry.yaml,
 * so every run recreates it EMPTY pending the SME sign-off that assigns a route
 * to each origin code. While empty, the loader routes by the author's
 * person_type (CMS author -> private, else public); see sql/20_app/50_comment.sql.
 * The non-gating parity check sql/99_parity/47_comment_routing_coverage.sql lists
 * the origin codes the source actually uses that are still unmapped here, so the
 * SME can see exactly what remains. When the routes are authored, add the CSV +
 * registry entry; a fail-closed _check.sql can then be added like
 * 51_deliverable_status_check.sql.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_comment_origin;

CREATE TABLE mysql_raw.crosswalk_comment_origin(
  legacy_cd text PRIMARY KEY,
  demos_route text NOT NULL,
  notes text,
  CONSTRAINT crosswalk_comment_origin_route_chk
    CHECK (demos_route IN ('private', 'public'))
);
