/*
 * Purpose:    Define (DDL) the data-backed identity-map crosswalk table from legacy mdcd_chip_div_cd to DEMOS sdg_division ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/sdg_division.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_sdg_division
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); identity map for the two real divisions (codes 2, 3); sentinel code 0 maps to NULL (sdg_division_id is nullable); the CSV is the single source (do not add values here); completeness is fail-closed in 63_sdg_division_check.sql.
 * Refs:       reports/crosswalks/sdg_division.csv
 *
 * Crosswalk: legacy MySQL mdcd_chip_div_cd (integer) -> DEMOS
 * demos_app.sdg_division.id (text), applied to demonstration.sdg_division_id
 * (nullable on the target; also present on the pending/history variants).
 *
 * This is a DATA-BACKED identity map, not an SME judgment call: the source
 * lookup mdcd_chip_div_rfrnc.mdcd_chip_div_name IS the
 * demos_app.sdg_division.id value verbatim for the two real divisions --
 *   2 -> 'Division of System Reform Demonstrations'
 *   3 -> 'Division of Eligibility and Coverage Demonstrations'
 * and the DEMOS seed (state/prisma_ddl) contains exactly those two ids.
 * Code 0 ('-- Please Select --') is a legacy UI sentinel, not a division; it
 * maps to NULL (sdg_division_id is nullable). mdcd_chip_div_cd is NOT NULL in
 * the source (default 0), so unset rows arrive as 0 and resolve to NULL.
 * Code 1 is a retired/undefined division with no mdcd_chip_div_rfrnc entry; it
 * survives only on 24 soft-deleted demonstrations (2016-2018, never loaded by
 * 22_demonstration_resolved) and likewise maps to NULL. It is carried here so
 * 63_sdg_division_check.sql -- which scans the raw source, deleted rows
 * included -- stays complete. (The audit surfaces it as a benign orphan: a
 * crosswalk code with no reference-table definition.)
 *
 * Rows mirror reports/crosswalks/sdg_division.csv, loaded from CSV by
 * the crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_sdg_division;

CREATE TABLE mysql_raw.crosswalk_sdg_division(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text, -- nullable: sentinel 0 maps to NULL
  notes text
);

-- Values loaded from reports/crosswalks/sdg_division.csv by the crosswalks phase.
