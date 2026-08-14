# PMDA -> DEMOS migration feasibility assessment

- **Authored:** 2026-07-09 (revised 2026-07-09 to reflect post-deliverable + parity-wiring status)
- **Target cutover (primary):** 2026-07-17 (Fri)
- **Fallback cutover:** 2026-07-24 (Fri)
- **Status:** Conditionally feasible; the built scope is now close to GREEN.
  The deliverable + comment family is built and validated; the parity wiring
  for the remaining PENDING checks (1/2/4/10/12) is committed; overall parity is
  PENDING (no hard RED). What remains is three unbuilt full-scope loaders
  (documents, waivers, contacts) + the `*_pgm_dtl` expansion, the outstanding
  waiver/expenditure SME model confirmation, and one validating post-wiring
  parity run. Feasibility still hinges on the Jul 9-12 crunch reaching a local
  full-scale GREEN.

This document records the structured feasibility review (a "grill me" session)
held on 2026-07-09, revised the same day as codebase status advanced. It
captures the current migration state, the assumptions that had to be resolved
to make a date call, two cutover timelines (primary and fallback), the single
point of failure, and the go/no-go rule.

## TL;DR

The pipeline is mechanically sound and now further along: it runs end-to-end,
the Jul 8 Tier-1 rehearsal hit the constraints gate GREEN, and a Jul 9 full
run reached **OVERALL STATUS: PENDING** (no hard RED) with the deliverable +
comment family loaded and validated (5640 deliverables, 6718 comments, checks
15-17 GREEN). The three parity SQL files that were unauthored are now committed
(`90_row_counts.sql` for checks 1-2, `04_pending_approved.sql` for check 4), and
four of the six SME sign-offs are encoded as accepted-flags / deferrals
baselines under `reports/parity_accepted/`.

What remains for the full-scope cutover: **documents, waivers, and contacts
still have no app loaders** (only crosswalk/staging scaffolding for documents;
nothing for waivers/contacts), the `*_pgm_dtl` tag set is still PARTIAL (248),
and the waiver/expenditure DEMOS target-model confirmation is the one SME
sign-off still outstanding. The newly-wired checks (1/2/4/10/12) are committed
but have not yet been exercised by a post-wiring validating parity run.

July 17 is feasible **only if** the Jul 9-12 crunch builds the three remaining
loaders, closes the waiver SME confirmation, and reaches a local full-scale
GREEN. The Jul 24 fallback is pre-wired. The chief danger remains the
temptation to "fix and go" on the 17th after a half-clean rehearsal #2; the
rehearsal strategy explicitly warns against conflating "we found bugs" with "we
ran a clean rehearsal."

## Current state (how far along)

### Pipeline mechanics: sound

The full cutover chain executes end-to-end. The 2026-07-08 Tier-1 script
shakedown (against a 288-demonstration subset snapshot) ran init -> ... ->
`parity --accept-pending` and hit the constraints gate GREEN. Seven REDs were
found; five were mechanical and fixed in-code with regression tests, two were
data/SME. Three rehearsal-only bypasses were reverted at wrap-up. The
mechanical fixes + tests and the three data/SME REDs (RED-2/5/6) all have
permanent code fixes committed on `main` (through `ee9e2ca`).

### Parity gate: PENDING overall (no hard RED)

Production cutover requires `OVERALL STATUS: GREEN` (the `--accept-pending`
flag is rehearsal-only). The latest parity run (2026-07-09 14:27 UTC) is
**PENDING** -- zero hard RED. Check 5 (reconstructed-FK orphans) is now GREEN
(non-gating, load-surface scoped). Checks 1, 2, 4, 10, 12 still reported as
PENDING in that run, but their wiring was committed shortly after the run (see
the dagger note).

