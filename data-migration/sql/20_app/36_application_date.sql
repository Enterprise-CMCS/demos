/*
 * Purpose:    Materialize one demos_app.application_date row ('Application Approval Date') per loaded demonstration that carries a source approval date.
 * Inputs:     stg.demonstration_resolved; demos_app.demonstration (JOIN).
 * Outputs:    demos_app.application_date
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until stg.demonstration_resolved exists; only demonstrations actually loaded get a row; a NULL approval_date yields no row (date_type_id is NOT NULL); idempotent via NOT EXISTS + ON CONFLICT (application_id, date_type_id) DO NOTHING.
 * Refs:       -
 *
 * App load: demos_app.application_date for the demonstration's approval date.
 *
 * The DEMOS migration 20260617124348_add_application_approval_date seeds the
 * date_type 'Application Approval Date' and links it to the 'Approval Summary'
 * phase via phase_date_type. This loader materializes one application_date row
 * per loaded demonstration whose source approval date (mdcd_demo.aprvl_dt,
 * projected as stg.demonstration_resolved.approval_date) is present.
 *
 * application_id = the demonstration UUID (IS-A shared PK with application).
 * date_type_id  = 'Application Approval Date' (seeded by the DEMOS migration).
 * date_value    = approval_date (a MySQL date -> timestamptz at UTC midnight).
 * created_at    = the demonstration's created_at (creatd_dt).
 * updated_at    = the demonstration's updated_at (COALESCE updtd_dt, creatd_dt).
 *
 * Only demonstrations that were actually loaded (present in demos_app.demonstration)
 * get an application_date row -- a held-back demonstration does not. A
 * demonstration with no aprvl_dt (e.g., not yet approved) gets no row; the
 * date_type is NOT NULL, so a NULL date_value would be rejected anyway.
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (application_id, date_type_id) DO NOTHING.
 * Guarded: a clean no-op before stg.demonstration_resolved exists, mirroring
 * 30_demonstration.sql and 35_amendment.sql.
 */
SET search_path TO demos_app, stg, migration, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'skip application_date load: stg.demonstration_resolved not built yet';
    RETURN;
  END IF;
  INSERT INTO demos_app.application_date(application_id, date_type_id, date_value, created_at, updated_at)
  SELECT
    r.new_uuid,
    'Application Approval Date',
    r.approval_date,
    r.created_at,
    r.updated_at
  FROM
    stg.demonstration_resolved r
    JOIN demos_app.demonstration d ON d.id = r.new_uuid
  WHERE
    r.approval_date IS NOT NULL
    AND NOT EXISTS(
      SELECT
        1
      FROM
        demos_app.application_date ex
      WHERE
        ex.application_id = r.new_uuid
        AND ex.date_type_id = 'Application Approval Date')
  ON CONFLICT(application_id,
    date_type_id)
    DO NOTHING;
END
$$;

