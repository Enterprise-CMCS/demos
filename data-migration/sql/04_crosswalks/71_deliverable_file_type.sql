/*
 * Purpose:    Define (DDL) the crosswalk table mapping legacy mdcd_dlvrbl_fil_doc.fil_doc_cd integer codes (DELIVERABLE-file type subset) to DEMOS document_type ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/deliverable_file_type.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_deliverable_file_type
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); DELIVERABLE-file family only (application/site-visit/reference families tracked separately); load-only (no document loader yet); the CSV is the single source (do not add values here); 72_deliverable_file_type_check.sql fails closed on any unmapped populated fil_doc_cd; demos_text_id nullable (excluded codes carry no target).
 * Refs:       reports/crosswalks/deliverable_file_type.csv, docs/specs/document-migration.md (D2, D3, D6)
 *
 * Crosswalk: legacy MySQL mdcd_dlvrbl_fil_doc.fil_doc_cd (integer) -> DEMOS
 * demos_app.document_type.id (text), DELIVERABLE-file type subset only.
 *
 * fil_doc_cd mirrors the boolean type flags 1:1 (docs/specs/document-migration.md
 * D6, reverse-engineered from the source DB):
 *   1       -> Budget Neutrality (bdgt_ntrlty_fil_ind); OUT OF SCOPE per D3,
 *              excluded from the loader (NULL demos_text_id, in_scope=false).
 *   2, 3    -> Monitoring Report (mntrg_rpt_fil_ind); collapse to one DEMOS type.
 *   7, 9    -> Monitoring Protocol (mntrg_prtcl_fil_ind); collapse to one DEMOS type.
 *
 * NULL fil_doc_cd (85% of live files, and every CMS-attached file) is the D2
 * "General File" default; it is not a source code and so carries no crosswalk
 * row -- the loader applies General File when fil_doc_cd is NULL and no type
 * flag is set. General File is legal for every deliverable type in the DEMOS
 * seed (deliverable_type_document_type), so the default is always a legal pair.
 *
 * The collapse targets are legal for their monitoring deliverable types in the
 * DEMOS seed: ('Monitoring Report','Monitoring Report') and
 * ('Monitoring Protocol','Monitoring Protocol') both exist in
 * deliverable_type_document_type (see reports/prisma/seeded/). Composite-FK
 * legality per row is enforced at load time against the deliverable's own type;
 * where a typed file sits on a non-monitoring deliverable the loader falls back
 * to General File (universally legal).
 *
 * NOT YET CONSUMED: there is no demos_app.document loader yet (metadata-only
 * loader deferred, blocked on the s3_path strategy). This crosswalk is loaded
 * and validated now so the deliverable-file family is ready when that loader
 * lands.
 *
 * Rows mirror reports/crosswalks/deliverable_file_type.csv, loaded from CSV by
 * the crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_deliverable_file_type;

CREATE TABLE mysql_raw.crosswalk_deliverable_file_type(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text,
  in_scope boolean NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/deliverable_file_type.csv by the crosswalks phase.
