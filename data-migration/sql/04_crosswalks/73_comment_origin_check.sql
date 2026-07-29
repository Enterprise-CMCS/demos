/*
 * Purpose:    Fail-closed completeness check for crosswalk_comment_origin -- every live cmt_orgn_cd must be mapped or explicitly SME-deferred.
 * Inputs:     mysql_raw.mdcd_dlvrbl_cmt, mysql_raw.crosswalk_comment_origin
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed on an UNKNOWN code (neither mapped nor on the deferred allow-list below); to_regclass-guarded no-op before load; a present-but-empty source is a NOTICE no-op; NULL cmt_orgn_cd is not a code and is exempt (the loader routes it private); the allow-list is EMPTY today, so this is currently full-coverage.
 * Refs:       sql/04_crosswalks/68_comment_origin.sql, reports/crosswalks/comment_origin.csv, sql/20_app/50_comment.sql, sql/99_parity/47_comment_routing_coverage.sql, docs/sme/explanation-comments-routing.adoc
 *
 * Completeness check for crosswalk_comment_origin.
 *
 * A comment's route decides whether a state can read it, so an origin code the
 * migration has never seen must not be resolved by a default. This check fails
 * closed: a live cmt_orgn_cd that is neither mapped in the crosswalk nor named
 * in the SME-deferred allow-list below stops the run.
 *
 * The allow-list exists so that a deliberate deferral is recorded as such rather
 * than being indistinguishable from an oversight. It is EMPTY today -- all six
 * codes the live source uses ({A, B, C, I, R, S}) are mapped -- so in practice
 * this is a full-coverage check, and its real job is to catch a SEVENTH code
 * appearing in the source between now and cutover.
 *
 * NULL cmt_orgn_cd is not a code and is exempt. The loader routes an unmapped or
 * NULL origin to the private side (sql/20_app/50_comment.sql), so an unknown
 * comment is never published to a state; this check is what stops that fail-safe
 * from quietly becoming the migration's answer for a whole new code.
 */
DO $$
DECLARE
  -- SME-deferred origin codes: deliberately unmapped, route by the loader's
  -- private default. Empty today; add a code here ONLY with an SME decision
  -- recorded in reports/crosswalks/comment_origin.csv notes.
  DEFERRED text[] := ARRAY[]::text[];
  unknown int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_dlvrbl_cmt') IS NULL THEN
    RAISE NOTICE 'crosswalk_comment_origin check: mysql_raw.mdcd_dlvrbl_cmt not loaded yet; completeness deferred';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_dlvrbl_cmt) THEN
  RAISE NOTICE 'crosswalk_comment_origin check: no source deliverable comments present; nothing to map';
  RETURN;
END IF;
  SELECT
    count(*)
  INTO
    unknown
  FROM ( SELECT DISTINCT
      cmt_orgn_cd AS cd
    FROM
      mysql_raw.mdcd_dlvrbl_cmt
    WHERE
      cmt_orgn_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_cd
    FROM
      mysql_raw.crosswalk_comment_origin
    EXCEPT
    SELECT
      unnest(DEFERRED)) t;
    IF unknown > 0 THEN
      RAISE EXCEPTION 'crosswalk_comment_origin: % live cmt_orgn_cd value(s) are neither mapped nor SME-deferred; a comment route may not be guessed', unknown;
    END IF;
END
$$;

