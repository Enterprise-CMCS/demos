/*
 * Purpose:    Per-(status, phase, derivation-path) tally of the current_phase_id assigned to each LOADED demonstration, for SME ratification of the date-derived phase approximation.
 * Inputs:     stg.demonstration_resolved; demos_app.demonstration; mysql_raw.crosswalk_demo_status
 * Outputs:    migration._parity_demonstration_phase_derived
 * Invariants: NON-GATING informational (the reading check always returns GREEN and emits the tally inline); conditional-DDL guard on stg.demonstration_resolved (NOT demos_app.demonstration) so the app-layers idempotency harness applies it as a no-op and test_parity_views_empty does not assert on it; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "demonstration phase derivation" CheckResult; sql/10_stg/22_demonstration_resolved.sql; sql/20_app/30_demonstration.sql; phase counterpart to sql/99_parity/52_amendment_load.sql (_parity_amendment_phase_derived)
 *
 * Demonstration phase derivation tally (non-gating informational log).
 *
 * The demonstration loader (sql/20_app/30_demonstration.sql) assigns
 * current_phase_id by
 *   COALESCE(current_phase_by_date,
 *            CASE WHEN status = 'Approved' THEN 'Approval Summary' END,
 *            'Concept')
 * where current_phase_by_date is the §6.1 "highest started phase by date"
 * derivation in stg.demonstration_resolved (10_stg/22_*) -- a best-effort
 * ordinal alignment of the legacy 6-phase milestones onto the DEMOS 8-phase
 * lifecycle, flagged as pending SME ratification. There is no single source
 * column to validate it against, so this view tallies, per loaded
 * demonstration, the final current_phase_id alongside which COALESCE branch
 * produced it:
 *   date-derived      a legacy phase milestone supplied current_phase_by_date
 *   approved-fallback no date signal, but the mapped status is 'Approved'
 *   concept-default   no date signal and not Approved -> the 'Concept' entry phase
 * The (status_id x derived_phase x source_path) cross-tab lets an SME ratify
 * the mapping and spot anomalies (e.g. an 'Approved' demonstration that landed
 * in an earlier phase because its furthest legacy milestone predates approval).
 *
 * Only LOADED demonstrations are counted (the inner join to
 * demos_app.demonstration); held-back demonstrations are accounted for by the
 * gating completeness check (sql/99_parity/11_*) and the non-gating
 * approved-demo-held log (sql/99_parity/12_*), exactly like the amendment split.
 *
 * NON-GATING: the parity check that reads this view always returns GREEN and
 * emits the per-path tally inline. It is a review signal, not a build failure.
 *
 * Conditional DDL: guarded on stg.demonstration_resolved (NOT on
 * demos_app.demonstration) so it is NOT created in the app-layers idempotency
 * harness (which stands up demos_app with no mysql_raw/stg); the harness applies
 * this file as a clean no-op and test_parity_views_empty does not assert on it.
 * Re-apply is idempotent via CREATE OR REPLACE. run_parity applies 99_parity
 * after build, where the staging view and the crosswalk exist.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity demonstration_phase_derived: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_demo_status') IS NULL THEN
    RAISE NOTICE 'parity demonstration_phase_derived: mysql_raw.crosswalk_demo_status absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_phase_derived AS
    SELECT
      cw.demos_text_id   AS status_id,
      d.current_phase_id AS derived_phase,
      CASE
        WHEN r.current_phase_by_date IS NOT NULL THEN 'date-derived'
        WHEN cw.demos_text_id = 'Approved'       THEN 'approved-fallback'
        ELSE 'concept-default'
      END                AS source_path,
      count(*)           AS n
    FROM stg.demonstration_resolved r
    JOIN demos_app.demonstration d          ON d.id = r.new_uuid
    JOIN mysql_raw.crosswalk_demo_status cw ON cw.legacy_int_cd = r.status_cd
    GROUP BY 1, 2, 3;
  $v$;
END
$$;
