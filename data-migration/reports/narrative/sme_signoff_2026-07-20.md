# SME + David sign-off ledger - 2026-07-20

**Source**: Stephanie Hauf's answers (`Data-Migration-Questions.docx`,
2026-07-20), which fold in the 2026-07-10 meeting brief and the David-owned
items.
**Purpose**: single source of truth for the 2026-07-20 dispositions, mapping
each answer to its current build state, recording the decisions resolved this
round, and listing what is still blocked on other people or unasked entirely.
**Reconciles**: `docs/developer/explanation-deliverable-action-backfill.adoc`,
`docs/developer/reference-cross-cutting-derivations.adoc`,
`docs/developer/explanation-document-migration.adoc`,
`docs/sme/explanation-comments-routing.adoc`.

> Scope of this ledger: decisions only. No code, schema, or loader changes were
> made in the pass that produced it; the follow-up build queue is in section 7.

---

## 1. Confirmed and already built (verify-only, no new build)

| Topic | 2026-07-20 answer | Where it lives / build state |
|---|---|---|
| Signature level on demonstration | `OA` on every migrated demo; live `DD` fails closed | `crosswalk_signature_level` (30/31) + tests |
| Signature level on amendment/extension | keep `OGD`/`OCD` where legal | amendment/extension scope; `{OA,OCD}` crosswalk |
| Demo status `1` Pending | load as `Under Review`, observe | built + tested (`test_demo_status_code_1_pending_maps_to_under_review` asserts `Under Review`) |
| Amendment statuses | Pending->Under Review, Approved, Withdrawn, Disapproved->Denied | `crosswalk_amendment_status` |
| Semi-annual BN reports | come across as **Quarterly** BN ("identical") | `deliverable_type` routing (was "blocked on SME"; now resolved) |
| Demonstration `type` | always `Demonstration`; amendments/extensions keep own type | built |
| Deleted deliverables | not migrated (leave them) | soft-delete policy |
| Deliverable confirmation status | dropped (no DEMOS home) | policy |
| Roles | external evaluator = non-login contact; Technical Director -> Policy TD, monitoring lead -> M&E TD; "route by table name" | `role_person_type` (42/43) + column-specific derivation |
| BN database tables | excluded entirely | **done** (`cbdd0ddb`, BN retirement) |
| Renewals / extensions | out of scope | WF3/WF5 |
| Unmatched demo types | `Not Applicable` dropped; `Other` -> review list | WF6 + exports |
| State access | CMS users = all states; state users flagged all-states/unknown held for review | WF2 |
| "Other program" free-text names | export for SDG review, never invent tags | `sme_review_exports` (`179fb7c2`) |
| Document `cmt_orgn_cd` = `S` state / `C` CMS | confirmed (pending a PMDA add-file spot-check) | D5 (`document-migration.md`); routes 348 `C` as CMS-attached, ~12,387 `S` as state |
| Untyped documents (85%) typed by parent deliverable + filename | OK | D7 (`document-migration.md`) |
| Phase collapse (phase_3's 7 sub-phases -> 1) + core phase map + milestone dates | OK | **built**: `20_app/36_application_date.sql`, `23_app_derived/50_application_phase.sql`, `10_stg/27_application_milestone.sql`, `99_parity/56_application_milestone.sql` |
| Extension reason "State Level Emergency" | files under `Other` | `comment-deliverable-resourcing`/deliverable scope |

Stephanie's detailed legacy-phase -> DEMOS-date-type table is the **spec** for
the already-built phase/date derivation. It is not a rebuild; it warrants an
**audit** of the built code against that table (queued in section 7), because
`pmda-cross-cutting-derivation-spec.md` Table 3 uses placeholder `date_type`
names (`ApplicationReceived`, `Phase2Received`, ...) that match neither the
DEMOS seed nor Stephanie's names.

---

## 2. Resolved this round (with rationale)

### 2.1 `deliverable_action` = full history backfill

> **Superseded 2026-07-21 (see §11.2): switched to MINIMAL** (genesis +
> current-status action per deliverable) after David's CMS priority ranking put
> `deliverable_action` in his lowest band and accepted a snapshot for #5 (D12).
> The "minimal legal trail" noted at the end of this subsection is now the
> primary plan, not the fallback.

Stephanie: "backfill from PMDA history (doable), or one synthetic
'migrated from PMDA' action; easiest wins."

**Decision: keep the full history backfill** already approved in
`pmda-history-tables-derivation-spec.md` (from `mdcd_dlvrbl_stus_hstry` +
`mdcd_dlvrbl_hstry`).

Rationale - the single-action shortcut is not actually the easier option:

- `deliverable_action` rows are constrained by the composite FK
  `(action_type_id, old_status_id, new_status_id) -> deliverable_action_configuration`.
  A synthetic "migrated from PMDA" action/transition has **no seeded row**, so
  it cannot be inserted without a DEMOS **seed change** (cross-repo, and DEMOS
  owns the state machine).
- It also has to satisfy the action-type boolean composite FK and the row
  CHECKs (`require_notes_for_user_actions`, `require_user_id_for_user_actions`,
  etc.), which a pseudo-action does not.
- The backfill's harder plumbing (staging reconstruction) is already designed
  and approved, and produces a real, legal trail.

So "easiest that is also legal" is the approved backfill. If timeline forces a
cut, the fallback is a **minimal legal trail** (one legal seeded transition per
deliverable), not a synthetic action type.

### 2.2 `chip_id` nullable + `is_migrated_from_pmda` on `demonstration` = DEMOS-app dependency

Stephanie: "Make `chip_id` nullable when `is_migrated=True`."

**Decision: migration repo takes no code change; DEMOS app (server/) owns it.**

- The demonstration loader (`20_app/30_demonstration.sql`) already **never
  mints** `chip_id`: it preserves the legacy `21-W-...` number or writes `NULL`,
  and advances `chip_id_number_seq` past preserved values so a later DEMOS mint
  cannot collide.
- **Blocking contradiction to flag to DEMOS**: the pinned
  `server/src/model/demonstration/demonstration.prisma` still declares
  `chipId String @default(dbgenerated())` (NOT NULL) with `@@unique([chipId])`.
  Inserting `NULL` fails until DEMOS makes it nullable.
- Recommended DEMOS change: mirror migration `20260623222056_add_migrated_user_features`
  (which added `is_migrated_from_pmda`/`has_logged_in` to `users`, dropped
  NOT NULLs, and added CHECKs). For `demonstration`: add
  `is_migrated_from_pmda`, drop `chip_id` NOT NULL (and its `dbgenerated`
  default for migrated rows), keep `@@unique` (Postgres allows multiple NULLs),
  and gate any "chip_id required" CHECK on `NOT is_migrated_from_pmda`.
- After DEMOS ships it, the migration must **re-pin** its Prisma DDL snapshot
  (`reports/prisma_ddl.sha256` + `state/prisma_ddl/<sha>.sql`).

### 2.3 Document metadata loader = deferred behind an s3_path strategy

The deliverable-file typing crosswalk foundation
(`crosswalk_deliverable_file_type`, seed snapshot) is committed and **load-only**
(`950d2426`). The `demos_app.document` loader stays deferred until DEMOS
supplies an `s3_path` strategy (see gaps 4.1-4.3). No `document` rows are loaded
in the interim.

### 2.4 Comment origin routing (`cmt_orgn_cd` on `mdcd_dlvrbl_cmt`) fully resolved

Legacy PMDA PHP gives the six origin codes their meaning (2026-07-20). Routing to
DEMOS `private_comment` / `public_comment` is now fully determined - CMS-side
private (`A,C,I`), state-side public (`S,R,B`) - with no remaining SDG
dependency. See §5 for the code table and rationale; the crosswalk build is
queued in §7.

### 2.5 Phase/date column mapping - decisions ratified

Stephanie's legacy-phase -> DEMOS-date-type table, reconciled against the live
`mdcd_demo_aplctn` columns (full inventory in §8). The already-built collapse is
kept; these refinements are now approved and queued in §7 (no code this pass):

- **Add the granular SDG-preparation starts** (previously collapsed away):
  `phase_3_a_sme_strt_dt` -> **SME Initial Review**, `phase_3_a_frvt_strt_dt` ->
  **FRT Initial Meeting**, `phase_3_b_cmcs_strt_dt` -> **BNPMT Initial Meeting**.
  The collapsed **SDG Preparation Start Date** stays as well.
- **OMB / OGC clearance -> Review phase** (end date = "received", latest round):
  `Receive OMB Concurrence` <- `COALESCE(phase_3_c_omb_end_dt, phase_3_b_omb_end_dt)`;
  `Receive OGC Legal Clearance` <- `COALESCE(phase_3_c_ogc_end_dt, phase_3_b_ogc_end_dt)`.
  Data-validated: the `c` (final) round dominates, `b`-only rows exist so the
  COALESCE is required.
- **State Application Submitted Date** <- `COALESCE(submsn_dt, phase_2_rcvd_dt)`
  (`submsn_dt` populated on 99%+ of rows; `phase_2_rcvd_dt` is the floor).
- **State Application Deemed Complete** <- the deemed-complete column, added as
  the *required* Completeness milestone; `Completeness Completion Date` stays as
  the phase-end (both emitted).
- **No-source ("X") fields stay unmapped, not fabricated**: Concept Paper
  Submitted; the 6 Review-workflow dates; OSORA x4; COMMs x2; and the 2
  Approval-Summary marked-complete dates have **no PMDA equivalent** anywhere -
  confirmed against the whole schema and the full `mdcd_demo_aplctn` date-column
  inventory (§8). They are left absent and ride the `is_migrated_from_pmda`
  validator exemption (§4.5), never invented.

---

## 3. Open - blocked on other people

Recorded with a recommended disposition so each becomes a rubber-stamp once the
owner answers.

| Item | Owner | Recommended disposition |
|---|---|---|
| Withdrawn demonstrations (migration sets a status DEMOS cannot reach on its own) | SDG | Carry `Withdrawn` as-is unless SDG says withhold; they are live business records |
| Deliverable acceptance-status vs main deliverable-status precedence | David | Main status wins; acceptance status only overrides where the two conflict and acceptance is terminal (Accepted) - confirm |
| 3 unmatched application doc types (no new types) | David | Temporary Extension Letter -> `General File`; Final BN Worksheet -> `Final Budget Neutrality Formulation Workbook`; Other -> `General File` |
| 162 statusless amendments (`mdcd_demo_amndmt`, no `stus_cd`) currently **dropped** | SME/SDG | **Corrected (§8.7):** these resolve to a *loaded approved parent* (approved-track), so the loader drops them fail-closed - the `Under Review` default fires only for the 6 genuinely pending-only ones, not these. Decide whether statusless approved-track amendments should load (e.g. as `Under Review`); doing so adds 162 phantom-affected applications |
| Program-detail tag mappings (10 tables in the old worksheet + "Other" free-text) | SME/SDG | First 10 approved and built; remainder + `mdcd_othr_pgm_dtl` free-text derivation still pending; block if in-scope rows would drop |
| BN workbook v2.13 -> v2.14 cell mapping | James | Not migration-blocking; Help Desk translate + upload path (BN DB tables already excluded) |
| Pending demonstrations in scope + extra time | Stephanie/PM | Confirmed in scope ("we need to migrate these"); loader partially built (`71a346b3`); schedule the remaining slice |
| Soft-deleted **approved** demonstrations (`mdcd_demo.dltd_ind=1`) | SDG | 82 format-valid demos are dropped for soft-delete, **81 of them Approved** (§8). Confirm PMDA soft-delete means garbage/superseded (correctly dropped) vs historical-but-real; the latter would re-add ~81 approved demos and materially improve phase-date coverage |

---

## 4. Unaddressed gaps (not asked or answered anywhere in the doc)

1. **Document `owner_user_id`** (`document` NOT NULL): no owner rule when the
   PMDA uploader is unknown/unmapped. Rec: D4 owner fallback (Primary Project
   Officer, DDME for M&E); a system/migration user only as a last resort - needs
   sign-off.
2. **Document `s3_path`** (`document` NOT NULL, `check_non_empty_s3_path`): a
   metadata-only migration has no blob. Help Desk covers **only** BN workbooks;
   nothing is stated for the ~10,800 other files. This is the real document
   blocker (2.3).
3. **Document `application_id`** (`document` NOT NULL): deliverable-linked docs
   resolve via deliverable -> demo -> application; non-deliverable docs have no
   stated anchor.
4. **NULL document `cmt_orgn_cd`**: routing assumes only `S`/`C`; confirm there
   are no NULLs, or define a default (rec: treat NULL as `S`/state).
5. **`is_migrated_from_pmda` entity scope**: only `users` has it today. Which of
   `demonstration` / `amendment` / `deliverable` / `document` need it to gate
   relaxed constraints (at minimum `demonstration`, per 2.2)? Beyond `chip_id`,
   `demonstration`/`application` need the flag to gate a **phase-completion
   validator-skip**: the `server` `checkPhaseCompletionRules` (`datesMustExist`)
   must early-return for migrated applications. Without it, **97.7% of loaded
   demos (§8) sit in a `Completed` state that DEMOS's own rules call impossible**,
   because the phase is stamped complete from status while its required dates
   were never captured in PMDA. The flag must also cover **`amendment`**, and
   more acutely: amendments carry no phase dates at all (§8.7), so **100%** of
   loaded amendments would fail. This is a hard cross-repo dependency, not a
   nicety:

   ```mermaid
   flowchart TD
     L[loader stamps phases] --> C[earlier phases = Completed]
     C --> V{validator:<br/>datesMustExist}
     V -->|no is_migrated| B[BLOCKS 97.7%]
     V -->|is_migrated skip| OK[accept, no dates]
   ```
6. **Federal Comment auto-calculation vs migration placement** (2.2's
   "auto-calculated" note): if DEMOS auto-derives the federal comment period,
   confirm the migration writing that phase/date does not double-compute or get
   overwritten.
7. **`status_updated_at` real-history derivation** (rides in the history spec):
   confirm it is still wanted alongside the `deliverable_action` backfill.

---

## 5. Two different `cmt_orgn_cd` columns (disambiguation)

The name collides across two unrelated tables; conflating them would misroute
data. Keep them separate:

| Column | Table | Domain | Meaning | Disposition |
|---|---|---|---|---|
| `cmt_orgn_cd` (documents) | `mdcd_dlvrbl_fil_doc` | `{S, C}` | file **origin**: state-submitted vs CMS-attached | D5; drives `document` routing (state 2 vs CMS-attached), confirmed 2026-07-20 |
| `cmt_orgn_cd` (comments) | `mdcd_dlvrbl_cmt` | `{A, B, C, I, R, S}`, no NULLs | comment **origin** for internal/public routing | `comment-deliverable-resourcing-spec.md`; legacy PHP semantics confirmed 2026-07-20 (see below) |

Stephanie flagged the confusing name on the **document** column; David agreed
the S/C reading is right. The 6-value comment column is a distinct concern - and
its codes are now known.

### Comment `cmt_orgn_cd` semantics (from legacy PMDA PHP, 2026-07-20)

| Code | Meaning (legacy PHP) | Side | Proposed DEMOS route |
|---|---|:--:|:--:|
| `S` | State origin | state | `public` |
| `R` | Resubmission comment | state (resubmission is a state action) | `public` |
| `B` | Budget-neutrality resubmission | state | `public` |
| `C` | CMS comment / file origin | CMS | `private` |
| `A` | Analyst/Reviewer comment (`R` was already taken) | CMS | `private` |
| `I` | CMS internal comment | CMS | `private` |

This split (CMS-side -> `private`, state-side -> `public`) matches the routing
principle already approved in `pmda-cross-cutting-derivation-spec.md` §6
("state-origin -> `public_comment`; CMS/internal -> `private_comment`"). The
author-default floor stays as a safety net: any row routed `private` whose author
is not a CMS user is held back and parity-flagged (a state-authored comment
cannot be private by DEMOS construction).

All six codes are now **confirmed** (2026-07-20), no SDG gate remaining:
- `A` / `C` -> `private`: analyst/reviewer and CMS comments were CMS-internal in
  PMDA, never surfaced to states. `I` (CMS internal) is unambiguous.
- `S` -> `public`: state origin.
- `R` / `B` -> `public`: resubmission (and BN resubmission) is a **state-only**
  action, so these are state-authored. The CMS counterpart, *requesting* a
  resubmission, is a distinct CMS-only action - a `deliverable_action_type`, not
  a `cmt_orgn_cd` origin code.

The author-default floor stays as a safety net regardless.

---

## 6. Stale-brief note (2026-07-10 meeting brief)

The brief predates several merges and now reads as out of date:

- "Pending demonstrations ... loader isn't built" - the pending-demonstration
  loader is partly built (`71a346b3`, `10_stg/24_pending_demonstration_resolved.sql`,
  `20_app/31_pending_demonstration.sql`, parity `99_parity/04_pending_approved.sql`).
- "Deliverables ... history, comments, contacts, documents ... still to come" -
  phase/date and milestone loaders are built (`ddaf3faa`); the deliverable-file
  document foundation is committed (`950d2426`).
- Budget neutrality "summary builds today" - superseded: BN machinery was
  **retired** entirely (`cbdd0ddb`); BN DB tables are out.

Treat this ledger (2026-07-20) as authoritative over the brief where they
disagree.

---

## 7. Follow-up build queue (not done in this pass)

1. `deliverable_action` **MINIMAL** backfill (2.1, revised §11.2) - genesis +
   current-status action per loaded deliverable; the FULL fork and its D8
   unmapped-code crosswalk are off the critical path.
2. Phase/date **audit + refinements**: verify the built `application_date` /
   `application_phase` / `application_milestone` code against Stephanie's
   legacy-phase -> date-type table (mapped / collapsed 7->1 / deferred
   SME-clearance end dates), fix `pmda-cross-cutting-derivation-spec.md` Table 3's
   placeholder names, and apply the four ratified mapping changes (§2.5): add the
   3 granular SDG-prep starts (SME/FRT/BNPMT), map OMB/OGC end dates to the Review
   milestones via `COALESCE(c_end, b_end)`, source State Application Submitted from
   `COALESCE(submsn_dt, phase_2_rcvd_dt)`, and emit State Application Deemed
   Complete alongside Completeness Completion Date.
3. Statusless-amendment handling (§3, §8.7): the 162 statusless *approved-track*
   amendments currently **drop fail-closed**; decide whether they load (and as
   what status) - this is net-new work, not the pending-track `Under Review`
   default the original note assumed (which only reaches the 6 pending-only ones).
4. Document metadata loader - blocked on the DEMOS `s3_path` strategy +
   owner/application_id rules (gaps 4.1-4.3).
5. DEMOS-app dependency (2.2 + 4.5): `demonstration.chip_id` nullable +
   `is_migrated_from_pmda`, **plus a `checkPhaseCompletionRules` validator-skip
   for migrated applications** (without it 97.7% of loaded demos fail DEMOS's own
   phase-completion rules, §8), then re-pin the Prisma DDL snapshot.
6. Author `crosswalk_comment_origin` (`sql/04_crosswalks/68_comment_origin.sql`)
   with the confirmed values (§5): `A,C,I`->`private`, `S,R,B`->`public` (all six
   codes confirmed; no SDG gate). Unblocks the comment loader (still gated behind
   the `deliverable_type` crosswalk / deliverable load).
7. SDG decision on soft-deleted approved demonstrations (§3, §8): drop vs
   re-include the 82 valid soft-deleted demos (81 Approved); gates whether the
   loaded count and phase-date coverage change.
8. `mdcd_pgm` enhancements + parity flag (§9), all optional/non-blocking:
   (a) `pgm_desc` description fallback for the 4 loaded demos with NULL
   `mdcd_demo_desc`; (b) backfill the 3 tag-assignments dropped for a NULL/invalid
   period from the parent program window (closes the `21_app_associative/10`
   TODO); (c) wire `pgm_cd` as a **medicaid-ID parity/discrepancy flag** into the
   `mdcd_demo_num` recovery audit (2 demos keyed to a different demonstration
   number) - flag for review, never auto-overwrite.
9. `deliverables_load` (§10), optional/advisory: the table stays `DROP_LEGACY`
   for bulk load, but its 100%-populated `Monitoring Lead` is reachable at the
   **demonstration grain** via name-recovery (24/29 demos) and is new info
   (usually not the `mdcd_dlvrbl` reviewer). Consider attaching it as a CMS
   monitoring **role on the demonstration** via the recovery-audit +
   `57_primary_officer_missing` track, contingent on resolving the 22 free-text
   names to DEMOS users; flag for review, never a keyed deliverable load.

---

## 8. Phase/date mapping - source-data verification (live PMDA, 2026-07-20)

Read-only profiling of the source RDS (DuckDB `ATTACH ... (TYPE mysql,
READ_ONLY)`), replicating the loader's scope rules. This is the empirical
backing for §2.5 and §4.5; every figure is reproducible from the queries run
this session.

**Caveats**: the replica omits the small `_keep_ids`/`_drop_ids` curation
overrides and the Approved-held / duplicate-medicaid hold-backs, and status
labels are inferred from `mdcd_demo_stus_cd`. These move counts by single digits,
not the conclusions.

### 8.1 Cutover scope

| Layer | Count |
|---|---|
| `mdcd_demo` total | 288 |
| `_valid_demo_ids` (3 format rules) | 183 |
| ...AND non-deleted (view 22 scope, loaded) | **101** |
| Pending: folded into an approved demo | 228 |
| Pending: held_no_project | 1 |
| Pending: orphan_loadable (loaded as own row) | **32** |
| **Total loaded demonstrations** | **133** (101 approved + 32 pending) |

### 8.2 `mdcd_demo_aplctn` full column inventory

This is the source table for all phase dates. It has **45 columns, 32
date/datetime**, every one classified (denominator = 84 type-1 non-deleted rows):

| Class | # | Columns |
|---|---|---|
| MAPPED | 17 | phase_1/2 dates, phase_3_a sme/frvt + phase_3_b cmcs **starts**, phase_4/5/6 start+end |
| NOW-MAPPED (grill, §2.5) | 4 | phase_3_{b,c}_{omb,ogc}_**end** |
| DEFERRED (SME) | 8 | phase_3_{b,c}_{omb,ogc}_**start**, phase_3_a sme/frvt + phase_3_b cmcs **end**, `mdcd_demo_aplctn_stus_dt` |
| Audit only (not phase dates) | 3 | `creatd_dt`, `updtd_dt`, `dltd_dt` |

**No unaccounted phase-date column exists, and no "X"-field source is present on
this table** (nor anywhere in the schema). The 8 deferred columns are
workflow-internal sub-round dates DEMOS has no named target for; they wait on an
SME decision to name targets or stay absent under the exemption.

### 8.3 Column population (type-1 non-deleted, n=84) - the sparsity

`phase_2_rcvd_dt` 83, `phase_2_cmpltns_rvw_dt` 80, deemed-complete 45,
`fed_cmt_prd` 34, `phase_2_dsrd_aprvl_dt` 31, SME start 25, phase_1 ~10, and
phase_4/5/6 only 4-7 each. The lifecycle dates DEMOS marks required are exactly
the ones PMDA rarely captured.

### 8.4 Exemption load - why the validator-skip is mandatory

The loader stamps earlier phases `Completed` from status, but their required
dates were never captured, so DEMOS's own `checkPhaseCompletionRules` would
reject them.

**Phantom instance** = one `(application, phase)` row stamped `Completed` while a
date its `datesMustExist` rule requires is absent. Per `checkPhaseCompletionRules`
the required-date phases are Concept, Application Intake, Completeness, SDG
Preparation and Review; Federal Comment is `No Validation` and Approval Package
gates on documents only. A demo at `Approval Summary` thus carries up to 5
phantom instances (its completed Concept..Review phases), one per unmet phase;
the totals below count these rows across all loaded applications (and are a
floor - the document and prior-phase-complete checks fail on top of the dates).

| Metric | Value |
|---|---|
| loaded demos with >=1 `Completed` phase missing required dates | 130/133 (97.7%) |
| ...among the mappable phases {App Intake, Completeness, SDG Prep} | 100/133 (75.2%) |
| approved-only (n=101): any / mappable | 100% / 94.1% |
| phantom `Completed`-but-incomplete phase instances | 497 |

The approved corpus (the bulk, auto-completed to Approval Summary) is
universally affected; fabricating dates would mean inventing ~497 required
values. `is_migrated_from_pmda` + validator-skip (§4.5) is required, not
defensive.

### 8.5 Soft-delete sizing

Soft-delete is pervasive in this source: **157/288** demonstrations and
**97/181** type-1 application rows are soft-deleted. Of the 183 format-valid
demos, only 101 load; **82 are valid-but-soft-deleted and dropped, 81 of them
Approved** (`mdcd_demo_stus_cd` 2/4/6 with `aprvl_dt`). This sizes the deferred
SDG decision in §3.

Two verified sub-findings:

- **Soft-deleted application rows do not starve live demos.** Re-aggregating the
  loaded demos' phase dates with vs without the soft-deleted app rows yields
  **identical** counts, and **0** loaded demos have their only type-1 app rows
  soft-deleted. The sparse coverage in §8.3 is genuine, not a filtering artifact.
- **The richer phase history sits on the dropped population**: the 97 soft-deleted
  type-1 app rows outnumber the 84 live ones, so re-including soft-deleted
  approved demos (if SDG so decides) would both add ~81 demos and improve
  phase-date coverage.

### 8.6 Alternate source evaluated and rejected

`aplctn_mngmt_raw_cleaned` (169-col SharePoint tracker, on the `DROP_LEGACY`
list) looked tempting for the "X" fields, but its extra date columns
(CMCS / OGC-OMB / State / App-Submission) are essentially all NULL. It is not a
viable source; recorded here so it is not re-discovered.

### 8.7 Amendments (`mdcd_demo_amndmt`) - parallel analysis

Amendments are a separate entity with a fundamentally different shape, so the
phantom problem is **worse** but the scope far smaller.

- Source is `mdcd_demo_amndmt` (13 columns, **no `phase_*` date columns at all**;
  only `amndmt_prd_from_dt`, `_to_dt`, `_stus_dt`, `amndmt_aplctn_dt`, `creatd_dt`).
- `current_phase_id` is **status-derived, not date-derived** (`35_amendment.sql`):
  Approved -> Approval Summary, Under Review -> Review, Withdrawn/Denied -> Concept.
  Amendments feed **no** `application_date` rows (that pipeline is `type_cd=1`
  only), yet they are materialized into `application_phase` by
  `50_application_phase.sql` ("every amendment").
- So every loaded amendment above Concept has all lower phases stamped
  `Completed` with **zero** backing dates -> **100%** phantom-affected.

Scope (source-rule replica):

| Layer | Count |
|---|---|
| `mdcd_demo_amndmt` total | 266 |
| non-deleted (soft-deleted 31) | 235 |
| valid / valid+non-deleted | 214 / 189 |
| status dist (valid+ND) | 168 statusless + 21 Approved (**no** Pending/Withdrawn/Denied present) |
| statusless -> Under Review (pending-track) | 6 |
| statusless -> **DROP fail-closed** (approved-track) | **162** |
| Approved -> Approval Summary (0 held) | 21 |
| **actually loaded** | **~27** |

Phantom load: 21 Approved (5 each) + 6 Under Review (4 each) = **129 phantom
instances**; 27/27 (100%) affected.

Effect on the §8.4 totals:

| Metric | Demos only | + amendments (loaded today) | + if the 162 are rescued |
|---|---|---|---|
| loaded applications | 133 | 160 | 322 |
| affected by phantom phases | 130 (97.7%) | 157 (98.1%) | 319 (99.1%) |
| phantom instances | 497 | 626 | 1,274 |

**Scope discrepancy flagged (see §3):** both this ledger's original §3 row and the
`35_amendment.sql` comment call the 162 statusless amendments "pending-track ->
Under Review", but the data shows they resolve to a **loaded approved parent**
(`parent_is_pending = FALSE` under "Approved wins"), so the loader **drops** them
fail-closed; only the 6 genuinely pending-only statusless amendments become
Under Review. Rescuing the 162 needs a rule for statusless *approved-track*
amendments, not the pending default, and would add 162 phantom-affected
applications (+648 instances).

---

## 9. `mdcd_pgm` (program table) - utility assessment (live PMDA, 2026-07-20)

`mdcd_pgm` is the parent "program" table and the head of the whole
`mdcd_*_pgm_dtl` family. It is **1:1 with demonstrations** (137 non-deleted rows =
137 demos, exactly 1 program/demo, 0 orphans). `pgm_cd` is an identifier string
that embeds a project number (not a categorical type code); `pgm_name`/`pgm_desc`
are free text; `prfmnc_prd_from/to_dt` is a fully-populated program performance
period (137/137). It is **mostly redundant** with sources the migration already
uses, but yields two small enhancements and, most usefully, a parity flag.

### 9.1 Redundant - no new use

- **Type tags** come from the `mdcd_*_pgm_dtl` detail tables, already folded into
  `demonstration_type_tag_assignment` (`21_app_associative/10-11` +
  `crosswalk_pgm_dtl_tag`); `mdcd_pgm` is only their parent link, not the tag
  source.
- **Name**: `mdcd_demo_name` is present on 101/101 loaded demos, `pgm_name` adds
  nothing.
- **Effective/expiration**: already sourced from
  `mdcd_demo.state_prfmnc_yr_strt/end_dt` (101/101); `mdcd_pgm`'s period is the
  same data (see 9.3 for the corroboration value).

### 9.2 Small usable enhancements

- **Description fallback (4 demos)**: 7 of 101 loaded demos have a NULL
  `mdcd_demo_desc`; `mdcd_pgm.pgm_desc` is populated for **4** of them.
  `description` is nullable, so this is enrichment, not a fix.
- **Tag-assignment period backfill (3 tags)**: `21_app_associative/10` drops any
  tag row whose `*_pgm_dtl` `from_dt`/`to_dt` is NULL or non-positive (DEMOS
  enforces `effective_date < expiration_date`) and defers it to "SME backfill".
  Today that is **3 rows** (Premium Assistance/ESI/QHP, Eligibility and Coverage,
  Reproductive Health: Fertility), and `mdcd_pgm`'s parent window is valid for all
  3, so the parent program period is a principled default that closes the loader's
  open TODO. Extends to the pending track via `mdcd_pendg_pgm` /
  `21_app_associative/13`.

### 9.3 Utility as a parity / discrepancy flag (its best use)

`pgm_cd` embeds a project number, giving an **independent witness to the medicaid
ID**. It is too noisy to auto-correct (~40% of loaded demos have a blank `pgm_cd`;
only 54/60 comparable rows start with the primary `mdcd_demo_num`), but the
mismatches are exactly what a parity check should surface:

- **2 demos are keyed to a genuinely different demonstration number** -
  `11-W-00311/6` -> program `11-W-00307/3`, and `11-W-00355/1` -> program
  `11-W-00348/1`. These should feed the `mdcd_demo_num` recovery audit
  (`reports/audits/mdcd_demo_num_recovery_audit.md`).
- The remaining mismatches are legacy-format / region-digit drift
  (e.g. `11-W-00427/9` vs `11-W-00427/-00001`).
- The performance period also **corroborates** `mdcd_demo` (agrees on 100/101
  start, 101/101 end); the single start-date mismatch is a parity item.

Use it as a **flag feeding review/parity, never as an authoritative overwrite.**

### 9.4 Dual-ID tie-break (narrow but real)

**7** non-deleted demos carry both a primary (`mdcd_demo_num`, `11-W` Medicaid)
and a secondary (`mdcd_scndry_demo_num`, mostly `21-W` CHIP) number. Only **1**
has a codeable `pgm_cd`: id 2564 (`11-W-00372/1` + `21-W-00069/1`, `pgm_cd`
`11-W-00372/1-00001`), which **confirms the primary is the medicaid_id**. This
**corroborates the loader's existing rule** (`medicaid_id` <- `mdcd_demo_num`,
`chip_id_legacy` <- `mdcd_scndry_demo_num`) rather than changing it; the other 6
have blank `pgm_cd` and cannot be adjudicated. Bonus data-quality flag: id 2522's
`mdcd_scndry_demo_num` is the literal junk string `"None"`, which the
secondary-number handling should null out.

