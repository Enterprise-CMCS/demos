/*
 * Purpose: Curated mysql_raw seed fixture for the amendment migration-flow trace, with one row per disposition the mdcd_demo_amndmt -> demos_app.amendment path can take.
 * Refs:    sql/20_app/35_amendment.sql, sql/10_stg/13_filter_amndmt.sql, tests/sql/_skeleton.py
 *
 * Curated source fixture for the amendment migration-flow trace.
 *
 * An amendment IS-A application sharing one UUID with its
 * demos_app.application anchor (sql/20_app/35_amendment.sql), exactly like the
 * demonstration loader. Its demonstration_id is NOT NULL and must point at a
 * LOADED demonstration, so this fixture seeds parent demonstrations first
 * (mysql_raw.mdcd_demo, plus one mysql_raw.mdcd_pendg_demo for the pending-only
 * branch) and then the amendments (mysql_raw.mdcd_demo_amndmt), one row per
 * branch the mdcd_demo_amndmt -> demos_app.amendment path can take:
 *
 *   amndmt 1  LOADED   Approved (cd 2) parent demo 1; signature OA (cd 1)
 *   amndmt 2  LOADED   Under Review (cd 1) parent demo 1; signature OCD (cd 2)
 *   amndmt 3  LOADED   Withdrawn (cd 3); signature cd 3 (OGD) -> NULL, logged in
 *                      migration._parity_amendment_signature_dropped
 *   amndmt 4  HELD     parent demo 4 is Approved but held back (NULL state -> no
 *                      state_region row), so the loader's JOIN to a loaded
 *                      demonstration drops it: "approved parent held back"
 *   amndmt 5  HELD     approved parent (demo 6) is filtered, only the pending
 *                      parent survives -> NULL demo_uuid: "pending-only or
 *                      unmapped parent"
 *   amndmt 6  EXCLUDED soft-deleted (dltd_ind=1): PMDA-valid (minted in the id
 *                      map) but dropped at stg.amendment_resolved
 *   amndmt 7  FILTERED amndmt_aplctn_dt year 3000 -> fails the date rule in
 *                      stg._valid_amndmt_ids
 *   amndmt 8  FILTERED neither parent survives its filter (approved parent
 *                      filtered, pending parent NULL) -> dropped by bad_parent
 *
 * Parent demonstrations (mirrors a subset of the demonstration fixture):
 *   demo 1  LOADS    Approved, MA, sdg 2, approval date present
 *   demo 4  HELD     Approved but NULL state -> no migration.state_region row
 *   demo 6  FILTERED malformed project number '11-W-123/4' (only 3 digits)
 *
 * All timestamps are fixed so the trace is deterministic; only the minted
 * amendment UUIDs vary run to run and are normalized to AMENDMENT_UUID_NN
 * (ordered by mdcd_demo_amndmt_id) by the emitter. Applied against the typed
 * mysql_raw skeleton (tests/sql/_skeleton.py), where every column is nullable,
 * so these partial column lists are sufficient.
 */
-- Parent demonstrations the amendment loader joins to (demos_app.demonstration).
INSERT INTO mysql_raw.mdcd_demo(mdcd_demo_id, mdcd_demo_num, mdcd_scndry_demo_num, mdcd_demo_name, mdcd_demo_desc, state_prfmnc_yr_strt_dt, state_prfmnc_yr_end_dt, mdcd_demo_stus_cd, geo_ansi_state_cd, mdcd_chip_div_cd, creatd_dt, updtd_dt, aprvl_dt, dltd_ind)
  VALUES (1, '11-W-00001/1', '21-W-00100/1', 'Alpha Demonstration', 'Approved parent; loads', '2021-03-01', '2026-02-28', 2, 'MA', 2, '2021-01-10 09:00:00+00', '2021-02-01 09:00:00+00', '2021-02-15', 0),
(4, '11-W-00004/9', NULL, 'Delta Demonstration', 'Approved but NULL state -> held back', '2021-10-01', '2026-09-30', 2, NULL, 2, '2021-08-01 09:00:00+00', '2021-08-20 09:00:00+00', '2021-09-05', 0),
(6, '11-W-123/4', NULL, 'Zeta Demonstration', 'Malformed project number (3 digits) -> filtered', '2021-05-01', '2026-04-30', 2, 'MA', 2, '2021-09-15 09:00:00+00', NULL, NULL, 0);

