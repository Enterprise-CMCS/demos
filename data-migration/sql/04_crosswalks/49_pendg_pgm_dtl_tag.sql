/*
 * Purpose:    Define (DDL) the crosswalk table mapping each PMDA mdcd_pendg_*_pgm_dtl source table to its DEMOS demonstration-type tag_name plus the per-table date columns to read.
 * Inputs:     none (DDL only); rows loaded from reports/pgm_dtl_tag_mapping_pending.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_pendg_pgm_dtl_tag
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); the CSV is the single source (no inline copy to drift); ships INERT -- the template CSV is header-only until the SME adds the pending mapping, so 0 rows load and the tag-assignment loader is a clean no-op; rows with a blank tag_name are SME-pending and skipped by the loader.
 * Refs:       reports/pgm_dtl_tag_mapping_pending.csv, sql/21_app_associative/12_pending_demonstration_type_tag_assignment.sql, sql/04_crosswalks/48_pgm_dtl_tag.sql
 *
 * Crosswalk: PMDA mdcd_pendg_*_pgm_dtl source table -> DEMOS tag_name, the
 * pending-track counterpart of mysql_raw.crosswalk_pgm_dtl_tag (04/48). Loaded
 * from reports/pgm_dtl_tag_mapping_pending.csv.
 *
 * The pending program-detail tables (mdcd_pendg_<type>_pgm_dtl) key on
 * mdcd_pendg_demo_id, not mdcd_demo_id, so they cannot share the approved
 * crosswalk (which is driven by the approved source-table names and joined on
 * mdcd_demo_id). Each row maps a pending source table to its canonical DEMOS
 * demonstration-type tag_name plus the per-table date columns to read; the
 * pending tag-assignment loader (21_app_associative/12) resolves the parent
 * demonstration fold-aware via stg._pendg_demo_fold (a folded pending demo's
 * tags attach to its approved counterpart; an orphan pending demo's tags attach
 * to its own 'Under Review' demonstration).
 *
 * Ships INERT: reports/pgm_dtl_tag_mapping_pending.csv is header-only until the
 * SME adds the pending mapping, so the crosswalks phase loads 0 rows and the
 * loader iterates nothing. Rows with a blank tag_name are SME-pending and
 * skipped by the loader, mirroring 04/48.
 *
 * Values loaded from reports/pgm_dtl_tag_mapping_pending.csv by the crosswalks phase.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_pendg_pgm_dtl_tag;

CREATE TABLE mysql_raw.crosswalk_pendg_pgm_dtl_tag(
  source_table text PRIMARY KEY,
  tag_name text,
  from_dt_col text,
  to_dt_col text,
  additional_attrs text,
  notes text
);