---

## 10. Dropped-table assessment: `deliverables_load` (live PMDA, 2026-07-20)

`deliverables_load` is a **151-row denormalized flat file import**, not a
normalized PMDA table. It breaks every PMDA convention: 22 columns, all
`mediumtext` except 2 `int` code columns, spreadsheet-style headers (`demoName`,
`delName`, `Monitoring Lead`, `QuarterStartDate`, `Notes (2)`, `MyUnknownColumn`,
`PMDA Comments`, `IsDelCorrectColumnE`), **no keys** (no `mdcd_dlvrbl_id`, no
`mdcd_demo_id`, no row id), and **no `dltd_ind`**. It is already classified
`DROP_LEGACY` (`reports/narrative/drop_list.md`, `pgloader/drop_list.txt` line
44, "Dirty flat import; twin of `aplctn_mngmt_raw_cleaned`") and nothing in
`sql/` references it. **That decision is correct and stands** - the normalized
`mdcd_dlvrbl` (11,630 rows) + its history/reference tables carry every
meaningful column (due/submitted/status/review dates, reviewer, late-submission,
del-type), keyed and with history; the flat file's `PMDA Comments` (0%), `Notes`
(<1%), `Notes (2)` (7%), `MyUnknownColumn` (4%) are the dirty-import leftovers.

