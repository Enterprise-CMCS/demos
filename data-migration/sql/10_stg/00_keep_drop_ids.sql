/*
 * Purpose:    Create the shared keep/drop override tables the row-level allowlist filters read.
 * Inputs:     - (DDL bootstrap; no upstream relations read -- CSV data is loaded post-run)
 * Outputs:    CREATE TABLE IF NOT EXISTS stg._keep_ids, stg._drop_ids (then TRUNCATEd)
 * Invariants: source-only override tables; TRUNCATEd on each apply (idempotent); entity = legacy MySQL table name, legacy_id = bigint PK; per-anchor filters read these scoped by entity.
 * Refs:       reports/filter/keep_ids.csv, reports/filter/drop_ids.csv
 *
 * Shared override tables for the row-level allowlist filter.
 *
 * The per-anchor filter files (10_filter_demo.sql, 11_filter_pendg_demo.sql,
 * ...) read these tables scoped by the `entity` column.
 *
 * Data is loaded from the CSVs by migration/phases/build.py after this
 * file has run (psycopg2 COPY); see `load_filter_overrides`.
 *
 * Source CSVs (column order: entity, legacy_id, reason):
 *   reports/filter/keep_ids.csv   -- force-keep (false positives the regexes miss)
 *   reports/filter/drop_ids.csv   -- force-drop (long-tail junk no regex catches)
 *
 * `entity` is the legacy MySQL table name (e.g. 'mdcd_demo', 'mdcd_demo_aplctn').
 * `legacy_id` is the integer PK from that table, kept as bigint so a single
 * column works across every anchor.
 */
SET search_path TO stg, mysql_raw, public;

CREATE TABLE IF NOT EXISTS stg._keep_ids(
  entity text NOT NULL,
  legacy_id bigint NOT NULL,
  reason text,
  PRIMARY KEY (entity, legacy_id)
);

CREATE TABLE IF NOT EXISTS stg._drop_ids(
  entity text NOT NULL,
  legacy_id bigint NOT NULL,
  reason text,
  PRIMARY KEY (entity, legacy_id)
);

TRUNCATE stg._keep_ids;

TRUNCATE stg._drop_ids;

