/*
 * Purpose:    Fail-closed completeness check that every legacy mdcd_demo_amndmt_stus_cd present in the source has a mapping row in crosswalk_amendment_status.
 * Inputs:     mysql_raw.mdcd_demo_amndmt, mysql_raw.crosswalk_amendment_status
 * Outputs:    none (validation only; RAISEs EXCEPTION on a gap)
 * Invariants: fail-closed the moment any source amendment code lacks a mapping; to_regclass-guarded no-op before load; a present-but-empty source is a NOTICE no-op (an empty mdcd_demo_amndmt is legitimate).
 * Refs:       reports/crosswalks/proposed/_review.md (P2 amendment_status), sql/04_crosswalks/64_amendment_status.sql
 *
 * Completeness check for crosswalk_amendment_status: every legacy
 * mdcd_demo_amndmt_stus_cd present in the loaded source must have a mapping.
 *
 * The crosswalk ships EMPTY (no invented mappings, see 64_amendment_status.sql),
 * so this check fails closed the moment any source amendment exists -- forcing
 * SME sign-off (reports/crosswalks/proposed/_review.md, P2 amendment_status)
 * before amendments can pass `migrate crosswalks`. This mirrors the fail-closed
 * completeness pattern of 11_demo_status_check.sql.
 *
 * Unlike mdcd_demo, an empty mdcd_demo_amndmt is legitimate (a source with no
 * amendments), so a present-but-empty source is a NOTICE no-op rather than a
 * failure: we fail closed only when there is something to map and no mapping.
 * Guarded by to_regclass so it no-ops before pgloader populates mysql_raw.
 */
DO $$
DECLARE
  missing int;
BEGIN
  IF to_regclass('mysql_raw.mdcd_demo_amndmt') IS NULL THEN
    RAISE NOTICE 'crosswalk_amendment_status check skipped: mysql_raw.mdcd_demo_amndmt not loaded yet';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.mdcd_demo_amndmt) THEN
  RAISE NOTICE 'crosswalk_amendment_status check: no source amendments present; nothing to map';
  RETURN;
END IF;
  SELECT
    count(*) INTO missing
  FROM ( SELECT DISTINCT
      mdcd_demo_amndmt_stus_cd AS cd
    FROM
      mysql_raw.mdcd_demo_amndmt
    WHERE
      mdcd_demo_amndmt_stus_cd IS NOT NULL
    EXCEPT
    SELECT
      legacy_int_cd
    FROM
      mysql_raw.crosswalk_amendment_status) t;
  IF missing > 0 THEN
    RAISE EXCEPTION 'crosswalk_amendment_status is missing % legacy amendment status code(s) present in mdcd_demo_amndmt. This crosswalk is an SME blocker: proposed values are in reports/crosswalks/amendment_status.csv and await sign-off (reports/crosswalks/proposed/_review.md, P2 amendment_status). Amendments are not migrated until it is confirmed and inlined.', missing;
  END IF;
END
$$;