-- Original application rows for the parent demos (mdcd_demo_aplctn). The
-- crosswalk_application_status completeness check requires this source to be
-- present and non-empty; status code 1 is mapped, and no phase dates are set so
-- the parents' loaded/held/filtered dispositions are unchanged.
INSERT INTO mysql_raw.mdcd_demo_aplctn(mdcd_demo_aplctn_id, mdcd_pendg_demo_id, mdcd_demo_id, mdcd_demo_aplctn_stus_cd, mdcd_demo_aplctn_stus_dt, mdcd_demo_aplctn_type_cd, phase_4_strt_dt, phase_6_strt_dt, creatd_dt, dltd_ind)
  VALUES (1, 0, 1, 1, '2021-02-15', 1, NULL, NULL, '2021-01-10 09:00:00+00', 0),
(4, 0, 4, 1, '2021-09-05', 1, NULL, NULL, '2021-08-01 09:00:00+00', 0),
(6, 0, 6, 1, '2021-09-15', 1, NULL, NULL, '2021-09-15 09:00:00+00', 0);

-- One pending demonstration so amendment 5 can survive its filter via the
-- pending parent while the approved parent (demo 6) is filtered out.
INSERT INTO mysql_raw.mdcd_pendg_demo(mdcd_pendg_demo_id, mdcd_demo_name, mdcd_chip_div_cd, creatd_user_id, creatd_dt, dltd_ind, mdcd_demo_aplctn_sgntr_lvl_cd)
  VALUES (101, 'Pending Parent Demonstration', 0, 1, '2022-06-20 09:00:00+00', 0, 0);

-- Amendments (mysql_raw.mdcd_demo_amndmt). mdcd_demo_id is the approved parent,
-- mdcd_pendg_demo_id the pending parent (see sql/10_stg/13_filter_amndmt.sql).
INSERT INTO mysql_raw.mdcd_demo_amndmt(mdcd_demo_amndmt_id, mdcd_demo_amndmt_name, mdcd_demo_id, mdcd_pendg_demo_id, amndmt_prd_from_dt, amndmt_prd_to_dt, mdcd_demo_amndmt_stus_cd, amndmt_stus_dt, amndmt_aplctn_dt, amndmt_desc, dltd_ind, creatd_dt, mdcd_demo_aplctn_sgntr_lvl_cd)
  VALUES (1, 'Alpha Amendment', 1, NULL, '2022-01-01', '2023-01-01', 2, '2022-02-01', '2022-01-15', 'First approved amendment', 0, '2022-01-10 09:00:00+00', 1),
(2, 'Beta Amendment', 1, NULL, '2022-03-01', '2023-03-01', 1, '2022-03-20', '2022-03-15', 'Under review amendment', 0, '2022-03-01 09:00:00+00', 2),
(3, 'Gamma Amendment', 1, NULL, '2022-05-01', '2023-05-01', 3, '2022-05-15', '2022-05-10', 'Withdrawn; OGD signature dropped to NULL', 0, '2022-05-01 09:00:00+00', 3),
(4, 'Delta Amendment', 4, NULL, '2022-06-01', '2023-06-01', 2, '2022-06-15', '2022-06-10', 'Parent demo held back (NULL state)', 0, '2022-06-01 09:00:00+00', 1),
(5, 'Epsilon Amendment', 6, 101, '2022-07-01', '2023-07-01', 1, '2022-07-15', '2022-07-10', 'Approved parent filtered; pending-only', 0, '2022-07-01 09:00:00+00', 2),
(6, 'Zeta Amendment', 1, NULL, '2022-08-01', '2023-08-01', 2, '2022-08-15', '2022-08-10', 'Soft-deleted amendment', 1, '2022-08-01 09:00:00+00', 1),
(7, 'Eta Amendment', 1, NULL, '2022-09-01', '2023-09-01', 1, '2022-09-15', '3000-01-01', 'Bad application date (year 3000)', 0, '2022-09-01 09:00:00+00', 1),
(8, 'Theta Amendment', 6, NULL, '2022-10-01', '2023-10-01', 1, '2022-10-15', '2022-10-10', 'Both parents invalid', 0, '2022-10-01 09:00:00+00', 1);

