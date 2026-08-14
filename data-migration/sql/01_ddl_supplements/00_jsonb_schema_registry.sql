/*
 * Purpose: Define the migration.jsonb_schemas registry table and the constraint-trigger and revalidation functions that validate demos_app JSONB columns against registered schemas; idempotent.
 * Refs:    reports/jsonb_schemas/ (the schema JSON files), sql/31_constraint_triggers/00_jsonb_validation.sql, runbooks/revalidate-jsonb.md
 */
CREATE TABLE IF NOT EXISTS migration.jsonb_schemas(
  name text PRIMARY KEY,
  schema jsonb NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE migration.jsonb_schemas IS 'Canonical JSON schemas used to validate JSONB columns in demos_app.* tables.
   Populated from reports/jsonb_schemas/*.json.';

-- Retired: migration.jsonb_matches_registered_schema(text, jsonb) STABLE wrapper
-- used to live here and was called from app.* CHECK constraints. CHECK is meant
-- to evaluate only the current row; hiding a registry lookup behind a STABLE
-- function violated that contract and was fragile across pg_dump/restore and
-- registry edits. Validation now happens via a CONSTRAINT TRIGGER (see
-- sql/31_constraint_triggers/00_jsonb_validation.sql), backed by the function
-- defined below.
DROP FUNCTION IF EXISTS migration.jsonb_matches_registered_schema(text, jsonb);

CREATE OR REPLACE FUNCTION migration.tg_validate_jsonb_against_registered_schema()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_schema_name text := TG_ARGV[0];
  v_col_name text := TG_ARGV[1];
  v_schema jsonb;
  v_instance jsonb;
BEGIN
  EXECUTE format('SELECT ($1).%I', v_col_name) INTO v_instance
  USING NEW;
  IF v_instance IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT
    SCHEMA INTO v_schema
  FROM
    migration.jsonb_schemas
  WHERE
    name = v_schema_name;
  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'JSONB schema % is not registered (table %.%, column %)', v_schema_name, TG_TABLE_SCHEMA, TG_TABLE_NAME, v_col_name
      USING ERRCODE = 'check_violation';
    END IF;
    IF NOT jsonb_matches_schema(v_schema::json, v_instance) THEN
      RAISE EXCEPTION 'JSONB column %.%.% failed validation against schema %', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_col_name, v_schema_name
        USING ERRCODE = 'check_violation';
      END IF;
      RETURN NULL;
END
$$;

COMMENT ON FUNCTION migration.tg_validate_jsonb_against_registered_schema() IS 'Constraint-trigger body called by CONSTRAINT TRIGGERs in
   sql/31_constraint_triggers/00_jsonb_validation.sql. Reads the registry,
   resolves the row''s JSONB column by name (TG_ARGV[1]), and raises
   check_violation if the value fails its registered schema (TG_ARGV[0]).
   Fails closed if the schema is not registered.';

CREATE OR REPLACE FUNCTION migration.revalidate_jsonb(p_table regclass, p_col text, p_schema text)
  RETURNS bigint
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_schema jsonb;
  v_count bigint;
BEGIN
  SELECT
    SCHEMA INTO v_schema
  FROM
    migration.jsonb_schemas
  WHERE
    name = p_schema;
  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'JSONB schema % is not registered', p_schema
      USING ERRCODE = 'check_violation';
    END IF;
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IS NOT NULL AND NOT jsonb_matches_schema($1::json, %I)', p_table, p_col, p_col) INTO v_count
    USING v_schema;
    RETURN v_count;
END
$$;

COMMENT ON FUNCTION migration.revalidate_jsonb(regclass, text, text) IS 'One-shot re-validation helper. Returns the number of rows in p_table whose
   p_col fails p_schema. Call after promoting or revising a JSONB schema
   in migration.jsonb_schemas; see runbooks/revalidate-jsonb.md.';

