/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_demo_aplctn_sgntr_lvl_cd integer codes to DEMOS signature_level ids.
 * Inputs:     none (DDL only); values live in reports/crosswalks/signature_level.csv, COPY'd via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_signature_level
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); PRESERVE OGD (no collapse to NULL/OA); sentinel code 0 and code 4 (DD) carry a NULL demos_text_id; code 0 is null_ok=true (SME: approved code-0 demos are an accepted case, coerced to 'OA' by the loader) so 31_signature_level_check.sql exempts it; code 4 stays null_ok=false (fail-closed for any LIVE approved demonstration).
 * Refs:       reports/crosswalks/signature_level.csv, reports/crosswalks/registry.yaml, reports/crosswalks/proposed/_review.md, migration 20260602115947_check_signature_level
 *
 * Crosswalk: legacy MySQL mdcd_demo_aplctn_sgntr_lvl_cd (integer) -> DEMOS
 * demos_app.signature_level.id (text), applied to
 * demonstration/amendment/extension.signature_level_id.
 *
 * SME review decision: PRESERVE OGD. The earlier proposal collapsed OGD/DD to
 * NULL (and forced demonstrations to 'OA'); per review that is data loss. The
 * signature_level seed already contains 'OA','OCD','OGD'. The only obstacle to
 * loading OGD-level rows is the CHECK constraints added by migration
 * 20260602115947_check_signature_level:
 *   demonstration_signature_level_check : signature_level_id = 'OA'
 *   amendment_signature_level_check     : signature_level_id IN ('OA','OCD') OR NULL
 *   extension_signature_level_check     : signature_level_id IN ('OA','OCD') OR NULL
 * Migrating OGD (or DD) demonstrations requires the DEMOS team to widen those
 * CHECKs -- a target-schema task tracked in _review.md, NOT a crosswalk change.
 *
 * Also note: the DEMOS demonstration_signature_level_check CHECK constraint
 * (migration 20260602115947) forbids a NULL signature on a demonstration and
 * forces 'OA' -- so NULL is never actually written for a demonstration; the app
 * loader coerces every demonstration to 'OA'. The 31_*_check.sql below flags
 * approved source demonstrations whose signature is unmapped/ambiguous (a data-
 * fidelity signal), scoped by the null_ok flag below.
 *
 * null_ok marks a NULL demos_text_id as an SME-accepted outcome for an approved
 * demonstration (not a RED): code 0 (the '-- Please Select --' sentinel) is
 * null_ok=true per SME decision; code 4 (DD, deleted in source) stays
 * null_ok=false so a LIVE approved code-4 demonstration still fails closed.
 *
 * Values live in reports/crosswalks/signature_level.csv (load-ready), COPY'd
 * via reports/crosswalks/registry.yaml. This file is DDL only.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_signature_level;

CREATE TABLE mysql_raw.crosswalk_signature_level(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text,
  null_ok boolean NOT NULL DEFAULT FALSE,
  notes text
);

