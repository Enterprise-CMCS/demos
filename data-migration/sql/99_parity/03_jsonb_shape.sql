/*
 * Purpose:    Asserts the only JSONB shape that matters for migration parity: the BN parity oracle's validation_data conforms to the registered "budget_neutrality" schema.
 * Inputs:     migration.bn_workbook_detail (validation_data); migration.revalidate_jsonb(regclass, text, text)
 * Outputs:    migration._parity_jsonb_shape
 * Invariants: Non-empty -> RED at Gate 6; vacuously GREEN when the oracle table is empty; migration.revalidate_jsonb fails closed (raises) when the schema is not registered; plain view (no conditional-DDL guard), idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "jsonb_shape" CheckResult; sql/31_constraint_triggers/00_jsonb_validation.sql
 *
 * Parity check 3: JSONB shape conformance.
 *
 * DEMOS performs NO in-DB JSONB validation on live demos_app.* columns and
 * owns them at runtime (see sql/31_constraint_triggers/00_jsonb_validation.sql):
 * uipath_response / uipath_token_list / application_validation are unwired and
 * empty at cutover. The only JSONB shape that matters for *migration* parity is
 * the migration-private budget-neutrality parity oracle,
 * migration.bn_workbook_detail.validation_data, which must conform to the
 * registered "budget_neutrality" schema before DEMOS revalidates it at flip.
 *
 * Consumed by migration/phases/parity.py as the "jsonb_shape" CheckResult.
 * Non-empty -> RED. Vacuously GREEN when the oracle table is empty (the W5 BN
 * loader has not run yet). migration.revalidate_jsonb fails closed (raises) if
 * the schema is not registered, so a missing seed surfaces loudly rather than
 * passing silently.
 */
SET search_path TO migration, public;

CREATE OR REPLACE VIEW migration._parity_jsonb_shape AS
SELECT
  object,
  schema_name,
  failing_rows
FROM (
  SELECT
    'migration.bn_workbook_detail.validation_data'::text AS object,
    'budget_neutrality'::text AS schema_name,
    migration.revalidate_jsonb('migration.bn_workbook_detail'::regclass, 'validation_data', 'budget_neutrality') AS failing_rows) s
WHERE
  failing_rows > 0;

