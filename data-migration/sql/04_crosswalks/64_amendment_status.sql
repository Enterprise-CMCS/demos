/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_demo_amndmt_stus_cd integer codes to DEMOS application_status ids for amendment.status_id.
 * Inputs:     none (DDL only); values live in reports/crosswalks/amendment_status.csv, COPY'd via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_amendment_status
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); four SME-ratified mappings (2026-07-10); the CSV is the single source; 65_amendment_status_check.sql fails closed on any future unmapped source code.
 * Refs:       reports/crosswalks/amendment_status.csv, reports/crosswalks/registry.yaml, reports/crosswalks/proposed/_review.md (P2 amendment_status), reports/narrative/notes.md, sql/20_app/35_amendment.sql
 *
 * Crosswalk: legacy MySQL mdcd_demo_amndmt_stus_cd (integer) -> DEMOS
 * demos_app.application_status.id (text), applied to amendment.status_id.
 *
 * POPULATED (2026-06-26), SME-RATIFIED (2026-07-10): the four proposed values
 * were accepted in-session and formally ratified by the SME on 2026-07-10.
 * Values live in reports/crosswalks/amendment_status.csv (load-ready), COPY'd
 * via reports/crosswalks/registry.yaml; this file is DDL only. The amendment
 * loader (sql/20_app/35_amendment.sql) consumes the loaded table. Each maps
 * onto a DDL-confirmed demos_app.application_status seed id:
 *   1 Pending     -> 'Under Review' (SME-ratified 2026-07-10 over Pre-Submission)
 *   2 Approved    -> 'Approved'     (identity)
 *   3 Withdrawn   -> 'Withdrawn'    (identity)
 *   4 Disapproved -> 'Denied'       (semantic approximation, SME-ratified)
 * 65_*_check.sql still fails closed on any FUTURE unmapped source code, so a
 * delta-introduced amendment status (or a 5th code) is caught at cutover.
 * SME sign-off recorded in reports/crosswalks/proposed/_review.md (P2) and
 * reports/narrative/notes.md.
 *
 * Companion amendment-loader derivations (sql/20_app/35_amendment.sql):
 *   - current_phase_id (NOT NULL, no source column): status-derived --
 *     Approved->'Approval Summary', Under Review->'Review',
 *     Withdrawn/Denied->'Concept' (parity-logged, SME-ratify).
 *   - signature_level_id: amendment_signature_level_check + the DEMOS constant
 *     AMENDMENT_SIGNATURE_LEVELS=['OA','OCD'] intentionally bar OGD on
 *     amendments, so map OA->'OA', OCD->'OCD', else NULL (OGD/DD parity-logged;
 *     OGD remains a valid demonstration signature + Review-phase date type).
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_amendment_status;

CREATE TABLE mysql_raw.crosswalk_amendment_status(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

