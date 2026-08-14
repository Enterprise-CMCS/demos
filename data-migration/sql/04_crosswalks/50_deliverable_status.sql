/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_dlvrbl_crnt_stus_cd integer codes to a DEMOS deliverable TUPLE (status_id, due_date_type_id, expected_to_be_submitted, emit_extension_status).
 * Inputs:     none (DDL only); values live in reports/crosswalks/deliverable_status.csv, COPY'd via reports/crosswalks/registry.yaml.
 * Outputs:    mysql_raw.crosswalk_deliverable_status
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); one legacy code maps to a tuple across three deliverable columns (+ an optional deliverable_extension); code 0 (N/A) carries a NULL status_id flagged null_ok=true (SME: held back from the load + logged, exempt from the completeness check); code 7 (Overridden) maps to 'Under CMS Review' per SME (submitted BN reports, received + Ready for CMS Review, not yet reviewed/accepted; data profile identical to code 14); due_date_type_id is NOT NULL DEFAULT 'Normal'; 51_deliverable_status_check.sql fails closed on any used code with neither a confirmed status_id nor null_ok.
 * Refs:       reports/crosswalks/deliverable_status.csv, reports/crosswalks/registry.yaml
 *
 * Crosswalk: legacy MySQL mdcd_dlvrbl_crnt_stus_cd (integer) -> DEMOS
 * deliverable state. Per SME review, this is NOT a status->status map: PMDA
 * encoded due-date and obligation semantics into the single status code, and
 * DEMOS now spreads that across THREE columns on demos_app.deliverable:
 *   status_id                FK demos_app.deliverable_status
 *   due_date_type_id         FK demos_app.deliverable_due_date_type {Normal, Open Ended}
 *   expected_to_be_submitted boolean
 * plus, for "Pending Due Date Change", a separate deliverable_extension row
 * (emit_extension_status -> demos_app.deliverable_extension_status).
 *
 * So one legacy code maps to a TUPLE. Values live in
 * reports/crosswalks/deliverable_status.csv (load-ready), COPY'd via
 * reports/crosswalks/registry.yaml; this file is DDL only. The stage transform
 * reads this contract to populate the three columns and (when
 * emit_extension_status IS NOT NULL) a deliverable_extension.
 *
 * null_ok marks a NULL status_id as an SME-accepted outcome (not a RED),
 * mirroring the signature_level crosswalk. Code 0 (N/A) is null_ok=true: the 2
 * placeholder rows carrying it are held back from the load by the loader's
 * `cw.status_id IS NOT NULL` guard and logged in migration._parity_deliverable_held,
 * and 51_deliverable_status_check.sql exempts them. Code 7 (Overridden) is now
 * mapped to 'Under CMS Review' (SME decision; see the header). The check below
 * fails closed on any legacy code the source actually uses that has neither a
 * confirmed status_id nor null_ok. due_date_type_id is NOT NULL DEFAULT 'Normal'.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_deliverable_status;

CREATE TABLE mysql_raw.crosswalk_deliverable_status(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  status_id text,
  due_date_type_id text NOT NULL DEFAULT 'Normal',
  expected_to_be_submitted boolean,
  emit_extension_status text,
  null_ok boolean NOT NULL DEFAULT FALSE,
  notes text
);

