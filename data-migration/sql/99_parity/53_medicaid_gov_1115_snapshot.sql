/*
 * Purpose:    Cross-checks published medicaid.gov 1115 outcome facts against the migrated demonstrations (status + effective/expiration/approval dates).
 * Inputs:     migration._medicaid_gov_1115_snapshot (loaded from reports/medicaid_gov_1115_snapshot.csv); demos_app.demonstration; demos_app.application_date
 * Outputs:    migration._parity_medicaid_gov_1115 (plus the migration._medicaid_gov_1115_snapshot staging table, CREATE IF NOT EXISTS)
 * Invariants: NON-GATING informational (the check always returns GREEN and writes per-row drift to reports/orphans/medicaid_gov_1115_drift.csv); the table is CREATE IF NOT EXISTS (always safe) and the view is conditional-DDL guarded by to_regclass so it is a clean no-op before the snapshot table or demos_app.demonstration exist; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 20); reports/medicaid_gov_1115_snapshot.csv; document-ocr extract-facts command
 *
 * Parity check 20: medicaid.gov 1115 outcome-fact cross-check (non-gating).
 *
 * A pre-matched snapshot CSV (reports/medicaid_gov_1115_snapshot.csv, produced
 * by the document-ocr extract-facts command) is loaded into
 * migration._medicaid_gov_1115_snapshot by the Python parity check before this
 * view is read. The CSV carries medicaid.gov facts (mg_*) + a matched
 * medicaid_id for each demonstration; this view LEFT JOINs to the CURRENT
 * demos_app.demonstration (by medicaid_id) and demos_app.application_date (for
 * the approval date) to surface any discrepancy between the published
 * medicaid.gov facts and the migrated target.
 *
 * Four facts are compared (date-only to avoid timezone noise):
 *   status_id, effective_date, expiration_date, approval_date
 *
 * Three row classes are surfaced:
 *   'matched' with a discrepancy (status/date mismatch)
 *   'mg_only'   -- on medicaid.gov but not migrated
 *   'migrated_only' -- migrated but not on medicaid.gov
 * Plus a runner-up note for ambiguous fuzzy matches.
 *
 * NON-GATING: the Python check that reads this view always returns GREEN and
 * writes per-row drift to reports/orphans/medicaid_gov_1115_drift.csv.
 * medicaid.gov data may legitimately lag or differ from the internal CMS data.
 *
 * Conditional DDL: the table is CREATE IF NOT EXISTS (always safe); the view is
 * guarded by to_regclass so it is a clean no-op before the snapshot table or
 * demos_app.demonstration exist. CREATE OR REPLACE keeps re-apply idempotent.
 */
SET search_path TO migration, demos_app, public;

CREATE TABLE IF NOT EXISTS migration._medicaid_gov_1115_snapshot(
  match_status text,
  match_score int,
  mg_state text,
  mg_name text,
  mg_status text,
  mg_approval_date date,
  mg_effective_date date,
  mg_expiration_date date,
  matched_medicaid_id text,
  mig_name text,
  runner_up_medicaid_id text,
  runner_up_name text,
  runner_up_score int
);

DO $$
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'parity medicaid_gov_1115: demos_app.demonstration absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_medicaid_gov_1115 AS
    SELECT
      s.match_status,
      s.match_score,
      s.mg_state,
      s.mg_name,
      s.mg_status,
      s.mg_approval_date,
      s.mg_effective_date,
      s.mg_expiration_date,
      s.matched_medicaid_id,
      s.mig_name,
      s.runner_up_medicaid_id,
      s.runner_up_name,
      s.runner_up_score,
      d.status_id              AS mig_status,
      d.effective_date::date   AS mig_effective_date,
      d.expiration_date::date  AS mig_expiration_date,
      ad.date_value::date      AS mig_approval_date,
      CASE
        WHEN s.match_status = 'matched'
          AND s.mg_status IS DISTINCT FROM d.status_id
          THEN 'status mismatch'
        WHEN s.match_status = 'matched'
          AND s.mg_effective_date IS DISTINCT FROM d.effective_date::date
          THEN 'effective_date mismatch'
        WHEN s.match_status = 'matched'
          AND s.mg_expiration_date IS DISTINCT FROM d.expiration_date::date
          THEN 'expiration_date mismatch'
        WHEN s.match_status = 'matched'
          AND s.mg_approval_date IS DISTINCT FROM ad.date_value::date
          THEN 'approval_date mismatch'
        WHEN s.match_status = 'matched'
          AND s.runner_up_medicaid_id IS NOT NULL
          THEN 'ambiguous match (runner-up logged)'
        WHEN s.match_status = 'mg_only'
          THEN 'on medicaid.gov but not migrated'
        WHEN s.match_status = 'migrated_only'
          THEN 'migrated but not on medicaid.gov'
      END                       AS discrepancy
    FROM migration._medicaid_gov_1115_snapshot s
    LEFT JOIN demos_app.demonstration d
      ON d.medicaid_id = s.matched_medicaid_id
    LEFT JOIN demos_app.application_date ad
      ON ad.application_id = d.id
     AND ad.date_type_id = 'Application Approval Date'
    WHERE s.match_status IN ('mg_only', 'migrated_only')
       OR (s.match_status = 'matched' AND (
         s.mg_status IS DISTINCT FROM d.status_id
         OR s.mg_effective_date IS DISTINCT FROM d.effective_date::date
         OR s.mg_expiration_date IS DISTINCT FROM d.expiration_date::date
         OR s.mg_approval_date IS DISTINCT FROM ad.date_value::date
         OR s.runner_up_medicaid_id IS NOT NULL
       ))
    ORDER BY s.mg_state, s.match_status, s.mg_name;
  $v$;
END
$$;

