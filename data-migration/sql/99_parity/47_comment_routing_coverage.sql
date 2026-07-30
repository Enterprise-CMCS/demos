/*
 * Purpose:    Lists the legacy cmt_orgn_cd origin codes the source actually uses that have no route in crosswalk_comment_origin, so a code appearing after sign-off is visible at the gate.
 * Inputs:     stg.comment_resolved; mysql_raw.crosswalk_comment_origin
 * Outputs:    migration._parity_comment_routing_coverage
 * Invariants: NON-GATING (this reports coverage, it does not RED the gate; fail-closed coverage lives in sql/04_crosswalks/73_comment_origin_check.sql); conditional-DDL guard on stg.comment_resolved so the app-layers idempotency harness applies it as a no-op; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "comment routing coverage"); sql/04_crosswalks/68_comment_origin.sql; sql/20_app/50_comment.sql
 *
 * Parity check: comment routing coverage (unmapped origin codes).
 *
 * crosswalk_comment_origin (sql/04_crosswalks/68_*) is AUTHORED: all six codes
 * the live source uses have a route in reports/crosswalks/comment_origin.csv,
 * loaded via reports/crosswalks/registry.yaml. An authored route always wins;
 * the author-person-type fallback in sql/20_app/50_comment.sql now only covers
 * comments carrying no code at all. This view lists each origin code the source
 * actually uses (from stg.comment_resolved, direct deliverable comments only --
 * paper comments carry no code) that has no route in the crosswalk, with its
 * comment count. It has nothing to report today; its job is to surface a seventh
 * code appearing in the source before cutover. NON-GATING by design: the
 * fail-closed twin is sql/04_crosswalks/73_comment_origin_check.sql, which stops
 * the run on an unmapped, non-SME-deferred code.
 *
 * Conditional DDL: guarded on stg.comment_resolved, which exists only in the
 * full pipeline; re-apply idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, public;

DO $$
BEGIN
  IF to_regclass('stg.comment_resolved') IS NULL THEN
    RAISE NOTICE 'parity comment_routing_coverage: stg.comment_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_comment_routing_coverage AS
    SELECT
      r.origin_cd     AS origin_cd,
      count(*)        AS comment_count
    FROM stg.comment_resolved r
    WHERE r.origin_cd IS NOT NULL
      AND NOT EXISTS (
            SELECT 1 FROM mysql_raw.crosswalk_comment_origin co
             WHERE co.legacy_cd = r.origin_cd
          )
    GROUP BY r.origin_cd;
  $v$;
END
$$;