| # | Check | Status | Blocker / next step |
|---|---|---|---|
| 1 | Row count parity per consolidated family | PENDING† | wired: `90_row_counts.sql` (`86c4e1e`); needs a validating run |
| 2 | Numeric sum / count-checksum parity | PENDING† | wired: count-checksum in `90_row_counts.sql` (`86c4e1e`); needs a validating run |
| 3 | JSONB shape conformance | GREEN | - |
| 4 | Pending/approved unification audit | PENDING† | wired: `04_pending_approved.sql` + signed deferrals baseline (`ee9e2ca`); needs a validating run |
| 5 | Reconstructed-FK orphan checks | GREEN | non-gating, load-surface scoped; 23,336 orphan rows logged per-row |
| 6 | Demonstration ID provenance | GREEN | - |
| 7 | Users/person integrity | GREEN | - |
| 8 | Demonstration load completeness | GREEN | 100 demonstrations |
| 9 | System role assignment integrity | GREEN | - |
| 10 | Person state integrity | PENDING† | wired: accepted-flags baseline `person_state_flags.csv` (`4dbb46a`); needs a validating run |
| 11 | Active-users coverage cross-check | GREEN | - |
| 12 | Demonstration role assignment integrity | PENDING† | wired: accepted-flags baseline `demonstration_role_assignment_flags.csv` (`4dbb46a`); needs a validating run |
| 13 | Approved demos held back | GREEN | - |
| 14 | PMDA workflow scope coverage | GREEN | non-gating; 17 tables: 14 BUILT, 1 PARTIAL, 2 DEFERRED |
| 15 | Deliverable load completeness | GREEN | real (5640 loaded, 89 held back) |
| 16 | Deliverable integrity | GREEN | - |
| 17 | Deliverables held back | GREEN | non-gating; 89 held, logged per-row |
| 18 | State-region seed vs source drift | GREEN | - |
| 19 | Amendment load accounting | GREEN | 21 loaded, 6 held back, 92 signatures dropped to NULL |
| 20 | Medicaid.gov 1115 outcome-fact parity | GREEN | vacuously green |
| 21 | Demonstrations held back for duplicate medicaid_id | GREEN | non-gating; 1 held (11-W-00232/6) |
| - | Deliverable BN routing QA; override-note completeness/held | GREEN | non-gating; new checks, exercised in the Jul 9 run |
| - | Comment completeness / integrity / held | GREEN | 6718 comments loaded, 610 held back |

> † Checks 1, 2, 4, 10, 12 are now wired (SQL + accepted-flags/deferrals
> baselines committed in `86c4e1e`, `4dbb46a`, `ee9e2ca`), all timestamped
> AFTER the 14:27 UTC parity run. No post-wiring validating run has been
> completed yet, so they still present as PENDING. The next `make parity`
> against a fresh full-scale build is the single remaining step to confirm
> whether they go GREEN.

### Scope coverage: core + deliverables + comments built and validated

Per the Jul 9 run (check 14): **17 target tables -- 14 BUILT, 1 PARTIAL,
2 DEFERRED**. Row counts below are from the refreshed
`reports/generated/scope_coverage.csv`.

| Workflow / table | Disposition | Note |
|---|---|---|
| 2 Users / persons / roles / state | BUILT | users 980, person 1176, person_state 24822, system_role_assignment 591, demonstration_role_assignment 668, primary_demonstration_role_assignment 87 |
| 3 Demos / apps / amendments / dates | BUILT | demonstration 100, application 100, application_date 96, amendment 21 loaded (check 19) |
| 6 Deliverables | BUILT (validated) | deliverable 5640; `deliverable_type` single-input crosswalk (52/53); `deliverable_status` 0/7 resolved (50/51); checks 15-17 GREEN |
| 6 Comments | BUILT (validated) | private_comment 3074, public_comment 3644; re-sourced from deliverable-scoped `mdcd_dlvrbl_cmt`; BN override notes -> `private_comment` (`51_override_note`) |
| 4 Demo type tags | PARTIAL | 248; the full `*_pgm_dtl` set is still unbuilt |
| 6 Documents | DEFERRED (scaffolded) | `document_type` crosswalk (66/67) + staging link (10_stg/27) exist; **no app loader yet** |
| 5 Waiver / expenditure authorities | DEFERRED | **no loader**; SME must confirm the DEMOS target model first |
| 3 Contacts (wf 3 remainder) | DEFERRED | staging filter (10_stg/16) only; **no app loader** (wide-email pivot to person/person_state/role_assignment) |
| 3 Extensions / renewals | DEFERRED | post-MVP; DEMOS has no renewals concept |
| 8 BN corpus, 9 MRT, 10 STC, 11 admin | OUT-OF-SCOPE | DEMOS-owned or dropped |

> Waivers and contacts are not yet tracked in `scope_coverage.csv` (no loader).
> BN corpus, MRT, STC, and email/admin remain OUT-OF-SCOPE (DEMOS-owned or
> dropped).

## Assumptions resolved (the grilling)

Each of these was a branch in the feasibility decision tree. All must hold for
the primary date to stand. Status updated to the current codebase.

