/*
 * Purpose:    Document that this migration intentionally attaches NO JSONB shape-validation constraint trigger to any live demos_app.* column.
 * Inputs:     none (documentation only; the registry it references is migration.jsonb_schemas).
 * Outputs:    none -- creates no trigger or function here (no migration ships any JSONB shape-validation trigger; the registry/helpers live in sql/01_ddl_supplements/).
 * Invariants: constraint triggers are attached LAST (this layer runs after the build) so they do not fire during build; DEMOS owns its runtime JSONB columns, so no shape-validation trigger ships on a live demos_app.* column; the three registered schemas (uipath_response, uipath_token_list, application_validation) stay dispositioned exactly as documented below.
 * Refs:       docs/spec/canonical-spec.adoc, reports/narrative/notes.md (D4), sql/01_ddl_supplements/00_jsonb_schema_registry.sql
 *
 * JSONB shape validation -- intentionally NO triggers on demos_app.* columns.
 *
 * Per the JSONB-validator disposition (docs/spec/canonical-spec.adoc, the
 * "Outstanding" section; reports/narrative/notes.md D4), DEMOS performs no in-DB JSONB
 * validation and owns its runtime JSONB columns, so this migration ships no
 * shape-validation CONSTRAINT TRIGGER on any column -- live demos_app.* or
 * migration-private. The three registered schemas in migration.jsonb_schemas
 * are dispositioned as follows:
 *
 *   uipath_response,    -- NOT wired. demos_app.uipath_result.response and
 *   uipath_token_list      demos_app.uipath_value.token_list have no legacy
 *                          PMDA source (UiPath OCR is DEMOS-era; these columns
 *                          are empty at cutover). Nothing to validate here;
 *                          DEMOS owns these columns at runtime. The schema
 *                          files are kept under reports/jsonb_schemas/ as
 *                          reference documentation only.
 *
 *   application_validation -- NOT wired. No producer pipeline and no
 *                          application.validation_data column exist in the
 *                          Prisma contract; the schema is a draft artifact.
 *
 * The registry, trigger function, and revalidate helper still live in
 * sql/01_ddl_supplements/00_jsonb_schema_registry.sql and remain available for
 * any ad-hoc migration.revalidate_jsonb() sweeps; no schema currently wires a
 * CONSTRAINT TRIGGER. (The budget-neutrality parity oracle that formerly wired
 * one on migration.bn_workbook_detail was retired -- DEMOS owns BN ingestion
 * from uploaded workbooks; see reports/narrative/pending_approved_decisions.md.)
 */
