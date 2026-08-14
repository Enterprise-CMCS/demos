/*
 * Purpose:    Define (DDL) the data-backed identity-map crosswalk table from legacy mdcd_demo_aplctn_type_cd to DEMOS application_type ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/application_type.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_application_type
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); identity map (1 -> Demonstration, 2 -> Amendment, 3 -> Extension); the CSV is the single source (do not add values here); completeness is fail-closed in 61_application_type_check.sql.
 * Refs:       reports/crosswalks/application_type.csv
 *
 * Crosswalk: legacy MySQL mdcd_demo_aplctn_type_cd (integer) -> DEMOS
 * demos_app.application_type.id (text), applied to
 * application/amendment/demonstration/extension.application_type_id
 * (all NOT NULL on the target).
 *
 * This is a DATA-BACKED identity map, not an SME judgment call: the source
 * lookup mdcd_demo_aplctn_type_rfrnc.mdcd_demo_aplctn_type_name IS the
 * demos_app.application_type.id value verbatim for all three codes --
 *   1 -> 'Demonstration', 2 -> 'Amendment', 3 -> 'Extension'
 * and the DEMOS seed (state/prisma_ddl) contains exactly those three ids.
 * So, like 20_state.sql, it is loaded here rather than left as a TODO; the
 * 61_*_check.sql fails closed if the source ever carries an unmapped code.
 *
 * Rows mirror reports/crosswalks/application_type.csv, loaded from CSV by
 * the crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_application_type;

CREATE TABLE mysql_raw.crosswalk_application_type(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/application_type.csv by the crosswalks phase.