1. **Scope = full (in-scope workflows).** Deliverables (wf 6) + comments are
   now BUILT and validated. Documents (wf 6 child), waiver/expenditure
   authorities (wf 5), contacts (wf 3 remainder), and the full `*_pgm_dtl`
   demo-type tag set (wf 4) remain in scope but unbuilt. BN corpus, MRT, STC,
   and email/admin remain OUT-OF-SCOPE (DEMOS-owned or dropped).
2. **Full-PROD static snapshot is ready now** for both timed rehearsals. (The
   Jul 8 run was only a 288-demo subset; two of its REDs were subset artifacts.)
3. **SME is available this week.** Four of the six sign-offs are now encoded as
   accepted-flags / deferrals baselines (see below); the one remaining
   blocking sign-off is the waiver/expenditure DEMOS target model.
4. **Backup operator is identified and available** for rehearsal #2 and
   cutover day.
5. **Three loaders remain to be built by Jul 12** (documents, waivers,
   contacts) plus the `*_pgm_dtl` expansion. The deliverable loader + comments
   are DONE and validated at full scale (5640 deliverables, checks 15-17
   GREEN).
6. **Loaders ready + local full-scale build GREEN by Jul 12**, so R1 on Jul 13
   is a shakedown of proven code, not a first run.
7. **Parity SQL is now DONE.** `90_row_counts.sql` (checks 1-2, commit
   `86c4e1e`) and `04_pending_approved.sql` (check 4, commit `ee9e2ca`) are
   authored and wired. What remains is one validating post-wiring `make parity`
   run to confirm checks 1/2/4/10/12 go GREEN (they were committed after the
   last parity run).
8. **RED-2/5/6 are resolved in code** (no longer rehearsal placeholders):
   `deliverable_status` codes 0/7 (commit `d4208fd`), the amendment naming rule
   -- synthesize a name when the source name is empty (`a92bd62`), and the
   amendment signature code-0 rule -- allow NULL `signature_level` + hold back
   Approved amendments missing required fields (`5f24615`, `7e872da`). Formal
   SME ratification is still wanted where the decisions were made in-session.
9. **Rollback is drilled in R1** (flip then rollback, confirm clean pre-flip
   state). It has never been exercised.
10. **DEMOS `refreshDbObjects` step is tested in R1** (history triggers,
    functions, utility views, role grants, pg_cron), with the DEMOS `server/`
    checkout pinned and `DATABASE_URL` prepared.
11. **Stakeholder go/no-go is Jul 16**, conditional on a clean R2. Comms
    templates are ready; freeze_begin + flip_complete are rehearsed in R2.
12. **Jul 24 fallback is pre-wired** with stakeholders and the backup operator.

### SME sign-offs on the critical path

| # | Sign-off | Status |
|---|---|---|
| 1 | Consolidated-family mapping freeze (checks 1-2) | **DONE** -- row-count reconciliation encoded in `90_row_counts.sql` (`86c4e1e`) |
| 2 | Sign `reports/narrative/pending_approved_decisions.md` (check 4) | **DONE** -- signed deferrals baseline `reports/parity_accepted/pending_approved_deferrals.csv` (`ee9e2ca`) |
| 3 | Adjudicate the 154 person-state holds (check 10) | **DONE** -- accepted-flags baseline `person_state_flags.csv` (`4dbb46a`) |
| 4 | Adjudicate the 166 demo-role-assignment holds (check 12) | **DONE** -- accepted-flags baseline `demonstration_role_assignment_flags.csv` (`4dbb46a`) |
| 5 | Confirm the waiver/expenditure DEMOS target model (prerequisite for the wf 5 loader) | **OUTSTANDING** -- the one remaining blocking sign-off |
| 6 | Secondary confirmation of D1 (demo-status code 1 -> 'Under Review') | Non-blocking; still wanted |

> "DONE" means encoded/baselined in committed code; the validating parity run
> (assumption 7) is still needed to confirm checks 1/2/4/10/12 actually report
> GREEN. RED-2/5/6 are resolved in code (assumption 8); only ratification
> remains.

## Timeline A -- primary: Jul 17 cutover

> Days of week: Jul 9 Thu, 10 Fri, 11 Sat, 12 Sun, 13 Mon, 14 Tue, 15 Wed,
> 16 Thu, 17 Fri.