### 10.1 `Monitoring Lead` - the one column without a normalized twin

`Monitoring Lead` (100% populated, 22 distinct person names) has no obvious
equivalent in `mdcd_dlvrbl`, so it was tested for reachability. There is **no
medicaid id in the file**; it must be *recovered* by name, two fuzzy hops:

- **Hop 1 `demoName` -> `mdcd_demo`** (recovers demo + medicaid id): 24/29
  distinct names unique-match a non-deleted demo (0 ambiguous), 5 drift and miss
  (`Centennial Care 2.0`, `Medi-Cal 2020`, `SUD-TRA`, ...) -> **127/151 rows**.
- **Hop 2 matched demo + `delName` -> `mdcd_dlvrbl`**: 121/151 rows match, but
  only **101 map to exactly one** deliverable; **20 map to 2-5** (recurring
  reports reuse names) and ~30 don't resolve -> unambiguous per-deliverable
  attachment is only **101/151 (67%)**.

**Decisive:** `Monitoring Lead` is **constant within a demonstration** (29/29
demos have exactly one distinct lead; 0 vary by deliverable), so it is
**demonstration-level metadata**, the deliverable hop adds ambiguity for zero
information gain. It is also **genuinely new** information: of the 101 cleanly
matched rows the deliverable already names a reviewer in 66, but the lead equals
that reviewer in only 24 (usually a different person than `mdcd_dlvrbl.rvwr_*`).

