/*
 * Purpose: Define migration.bn_workbook_detail, the migration-private budget-neutrality aggregate (parity oracle), and its schema-validation constraint trigger; idempotent.
 * Refs:    docs/spec/canonical-spec.adoc (workstream I), reports/narrative/notes.md (D4), reports/jsonb_schemas/budget_neutrality.schema.json
 *
 * migration.bn_workbook_detail: migration-private budget-neutrality aggregate.
 *
 * Holds the detailed BN figures aggregated from the legacy MySQL
 * `bdgt_ntrlty_*` tables (member-months, expenditures, waivers, spending
 * limits, summary), grouped by `bdgt_ntrlty_demo_yr_id` into the nested
 * per-eligibility-group structure described by
 * reports/jsonb_schemas/budget_neutrality.schema.json.
 *
 * WHY THIS IS NOT demos_app.budget_neutrality_workbook.validation_data:
 * the DEMOS BN lambda (lambdas/budgetNeutrality/index.ts) writes that live
 * column as a `ValidationError[]` array and DEMOS performs no in-DB JSONB
 * validation. Migrated workbooks therefore load into
 * demos_app.budget_neutrality_workbook as `validation_status_id = 'Pending'`
 * / `validation_data = '{}'::jsonb` (mirroring
 * functions.sql / move_document_from_pending_to_clean) and DEMOS revalidates
 * them at flip. The rich aggregate lives here instead, where it serves as a
 * parity oracle: DEMOS's post-flip recompute is checked against it.
 * See docs/spec/canonical-spec.adoc workstream I and reports/narrative/notes.md D4.
 *
 * workbook_id matches demos_app.budget_neutrality_workbook.id (= the BN
 * document uuid). No FK to demos_app on purpose: demos_app.* is
 * rebuilt/truncated during the build phases and this table must survive
 * independently (same rationale as migration.state_region).
 *
 * The W5 BN workstream (sql/10_stg/60_budget_neutrality.sql) populates this
 * table and may extend it with additional columns; the constraint trigger
 * below only depends on `validation_data`.
 */
SET search_path TO migration, public;

CREATE TABLE IF NOT EXISTS migration.bn_workbook_detail(
  workbook_id uuid PRIMARY KEY,
  validation_data jsonb NOT NULL,
  _created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE migration.bn_workbook_detail IS 'Migration-private budget-neutrality aggregate (parity oracle). Validated
   against the registered "budget_neutrality" JSON schema; NOT the live
   demos_app.budget_neutrality_workbook.validation_data column, which DEMOS
   owns and writes as a ValidationError[] array.';

-- Parity trigger: validate the aggregate against the registered
-- "budget_neutrality" schema as it is loaded. Lives here (applied in the ddl
-- phase) rather than in sql/31_constraint_triggers/ (constraints phase) so it
-- is active when the W5 stg loader inserts into this table. Fails closed for
-- non-NULL JSONB until the schema is registered (migrate seeds).
DROP TRIGGER IF EXISTS bn_workbook_detail_validation_data_schema ON migration.bn_workbook_detail;

CREATE CONSTRAINT TRIGGER bn_workbook_detail_validation_data_schema
  AFTER INSERT OR UPDATE OF validation_data ON migration.bn_workbook_detail DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW
  EXECUTE FUNCTION migration.tg_validate_jsonb_against_registered_schema('budget_neutrality', 'validation_data');

