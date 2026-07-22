/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_demo_stus_cd integer codes to DEMOS application_status ids for demonstration.status_id.
 * Inputs:     none (DDL only); rows COPY'd from reports/crosswalks/demo_status.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_demo_status
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); the CSV is the single source (do not add values here); codes 4-7 store as 'Approved' and rely on the read-time date overlay; completeness is fail-closed in 11_demo_status_check.sql; code 1 -> 'Under Review' per decision D1.
 * Refs:       reports/crosswalks/demo_status.csv, reports/crosswalks/proposed/archive/demo_status.proposed.csv, reports/reference_data/mdcd_demo_stus_rfrnc.csv, reports/narrative/pending_approved_decisions.md (D1)
 *
 * Crosswalk: legacy MySQL mdcd_demo_stus_cd (integer) -> DEMOS
 * demos_app.application_status.id (text), applied to demonstration.status_id.
 *
 * The valid DEMOS targets are the Prisma-seeded application_status rows:
 *   'Pre-Submission', 'Under Review', 'Approved', 'Denied',
 *   'Withdrawn', 'On-hold'.
 *
 * SME review note: this is NOT a full 1:1 translation. DEMOS stores status_id
 * and computes a Pending/Active/Expired/Extended display overlay from the
 * effective/expiration dates (determineDemonstrationTypeStatus.ts). Legacy
 * codes 4/5/6/7 (Extended / Temporarily Extended / Expired / Extension
 * Pending) all store as 'Approved'; the distinction only displays correctly if
 * the underlying effective/expiration dates are migrated. The transform that
 * populates demonstration MUST carry those dates, or the overlay states are
 * lost. 'Withdrawn' is migration-only (DEMOS has no in-app path to it).
 *
 * The legacy integer codes live in the source reference table
 * mdcd_demo_stus_rfrnc (9 codes), now captured in
 * reports/reference_data/mdcd_demo_stus_rfrnc.csv. The 9 codes 1-9 below are
 * promoted from the SME-reviewed proposal (reports/crosswalks/demo_status.csv,
 * transcribed from reports/crosswalks/proposed/archive/demo_status.proposed.csv) at
 * high/medium confidence. Loaded from reports/crosswalks/demo_status.csv by
 * the crosswalks phase (the CSV is the single source; do not add values here).
 *
 * Code 1 ('Pending') was historically WITHHELD as the one genuine judgment
 * call (Pre-Submission vs Under Review). Per decision D1
 * (reports/narrative/pending_approved_decisions.md) the SME mapped it to 'Under Review'
 * (medium confidence, pending secondary confirmation), so a mdcd_demo carrying
 * code 1 now loads as an Under Review demonstration instead of blocking
 * `migrate crosswalks`. The completeness check (11_demo_status_check.sql) still
 * fails closed on ANY status code absent from this crosswalk; it simply no
 * longer trips on code 1. The demonstration loader
 * (sql/20_app/30_demonstration.sql) still skips any row whose status code is
 * genuinely unmapped.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_demo_status;

CREATE TABLE mysql_raw.crosswalk_demo_status(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Codes 1-9 (code 1 'Pending' -> 'Under Review' per D1; see header). Codes 4-7 store as
-- 'Approved'; the Extended/Expired distinction is a read-time date overlay
-- (determineDemonstrationTypeStatus.ts), so the loader carries
-- effective_date/expiration_date for the overlay to compute.
-- Values loaded from reports/crosswalks/demo_status.csv by the crosswalks phase.