### 10.2 Verdict

- **Keyed load into `deliverable`: no.** Fuzzy name-recovery (not a key), 67%
  single-deliverable resolution, and the wrong grain.
- **Demonstration-level enrichment: plausible, advisory only.** For the ~24
  cleanly recovered demos, `Monitoring Lead` could attach as a CMS monitoring
  **role on the demonstration**, feeding the same name-recovery bridge as the
  `mdcd_demo_num` recovery audit (`reports/audits/mdcd_demo_num_recovery_audit.md`)
  and the "primary roles beyond project officer" track
  (`sql/99_parity/57_primary_officer_missing.sql`). Kept advisory because it needs
  the 22 free-text person names resolved to DEMOS users (another fuzzy hop) and 5
  demos never match. Flag for review, never an authoritative keyed load; the
  table itself stays `DROP_LEGACY` for bulk load.

---

## 11. David CMS-priority alignment (2026-07-21)

David (SME), asked how to fill the DEMOS `deliverable_action` table from PMDA
history, returned a strict priority order for the deliverable migration. The
2026-07-21 analysis grading the migration against that order is folded into
11.1-11.3 below.

**David's order (verbatim intent):** (1) Deliverables exist in DEMOS; (2) Files
Submitted exist in DEMOS; (3) Deliverable *determination* matches PMDA;
(4) Gross status accurate; (5) comments/extensions/resubmit requests "represented
some how" - with "a big drop off after 1-4."

