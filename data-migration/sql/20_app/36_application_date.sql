/*
 * Purpose:    Materialize demos_app.application_date rows for every high-confidence legacy phase-milestone date carried by a loaded demonstration (approved or pending), from the tall stg.application_milestone crosswalk.
 * Inputs:     stg.application_milestone; demos_app.demonstration (JOIN).
 * Outputs:    demos_app.application_date
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until stg.application_milestone exists; only demonstrations actually loaded get rows; a NULL date yields no row (excluded upstream in the view; date_type_id is NOT NULL); idempotent via NOT EXISTS + ON CONFLICT (application_id, date_type_id) DO NOTHING.
 * Refs:       sql/10_stg/25_application_milestone.sql, reports/narrative/milestone_date_mapping.md
 *
 * App load: demos_app.application_date for every mapped legacy milestone date.
 *
 * stg.application_milestone is the §6.1 legacy-date-column -> DEMOS-date_type
 * crosswalk in tall (application_id, date_type_id, date_value) form, restricted
 * to the high-confidence columns and covering approved + pending demonstrations
 * (both draw their phase dates from mdcd_demo_aplctn). Each seeded date_type is
 * linked to a phase by phase_date_type; the 'Application Approval Date' the
 * earlier approval-only loader materialized is now one row among many.
 *
 * application_id = the demonstration UUID (IS-A shared PK with application).
 * created_at / updated_at = the demonstration's own audit timestamps.
 *
 * Only demonstrations actually loaded (present in demos_app.demonstration) get
 * rows -- a held-back demonstration does not. Amendments carry no confidently
 * mappable milestone-date columns, so they get no application_date rows here
 * (their source dates are logged for SME review; see milestone_date_mapping.md).
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (application_id, date_type_id) DO NOTHING.
 * Guarded: a clean no-op before stg.application_milestone exists, mirroring
 * 30_demonstration.sql and 35_amendment.sql.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.application_milestone') IS NULL THEN
    RAISE NOTICE 'skip application_date load: stg.application_milestone not built yet';
    RETURN;
  END IF;
  INSERT INTO demos_app.application_date(application_id, date_type_id, date_value, created_at, updated_at)
  SELECT
    m.application_id,
    m.date_type_id,
    m.date_value,
    d.created_at,
    d.updated_at
  FROM
    stg.application_milestone m
    JOIN demos_app.demonstration d ON d.id = m.application_id
  WHERE
    NOT EXISTS(
      SELECT
        1
      FROM
        demos_app.application_date ex
      WHERE
        ex.application_id = m.application_id
        AND ex.date_type_id = m.date_type_id)
  ON CONFLICT(application_id,
    date_type_id)
    DO NOTHING;
END
$$;
