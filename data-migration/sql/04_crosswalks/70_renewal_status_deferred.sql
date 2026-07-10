/*
 * Purpose:    Documented no-op for the legacy mdcd_demo_rnwl_stus_cd crosswalk: renewals are DEFERRED (post-MVP), so no mapping is authored.
 * Inputs:     mysql_raw.mdcd_demo_rnwl (counted only, when present)
 * Outputs:    none (no table created; emits a NOTICE if source renewal rows exist)
 * Invariants: intentionally never fails closed (unlike the other crosswalk checks); to_regclass-guarded no-op before load; raises only a NOTICE so the deferral stays visible; replace with a real crosswalk_renewal_status table + completeness check when renewals are designed.
 * Refs:       -
 *
 * Crosswalk: legacy MySQL mdcd_demo_rnwl_stus_cd -> DEMOS.
 *
 * SME review decision: renewals are DEFERRED (post-MVP). DEMOS has no renewals
 * concept, and the earlier "Renewal == Extension" framing is withdrawn pending
 * the post-MVP renewal design. We therefore do NOT author a mapping and we do
 * NOT fail closed on unmapped renewal codes the way other crosswalks do --
 * forcing a mapping now would be premature.
 *
 * This file is intentionally a documented no-op. It raises a NOTICE if the
 * source actually carries renewal rows, so the deferral stays visible, but it
 * never raises an exception. When renewals are designed, replace this with a
 * real crosswalk_renewal_status table + completeness check.
 */
DO $$
DECLARE
  src_rows int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo_rnwl') IS NULL THEN
    RAISE NOTICE 'renewal_status crosswalk skipped (DEFERRED post-MVP): mysql_raw.mdcd_demo_rnwl not loaded';
    RETURN;
  END IF;
  EXECUTE 'SELECT count(*) FROM mysql_raw.mdcd_demo_rnwl' INTO src_rows;
  RAISE NOTICE 'renewal_status crosswalk DEFERRED post-MVP: % source renewal row(s) present and intentionally NOT migrated', src_rows;
END
$$;

