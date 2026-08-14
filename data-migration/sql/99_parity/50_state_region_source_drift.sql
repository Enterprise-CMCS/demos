/*
 * Purpose:    Cross-checks state -> CMS region between the authoritative migration.state_region seed and the PMDA source column, surfacing any divergence.
 * Inputs:     migration.state_region; mysql_raw.geo_ansi_state_rfrnc (rgnl_ofc_cd)
 * Outputs:    migration._parity_state_region_drift
 * Invariants: NON-GATING informational (the check always returns GREEN and writes any drift per-row to reports/orphans/state_region_drift.csv); conditional-DDL guard via to_regclass so it is a clean no-op before pgloader populates mysql_raw and before the seed is applied; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 18); reports/audits/cma_code_audit.md R4; sql/02_seeds_static/25_state_region.sql
 *
 * Parity check 18: state -> CMS region drift between the migration's
 * authoritative seed and the PMDA source (non-gating informational log).
 *
 * The migration mints/validates the PMDA project number `11-W-NNNNN/R` from
 * migration.state_region (sql/02_seeds_static/25_state_region.sql), an
 * authoritative hardcoded HHS region list. The CMA audit (reports/audits/cma_code_audit.md
 * R4) surfaced geo_ansi_state_rfrnc.rgnl_ofc_cd as the source-of-truth column
 * for the same mapping. This view cross-checks the seed against that source
 * column so any divergence (a state assigned a different region, or present in
 * one side only) is visible at the gate instead of silently trusted.
 *
 * NON-GATING: the parity check that reads this view always returns GREEN and
 * writes any drift per-row to reports/orphans/state_region_drift.csv. The seed
 * is deliberately authoritative (it carries territories and a no-FK rationale
 * the source may not match), so a divergence is a review signal, not a build
 * failure.
 *
 * rgnl_ofc_cd is a plain smallint 1-10 in the source (verified against
 * reports/schema_snapshot/columns.csv and the 2024 dump), so no normalization
 * is needed. Soft-deleted/extra source codes with a NULL region are ignored.
 *
 * Conditional DDL: guarded with to_regclass so it is a clean no-op before
 * pgloader populates mysql_raw and before the seed is applied; CREATE OR
 * REPLACE keeps re-apply idempotent.
 */
SET search_path TO migration, mysql_raw, public;

DO $$
BEGIN
  IF to_regclass('mysql_raw.geo_ansi_state_rfrnc') IS NULL THEN
    RAISE NOTICE 'parity state_region_drift: mysql_raw.geo_ansi_state_rfrnc absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration.state_region') IS NULL THEN
    RAISE NOTICE 'parity state_region_drift: migration.state_region absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_state_region_drift AS
    SELECT
      COALESCE(s.state_id, g.geo_ansi_state_cd)        AS state_id,
      s.region                                         AS seed_region,
      g.rgnl_ofc_cd                                    AS source_region,
      CASE
        WHEN s.state_id IS NULL              THEN 'state in source not in seed'
        WHEN g.geo_ansi_state_cd IS NULL     THEN 'state in seed not in source'
        ELSE 'region mismatch'
      END                                              AS reason
    FROM migration.state_region s
    FULL OUTER JOIN (
      SELECT geo_ansi_state_cd, rgnl_ofc_cd
      FROM mysql_raw.geo_ansi_state_rfrnc
      WHERE rgnl_ofc_cd IS NOT NULL
    ) g ON g.geo_ansi_state_cd = s.state_id
    WHERE s.state_id IS NULL
       OR g.geo_ansi_state_cd IS NULL
       OR s.region IS DISTINCT FROM g.rgnl_ofc_cd::smallint;
  $v$;
END
$$;

