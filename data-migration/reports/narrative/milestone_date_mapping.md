# Milestone date mapping (application_date + application_phase)

How the migration brings legacy phase-milestone dates into DEMOS
`demos_app.application_date` and derives `demos_app.application_phase`, and which
legacy date columns are deliberately deferred for SME review.

- Loaders: `sql/10_stg/27_application_milestone.sql` (tall crosswalk view),
  `sql/20_app/36_application_date.sql` (application_date), and
  `sql/23_app_derived/50_application_phase.sql` (application_phase + Federal
  Comment guard).
- Parity: `sql/99_parity/56_application_milestone.sql` logs the deferred columns
  (non-gating) and fail-closes on the Federal Comment guard (gating).
- Coverage (per the 2026-07-10 SME answers): demonstrations + pending
  demonstrations get milestone dates; demonstrations + pending demonstrations +
  amendments get per-phase status rows.

## High-confidence date mapping

Both approved (`mdcd_demo`) and pending (`mdcd_pendg_demo`) demonstrations draw
their phase dates from `mdcd_demo_aplctn` (type 1, non-deleted), aggregated per
demo to the furthest milestone reached (`max()` across application rows), keyed
on `mdcd_demo_id` and `mdcd_pendg_demo_id` respectively. Only these
high-confidence, semantically clear columns are mapped; every mapped
`date_type_id` is a seeded DEMOS `date_type` (baseline seed plus the
`20260612133841` renames and the `20260617124348` `Application Approval Date`
addition).

| DEMOS `date_type_id` | DEMOS phase | Legacy source | Approved | Pending |
|---|---|---|---|---|
| Concept Start Date | Concept | `mdcd_demo_aplctn.phase_1_strt_dt` | yes | yes |
| Concept Completion Date | Concept | `mdcd_demo_aplctn.phase_1_end_dt` | yes | yes |
| Application Intake Start Date | Application Intake | `COALESCE(aplctn.phase_2_rcvd_dt, demo.phase_2_rcvd_dt, demo.rcvd_dt)` (pending: `aplctn.phase_2_rcvd_dt`) | yes | yes |
| State Application Submitted Date | Application Intake | `mdcd_demo.submsn_dt` | yes | no (no demo-level column) |
| Completeness Review Due Date | Application Intake / Completeness | `mdcd_demo_aplctn.phase_2_cmpltns_rvw_dt` | yes | yes |
| Completeness Completion Date | Completeness | `COALESCE(aplctn.phase_2_state_aplctn_deemd_cmpltn_dt, demo.phase_2_state_aplctn_deemd_cmpltn_dt)` (deemed complete = completeness done) | yes | yes |
| Federal Comment Period Start Date | Federal Comment | `mdcd_demo_aplctn.phase_2_fed_cmt_prd_strt_dt` | yes | yes |
| Federal Comment Period End Date | Federal Comment | `mdcd_demo_aplctn.phase_2_fed_cmt_prd_end_dt` | yes | yes |
| Expected Approval Date | SDG Preparation | `mdcd_demo_aplctn.phase_2_dsrd_aprvl_dt` (desired approval) | yes | yes |
| SDG Preparation Start Date | SDG Preparation | earliest non-null of the seven `phase_3_*_strt_dt` (SME/FRVT/CMCS/OGC/OMB) | yes | yes |
| Review Start Date | Review | `mdcd_demo_aplctn.phase_4_strt_dt` | yes | yes |
| Review Completion Date | Review | `mdcd_demo_aplctn.phase_4_end_dt` | yes | yes |
| Approval Package Start Date | Approval Package | `mdcd_demo_aplctn.phase_5_strt_dt` | yes | yes |
| Approval Package Completion Date | Approval Package | `mdcd_demo_aplctn.phase_5_end_dt` | yes | yes |
| Approval Summary Start Date | Approval Summary | `mdcd_demo_aplctn.phase_6_strt_dt` | yes | yes |
| Approval Summary Completion Date | Approval Summary | `mdcd_demo_aplctn.phase_6_end_dt` | yes | yes |
| Application Approval Date | Approval Summary | `mdcd_demo.aprvl_dt` | yes | **no** (a pending demo is not approved) |

`application_date.date_value` is stored as `timestamptz`, **anchored to
America/New_York** per the DEMOS convention (see "Timezone convention" below), not
as a bare midnight-UTC cast; `created_at` / `updated_at` are taken from the
demonstration's own audit timestamps (true instants, left as-is). A held-back
demonstration (absent from `demos_app.demonstration`) contributes no row.
Amendments carry no confidently mappable milestone-date column, so they get **no
application_date rows** (their dates are deferred below).

## application_phase derivation

For every loaded demonstration (approved + pending) and amendment, one row per
real phase (the 8 phases with `phase_number > 0`) is derived from the
`current_phase_id` the demonstration / amendment loaders already set:

