/*
 * Purpose: Curated mysql_raw seed fixture for the demonstration migration-flow trace, with one row per disposition the mdcd_demo -> demos_app.demonstration path can take.
 * Refs:    docs/tools/table_flow_trace.py, tests/sql/_skeleton.py
 *
 * Curated source fixture for the demonstration migration-flow trace.
 *
 * Seeds the demonstration anchor (mysql_raw.mdcd_demo) and its original
 * application rows (mysql_raw.mdcd_demo_aplctn) with one row per branch the
 * mdcd_demo -> demos_app.demonstration path can take, so the generated run
 * trace (docs/tools/table_flow_trace.py) exercises every disposition:
 *
 *   id 1  LOADED  Approved, chip preserved, Approval Summary (aprvl_dt)
 *   id 2  LOADED  Approved, chip MINTED (NULL secondary), Approval Summary
 *   id 3  HELD    Approved but sdg_division sentinel 0 -> NULL  (parity check 13)
 *   id 4  HELD    Approved but NULL state -> no state_region row (parity check 8)
 *   id 5  FILTERED  project number contains TEST -> fails 11-W regex
 *   id 6  FILTERED  project number '11-W-123/4' -> only 3 digits
 *   id 7  EXCLUDED  soft-deleted (dltd_ind=1): valid (minted in id map) but
 *                   dropped at stg.demonstration_resolved
 *   id 8  LOADED  Under Review, phase from mdcd_demo_aplctn phase_4 -> Review
 *   id 9  LOADED  On-hold, no phase-date signal -> Concept fallback
 *
 * Every row carries a crosswalked status code (2,3,8). Code 1 'Pending' is also
 * mapped now (-> 'Under Review' per D1), but this fixture does not exercise it;
 * the 04_crosswalks/11_demo_status_check hard gate stays green. All timestamps are
 * fixed so the trace is deterministic; only the minted UUIDs (and the minted
 * chip sequence) vary run to run and are normalized by the emitter.
 *
 * Applied against the typed mysql_raw skeleton built from
 * reports/schema_snapshot/columns.csv (tests/sql/_skeleton.py), where every
 * column is nullable, so these partial column lists are sufficient.
 */
INSERT INTO mysql_raw.mdcd_demo(mdcd_demo_id, mdcd_demo_num, mdcd_scndry_demo_num, mdcd_demo_name, mdcd_demo_desc, state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, mdcd_demo_stus_cd, geo_ansi_state_cd, mdcd_chip_div_cd, creatd_dt, updtd_dt, aprvl_dt, dltd_ind)
  VALUES (1, '11-W-00001/1', '21-W-00100/1', '  Alpha Demonstration  ', 'First approved demo', '2021-03-01', '2026-02-28', 2, 'MA', 2, '2021-01-10 09:00:00+00', '2021-02-01 09:00:00+00', '2021-02-15', 0),
(2, '11-W-00002/1', NULL, 'Beta Demonstration', 'Approved, chip minted', '2021-06-01', '2026-05-31', 2, 'CT', 3, '2021-04-12 09:00:00+00', NULL, '2021-05-20', 0),
(3, '11-W-00003/4', '21-W-00200/4', 'Gamma Demonstration', 'Approved but missing sdg division', '2021-09-01', '2026-08-31', 2, 'FL', 0, '2021-07-01 09:00:00+00', '2021-07-15 09:00:00+00', '2021-08-10', 0),
  -- NULL state passes the filter (geo_ansi_state_cd is only format-checked when
  -- present) and the crosswalk_state completeness gate (which ignores NULL), so
  -- it reaches the loader, whose INNER JOIN on state_region then holds it back.
  -- A present-but-unmapped code (e.g. 'XX') would instead fail `make crosswalks`
  -- at 21_state_check, never reaching this silent hold-back path.
(4, '11-W-00004/9', NULL, 'Delta Demonstration', 'Approved but NULL state -> no state_region row', '2021-10-01', '2026-09-30', 2, NULL, 2, '2021-08-01 09:00:00+00', '2021-08-20 09:00:00+00', '2021-09-05', 0),
(5, '11-W-TEST/1', NULL, 'Epsilon Test Demonstration', 'Test row; bad project number', '2021-05-01', '2026-04-30', 2, 'MA', 2, '2021-09-01 09:00:00+00', NULL, NULL, 0),
(6, '11-W-123/4', NULL, 'Zeta Demonstration', 'Malformed project number (3 digits)', '2021-05-01', '2026-04-30', 2, 'MA', 2, '2021-09-15 09:00:00+00', NULL, NULL, 0),
(7, '11-W-00006/2', NULL, 'Eta Demonstration', 'Soft-deleted; valid but excluded at resolved', '2021-04-01', '2026-03-31', 2, 'GA', 2, '2021-10-01 09:00:00+00', '2021-10-10 09:00:00+00', '2021-04-15', 1),
(8, '11-W-00007/5', NULL, 'Theta Demonstration', 'Under Review; phase from application phase_4', '2022-01-01', '2027-12-31', 3, 'OH', 0, '2022-01-05 09:00:00+00', NULL, NULL, 0),
(9, '11-W-00008/5', NULL, 'Iota Demonstration', 'On-hold; no phase-date signal -> Concept', NULL, NULL, 8, 'IN', 0, '2022-02-01 09:00:00+00', NULL, NULL, 0);

-- Original demonstration application rows (mdcd_demo_aplctn). Only type_cd=1,
-- non-deleted rows feed the staging phase-by-date aggregation; the type_cd=2
-- row for demo 8 must be ignored (otherwise its phase_6 date would wrongly
-- promote demo 8 to 'Approval Summary' instead of the phase_4 'Review').
INSERT INTO mysql_raw.mdcd_demo_aplctn(mdcd_demo_aplctn_id, mdcd_pendg_demo_id, mdcd_demo_id, mdcd_demo_aplctn_stus_cd, mdcd_demo_aplctn_stus_dt, mdcd_demo_aplctn_type_cd, phase_4_strt_dt, phase_6_strt_dt, creatd_dt, dltd_ind)
  VALUES (1, 0, 8, 1, '2022-03-01', 1, '2022-03-01', NULL, '2022-03-01 09:00:00+00', 0),
(2, 0, 8, 1, '2022-09-01', 2, NULL, '2022-09-01', '2022-09-01 09:00:00+00', 0);