### 11.1 Alignment disposition

| # | Priority | State | Disposition |
|---|---|---|---|
| 1 | Deliverables exist | **BUILT** (`20_app/40_deliverable.sql`) | Aligned; caveat: `mdcd_dlvrbl_paper` not loaded (only its comments) - confirm scope |
| 2 | Files Submitted exist | **DEFERRED** as full `document` | Reachable now via `document_pending_upload` (no `s3_path`); see D11 |
| 3 | Determination matches | **BUILT** (David 2026-07-21) | Determination = review outcome (Accepted/Approved/Received and Filed) = terminal `deliverable_status`; carried by `deliverable.status_id` via `crosswalk_deliverable_status`. Terminal subset of #4. D13 resolved |
| 4 | Gross status accurate | **BUILT** (`crosswalk_deliverable_status`, 17->8) | Aligned |
| 5 | Comments/Extensions/Resubmits | **PARTIAL** | Comments built; extensions/resubmits -> read-only snapshot (D12) |

### 11.2 `deliverable_action` fidelity - MINIMAL (supersedes FULL)

`deliverable_action` serves David's #4 *trail* and #5 (its lowest band). Since a
snapshot is acceptable for #5 (D12), the FULL ~41k-row backfill is over-scoped.
**Decision 2026-07-21: MINIMAL** - a seeded genesis (`Created Deliverable Slot`)
plus one current-status action per loaded deliverable. This satisfies the gating
rule (latest action `new_status` = `deliverable.status_id`) and the DEMOS genesis
assumption, and drops the D8 unmapped-code crosswalk + self-transition
disambiguation off the critical path. Supersedes §2.1 and the D7=FULL sign-off
(the §2.1 "minimal legal trail" fallback is now the primary plan); §7 queue
item 1 tracks the MINIMAL build.

### 11.3 DEMOS-repo re-check (2026-07-21, `server/`)

Contrary to a hoped-for pull, the migrated-load relaxations have **not** shipped:

- `demonstration.chip_id` is still NOT NULL + `dbgenerated()` (T0.1 live;
  Preflight P0.8 still guards).
- `is_migrated_from_pmda` is still **users-only** - not on
  `demonstration`/`amendment`/`application`/`deliverable`/`document` (4B.1-4B.3
  unshipped).
- `document.s3_path` is still NOT NULL; `document_pending_upload` remains the only
  s3_path-free document variant (the basis for D11).