- phase before the current phase -> `Completed`
- the current phase -> `Started`
- phase after the current phase -> `Not Started`

Because `current_phase_id` is always Concept or later, Concept is never
`Not Started` (which `phase_phase_status` forbids).

### Federal Comment past-window failsafe

The DEMOS nightly cron `update_federal_comment_phase_status()` advances the
Federal Comment / SDG Preparation phases (and inserts an `SDG Preparation Start
Date` of "today") for any application whose Federal Comment window has dates and
whose Federal Comment phase is still `Not Started` / `Started`. For a historical
window that already closed by cutover that advance is spurious, so the loader
forces Federal Comment = `Completed` whenever its loaded end date is before the
cutover date. A window still open at cutover keeps its derived status and the
cron transitions it correctly on schedule.

**Cutover constant.** The failsafe reference date is `2026-08-20` (planned
go-live), inlined as `TIMESTAMPTZ '2026-08-20 00:00:00-04:00'` (Eastern midnight,
EDT) in `sql/23_app_derived/50_application_phase.sql` and mirrored in the parity
guard `sql/99_parity/56_application_milestone.sql`. It is anchored to Eastern
because the `Federal Comment Period End Date` it compares against is now an
Eastern end-of-day instant (see "Timezone convention" below). A future slip is a
one-line change in both files (kept intentionally to a single documented
constant; there is no repo-wide sweep of this date).

## Timezone convention

Legacy milestone columns are MySQL `date` values (calendar dates, no time). DEMOS
stores date-only values anchored to **America/New_York**, distinguishing
start-of-day (SOD, midnight Eastern) from end-of-day (EOD, `23:59:59.999`
Eastern) per date type -- see `server/src/constants.ts`
(`DATE_TYPES_WITH_EXPECTED_TIMESTAMPS`). A bare `date::timestamptz` cast under the
UTC RDS session would store midnight UTC and render **one day early** for Eastern
users; the migration instead wraps every date-only value with
`migration.eastern_day_start(...)` or `migration.eastern_day_end(...)` (defined in
`sql/00_init/03_helper_fns.sql`). Of the 17 mapped milestone types, only two are
End of Day:

| Anchor | Milestone `date_type_id` |
|---|---|
| **End of Day** (`eastern_day_end`) | `Completeness Review Due Date`, `Federal Comment Period End Date` |
| **Start of Day** (`eastern_day_start`) | all other 15 mapped milestone types |

Full findings, evidence chain, and the exporter handoff recommendation are in
`reports/narrative/timestamp_timezone_audit.md`.

## Deferred for SME review (logged, not mapped)

`sql/99_parity/56_application_milestone.sql` builds
`migration._parity_application_milestone_unmapped`: one row per column below with
the count of non-null in-scope occurrences, so SME can see how much data still
needs a home. These are **not** invented as a `date_type`.

| Legacy column(s) | Why deferred |
|---|---|
| `mdcd_demo_aplctn.phase_3_a_sme_strt_dt` / `phase_3_a_sme_end_dt` | SME clearance sub-dates; candidate target `SME Initial Review Date` is not high-confidence (start vs end, and which of several SDG-prep sub-dates). |
| `mdcd_demo_aplctn.phase_3_a_frvt_*`, `phase_3_b_cmcs_*`, `phase_3_b_ogc_*`, `phase_3_b_omb_*`, `phase_3_c_ogc_*`, `phase_3_c_omb_*` (start+end) | FRT / BNPMT / OGC / OMB clearance sub-dates; their DEMOS targets (`FRT Initial Meeting Date`, `BNPMT Initial Meeting Date`, and the Review-phase clearances) require SME ratification of the ordinal/semantic match. Their earliest start already feeds `SDG Preparation Start Date`. |
| `mdcd_demo_aplctn.mdcd_demo_aplctn_stus_dt` | Application-status date; no single milestone `date_type` target. |
| `mdcd_demo_amndmt.amndmt_aplctn_dt`, `amndmt_stus_dt` | Amendment application / status dates; amendments get phase rows (status-derived) but no confidently-mappable milestone `date_type`. |

Columns consumed elsewhere (not "unmapped"): `mdcd_demo_amndmt.amndmt_prd_from_dt`
/ `amndmt_prd_to_dt` (amendment effective/period in `sql/20_app/35_amendment.sql`),
`mdcd_demo.state_prfmnc_yr_strt_dt` / `state_prfmnc_yr_end_dt` (demonstration
effective/expiration), and the `creatd_dt` / `updtd_dt` audit columns.

## Notes

- The mapping lives inline in the staging view (consistent with the existing
  `current_phase_by_date` derivation), not in a CSV crosswalk: the aggregation
  (`max()` over type-1 rows, `COALESCE` across the phase_3 starts) cannot be
  expressed as a flat column->value crosswalk.
- All three loaders are idempotent and guarded inert until their inputs exist,
  so the app-layers idempotency harness applies them as clean no-ops.
