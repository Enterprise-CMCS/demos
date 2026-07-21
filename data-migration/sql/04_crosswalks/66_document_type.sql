/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_demo_aplctn_doc_type_cd integer codes (APPLICATION doc-type subset) to DEMOS document_type ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/document_type.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_document_type
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); APPLICATION doc-type family only (other families tracked separately); load-only (no document loader yet); the CSV is the single source (do not add values here); 67_document_type_check.sql fails closed on any unmapped application doc-type code.
 * Refs:       reports/crosswalks/document_type.csv, reports/crosswalks/proposed/_review.md (P4 document_type)
 *
 * Crosswalk: legacy MySQL mdcd_demo_aplctn_doc_type_cd (integer) -> DEMOS
 * demos_app.document_type.id (text), APPLICATION doc-type subset only.
 *
 * SME-reviewed and approved for the application subset
 * (reports/crosswalks/proposed/_review.md, P4 document_type; Zoe Elkins
 * 2026-06-26): 8/10 codes are verbatim identity with the document_type seed;
 * codes 6 (Temporary Extension Letter) and 99 (Other) fold to 'General File',
 * code 7 (Final BN Worksheet) to 'BN Workbook'.
 *
 * SCOPE: document_type in DEMOS is the union of several legacy doc-type
 * families (site-visit, template, reference-material). This crosswalk maps the
 * APPLICATION family only (mdcd_demo_aplctn_doc); the other families are a
 * separate reconciliation tracked in _review.md and are NOT mapped here.
 *
 * NOT YET CONSUMED: there is no demos_app.document loader yet (the
 * document/uploaded-files workstream is deferred and blocked on the
 * multi-source fan-in). This crosswalk is loaded and validated now so the
 * application subset is ready when that loader lands.
 *
 * Rows mirror reports/crosswalks/document_type.csv, loaded from CSV by the
 * crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_document_type;

CREATE TABLE mysql_raw.crosswalk_document_type(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/document_type.csv by the crosswalks phase.
