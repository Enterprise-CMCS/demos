/*
 * Purpose:    Define (DDL) the crosswalk table mapping each PMDA pgm_dtl source table to its DEMOS demonstration-type tag_name plus the per-table date columns to read.
 * Inputs:     none (DDL only); rows loaded from reports/pgm_dtl_tag_mapping.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_pgm_dtl_tag
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); the CSV is the single source (no inline copy to drift); rows with a blank tag_name are SME-pending and skipped by the tag-assignment loader.
 * Refs:       reports/pgm_dtl_tag_mapping.csv, sql/21_app_associative/10_demonstration_type_tag_assignment.sql
 *
 * Crosswalk: PMDA mdcd_*_pgm_dtl source table -> DEMOS tag_name (the
 * "tag-pivot fold" mapping), loaded from reports/pgm_dtl_tag_mapping.csv.
 *
 * Each row maps a source pgm_dtl table to its canonical DEMOS demonstration-type
 * tag_name (a demos_app.tag_name.id string), plus the per-table date columns to
 * read for effective_date / expiration_date. Most source tables use the standard
 * from_dt / to_dt columns; a few non-standard tables (e.g.
 * mdcd_emer_wvr_authrty_pgm_dtl) carry prefixed date column names recorded in
 * from_dt_col / to_dt_col. Rows with a blank tag_name are SME-pending and
 * skipped by the tag-assignment loader.
 *
 * Consumed by sql/21_app_associative/10_demonstration_type_tag_assignment.sql,
 * which drives its fold loop from this table instead of a hardcoded VALUES list,
 * so the CSV is the single source (no inline copy to drift).
 *
 * Values loaded from reports/pgm_dtl_tag_mapping.csv by the crosswalks phase.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_pgm_dtl_tag;

CREATE TABLE mysql_raw.crosswalk_pgm_dtl_tag(
  source_table text PRIMARY KEY,
  tag_name text,
  from_dt_col text,
  to_dt_col text,
  additional_attrs text,
  notes text
);

