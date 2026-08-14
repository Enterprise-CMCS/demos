/*
 * Purpose:    Define (DDL) the identity-map crosswalk table from legacy geo_ansi_state_cd to DEMOS demos_app.state.id.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/state.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_state
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); identity 2-letter ANSI/USPS map; the CSV is the single source (edit the CSV, not here); completeness is fail-closed in 21_state_check.sql.
 * Refs:       reports/crosswalks/state.csv
 *
 * Crosswalk: legacy MySQL geo_ansi_state_cd -> DEMOS demos_app.state.id.
 *
 * Both sides are the 2-letter ANSI / USPS code, so this is an identity
 * map; it exists so the stage transforms can JOIN through a single
 * crosswalk contract and so junk / retired codes in the source surface
 * as a completeness-check failure rather than an orphaned FK later.
 *
 * Rows mirror reports/crosswalks/state.csv (the SME-reviewed artifact),
 * loaded from CSV by the crosswalks phase. The CSV is the single source;
 * do not add values here -- edit the CSV instead.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_state;

CREATE TABLE mysql_raw.crosswalk_state(
  legacy_cd text PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/state.csv by the crosswalks phase.
