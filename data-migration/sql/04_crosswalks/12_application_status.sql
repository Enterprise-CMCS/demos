/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_demo_aplctn_stus_cd integer codes to DEMOS application_status ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/application_status.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_application_status
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); the CSV is the single source (do not add values here); load-only (not yet consumed by the demonstration loader); completeness is fail-closed in 13_application_status_check.sql.
 * Refs:       reports/crosswalks/application_status.csv, reports/crosswalks/proposed/_review.md (P2 application_status)
 *
 * Crosswalk: legacy MySQL mdcd_demo_aplctn_stus_cd (integer) -> DEMOS
 * demos_app.application_status.id (text).
 *
 * SME-reviewed and approved (reports/crosswalks/proposed/_review.md, P2
 * application_status; Zoe Elkins 2026-06-26). All 11 source codes resolve to a
 * seeded application_status value, no sentinels.
 *
 * NOT YET CONSUMED: today sql/20_app/30_demonstration.sql derives the
 * application.status_id from crosswalk_demo_status (mdcd_demo.mdcd_demo_stus_cd),
 * not from this column. This crosswalk is loaded and validated now (the
 * 13_*_check.sql fails closed on any unmapped mdcd_demo_aplctn_stus_cd) so that
 * re-sourcing application status from mdcd_demo_aplctn becomes a later loader
 * change, not a new crosswalk. Mirrors the load-only status of
 * crosswalk_application_type.
 *
 * Rows mirror reports/crosswalks/application_status.csv, loaded from CSV by the
 * crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_application_status;

CREATE TABLE mysql_raw.crosswalk_application_status(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/application_status.csv by the crosswalks phase.
