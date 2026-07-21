/*
 * Purpose:    Lists the legacy cmt_orgn_cd origin codes the source actually uses that are not yet mapped in the gated crosswalk_comment_origin, so the SME sees exactly what routing remains to author.
 * Inputs:     stg.comment_resolved; mysql_raw.crosswalk_comment_origin
 * Outputs:    migration._parity_comment_routing_coverage
 * Invariants: NON-GATING (the cmt_orgn_cd crosswalk is deliberately gated/empty; this reports coverage, it does not RED the gate); conditional-DDL guard on stg.comment_resolved so the app-layers idempotency harness applies it as a no-op; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "comment routing coverage"); sql/04_crosswalks/68_comment_origin.sql; sql/20_app/50_comment.sql
 *
 * Parity check: comment routing coverage (unmapped origin codes).
 *
 * crosswalk_comment_origin (sql/04_crosswalks/68_*) is GATED: it is recreated
 * empty each run until the SME authors a private/public route per legacy
 * cmt_orgn_cd code. While it is empty, the loader routes by the author's
 * person_type. This view lists each origin code the source actually uses
 * (from stg.comment_resolved, direct deliverable comments only -- paper comments
 * carry no code) that has no route in the crosswalk, with its comment count, so
 * the SME knows exactly what remains. NON-GATING by design: an unmapped code is
 * expected today, not an error.
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
