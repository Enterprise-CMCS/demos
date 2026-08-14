/*
 * Purpose: Install the always-required Postgres extensions (pgcrypto, uuid-ossp); idempotent. pg_jsonschema is installed separately in 02b so it can be skipped on a stock cluster.
 * Refs:    sql/00_init/02b_extensions_jsonschema.sql, sql/01_ddl/00_jsonb_schema_registry.sql
 *
 * Postgres extensions required by the DEMOS schema and migration tooling.
 *
 *   pgcrypto       -- gen_random_uuid() used as the default for every
 *                     `history_id uuid PRIMARY KEY` in the sql/01_ddl files.
 *   uuid-ossp      -- legacy UUID generators kept available for any
 *                     sql/05_id_maps or seed code that hasn't migrated
 *                     to gen_random_uuid() yet.
 *
 * pg_jsonschema is intentionally NOT installed here; it lives in
 * 02b_extensions_jsonschema.sql so a SKIP_JSONSCHEMA build (stock Postgres
 * without the extension) can omit it and install a permissive stub instead.
 *
 * Idempotent: CREATE EXTENSION IF NOT EXISTS is a no-op when the
 * extension is already installed in the current database.
 */
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

