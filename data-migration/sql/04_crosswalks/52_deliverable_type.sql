/*
 * Purpose:    Define (DDL) the single-input crosswalk table from legacy mdcd_dlvrbl.mdcd_dlvrbl_type_cd to DEMOS deliverable_type ids.
 * Inputs:     none (DDL only); rows mirror reports/crosswalks/deliverable_type.csv, loaded from CSV by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_deliverable_type
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); single-input code map (mdcd_dlvrbl_type_cd -> demos_text_id); the CSV is the single source (do not add values here); completeness is fail-closed in 53_deliverable_type_check.sql.
 * Refs:       reports/crosswalks/deliverable_type.csv, reports/crosswalks/proposed/deliverable_type_bn_routing.md, sql/20_app/40_deliverable.sql, sql/10_stg/28_deliverable_resolved.sql
 *
 * Crosswalk: legacy MySQL mdcd_dlvrbl.mdcd_dlvrbl_type_cd (integer) -> DEMOS
 * demos_app.deliverable_type.id (text), applied to
 * demos_app.deliverable.deliverable_type_id (NOT NULL on the target).
 *
 * SINGLE-INPUT (not the two-input BN matrix the earlier investigation
 * proposed). Live source verification proved mdcd_dlvrbl.mdcd_dlvrbl_type_cd
 * carries the RICH report-occurrence vocabulary (mdcd_dlvrbl_rpt_ocrnc_rfrnc:
 * 40/40 codes used on in-scope deliverables resolve; 0/40 against the coarse
 * 8-code mdcd_dlvrbl_type_rfrnc). The crosswalk covers all 41 raw codes (the
 * extra code 6 Semi-Annually appears only on soft-deleted deliverables) so the
 * fail-closed raw-source completeness check passes.
 * The code therefore directly encodes the deliverable content type -- 57 =
 * Quarterly Budget Neutrality Report, 70 = Annual Budget Neutrality Report,
 * 53/55 = Monitoring, 83 = Demonstration Specific, 84 = Evaluation Design, HCBS
 * 76-79/87/88, etc. -- so no second BN signal is needed for routing. The map
 * reaches all 17 DEMOS deliverable_type seed values. The bdgt_ntrlty_ind /
 * file-ind / name signals are retained only as a non-gating QA parity check
 * (sql/99_parity/43_deliverable_bn_qa.sql), not as routing inputs. See the
 * correction section in reports/crosswalks/proposed/deliverable_type_bn_routing.md.
 *
 * The loader (sql/20_app/40_deliverable.sql) joins this table on
 * xtype.legacy_int_cd = r.deliverable_type_cd (= mdcd_dlvrbl_type_cd) and
 * selects xtype.demos_text_id -- the join already exists; authoring this table
 * activates the (until now no-op) deliverable load.
 *
 * Best-fit is used for the handful of rpt_ocrnc codes with no direct DEMOS
 * deliverable_type (0 Single/Other, 59 Non-standard, 86 Attestation ->
 * Demonstration-Specific Deliverable; 73 Retrospective, 79 Payment Ratio ->
 * Monitoring Report; 69 Phase Down -> Transition Plan; 51 Final Evaluation ->
 * Evaluation Design), so every migratable deliverable loads; the fail-closed
 * completeness check catches any future unmapped code.
 *
 * Rows mirror reports/crosswalks/deliverable_type.csv, loaded from CSV by the
 * crosswalks phase. The CSV is the single source; do not add values here.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_deliverable_type;

CREATE TABLE mysql_raw.crosswalk_deliverable_type(
  legacy_int_cd integer PRIMARY KEY,
  legacy_name text,
  demos_text_id text NOT NULL,
  notes text
);

-- Values loaded from reports/crosswalks/deliverable_type.csv by the crosswalks phase.
