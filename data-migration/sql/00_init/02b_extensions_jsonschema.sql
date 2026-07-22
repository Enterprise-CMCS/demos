/*
 * Purpose: Install pg_jsonschema, which backs jsonb_matches_schema(); isolated from 02 so a SKIP_JSONSCHEMA build can omit it and install a permissive stub instead; idempotent.
 * Refs:    sql/00_init/02_extensions.sql, sql/01_ddl_supplements/00_jsonb_schema_registry.sql, migration/phases/init_pg.py
 *
 * pg_jsonschema backs jsonb_matches_schema(), called from the JSONB
 * constraint-trigger/registry function in
 * sql/01_ddl_supplements/00_jsonb_schema_registry.sql and the jsonb-shape
 * parity check. It is migration-internal only: no live demos_app.* column
 * uses it. When SKIP_JSONSCHEMA is set, run_init skips this file and installs
 * a permissive jsonb_matches_schema(json, jsonb) stub so the dependent SQL
 * still applies and runs against a stock Postgres.
 *
 * Idempotent: CREATE EXTENSION IF NOT EXISTS is a no-op when the extension is
 * already installed in the current database.
 */
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;