| Date | Milestone | Detail |
|---|---|---|
| Jul 9-12 | **The crunch** | Build 3 loaders (documents, waivers, contacts) + `*_pgm_dtl` expansion; close the waiver/expenditure SME model confirmation; run the validating post-wiring `make parity` to confirm checks 1/2/4/10/12 GREEN; **local full-scale GREEN by Jul 12** |
| Jul 13 (Mon) | R1 -- full-scale shakedown | Full chain on the full static snapshot + **rollback drill** + **DEMOS `refreshDbObjects` test** |
| Jul 14 (Tue) | Fix R1 surprises; reach parity GREEN | R1 is expected to surface surprises; fixes land here |
| Jul 15 (Wed) | R2 -- zero-intervention GREEN | Backup operator observing; comms rehearsal (freeze_begin + flip_complete to a private channel) |
| Jul 16 (Thu) | Stakeholder go/no-go | Conditional on a clean R2; pre-cutover prep |
| Jul 17 (Fri) | **Cutover** | Production cutover |
| Jul 24 (Fri) | Fallback | Pre-wired slip date (see Timeline B) |

## Timeline B -- fallback: Jul 24 cutover

Used if any R1/R2 surprise requires a fix, the waiver SME confirmation slips
past Jul 14, or any loader is not GREEN by Jul 12. The extra week absorbs the
crunch overflow and restores weekday buffer.

> Days of week: Jul 18 Sat, 19 Sun, 20 Mon, 21 Tue, 22 Wed, 23 Thu, 24 Fri.

| Date | Milestone | Detail |
|---|---|---|
| Jul 9-15 | **Extended crunch** | Same build scope as Timeline A (3 loaders + `*_pgm_dtl`; waiver SME confirmation; validating parity run) with +3 weekdays of buffer through Wed Jul 15; **local full-scale GREEN by Jul 15** |
| Jul 20 (Mon) | R1 -- full-scale shakedown | Full chain on the full static snapshot + **rollback drill** + **DEMOS `refreshDbObjects` test** |
| Jul 21 (Tue) | Fix R1 surprises; reach parity GREEN | - |
| Jul 22 (Wed) | R2 -- zero-intervention GREEN | Backup operator observing; comms rehearsal |
| Jul 23 (Thu) | Stakeholder go/no-go | Conditional on a clean R2; pre-cutover prep |
| Jul 24 (Fri) | **Cutover** | Production cutover (fallback date) |

## Single point of failure

The parity-SQL and most-SME-sign-off burden that dominated the earlier plan is
now discharged: `90_row_counts.sql` and `04_pending_approved.sql` are authored,
and four of six SME sign-offs are encoded as accepted-flags / deferrals
baselines. The remaining single point of failure is the build crunch (Jul 9-12
for Timeline A, Jul 9-15 for Timeline B), which must deliver:

- Three new loaders (documents, waivers, contacts) + the `*_pgm_dtl` expansion,
  each with derivations + tests. (Deliverable + comment loaders are built and
  validated.)
- The waiver/expenditure DEMOS target-model SME confirmation (prerequisite for
  the waiver loader -- the one outstanding blocking sign-off).
- One validating post-wiring `make parity` run to confirm checks 1/2/4/10/12
  go GREEN with the newly-committed wiring.

If any of that slips past the crunch window, R1 cannot be a shakedown of proven
code, the two-rehearsal exit gate collapses, and the date slips to Jul 24.

## Go / no-go rule

**GO on the cutover date iff ALL hold:**

- Local full-scale build is GREEN by the end of the crunch window (including
  the post-wiring checks 1/2/4/10/12).
- R1 (full-scale shakedown) + rollback drill + `refreshDbObjects` test are
  clean on R1 day.
- Parity is GREEN by the day before R2.
- R2 is zero-intervention GREEN (backup operator co-signs).
- Stakeholder go-decision recorded on go/no-go day.

**NO-GO (slip to Jul 24) if ANY hold:**

- Any R1 or R2 surprise requires a fix (a "fix and go" on cutover day is not
  acceptable).
- The waiver/expenditure SME confirmation slips past the parity-GREEN deadline.
- Any loader is not GREEN by the end of the crunch window.
- The validating parity run shows any of checks 1/2/4/10/12 still RED/PENDING
  for a reason not covered by an accepted baseline.

## Do today (not Jul 12)

1. Run the validating post-wiring `make rebuild` -> `parity` against a fresh
   full-scale build. This is the single step that confirms whether the
   newly-wired checks 1/2/4/10/12 (row counts, count-checksum, pending/approved
   unification, person-state flags, demo-role flags) actually report GREEN. If
   any is RED/PENDING for a reason not covered by its baseline, that becomes a
   crunch-day-1 fix.
2. Get the waiver/expenditure DEMOS target-model SME confirmation. It is the
   one remaining blocking sign-off and the prerequisite for the wf 5 loader;
   the waiver loader cannot be built until it lands.
