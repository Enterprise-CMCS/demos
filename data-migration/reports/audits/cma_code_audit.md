# CMA Source-System Code Audit

Audit of the sister PMDA source repo `../cma/` (the legacy MySQL + Laravel webapp
that this migration sources from) for anything reusable in the PMDA -> DEMOS
(`demos_app` Postgres) migration: crosswalk/enum resolution, target-column
derivation logic, and reusable view/aggregate SQL.

- **Date:** 2026-06-25
- **Method:** 8 read-only subagents, one per high-value subdirectory
  (`db` split into DDL + dumps; `cma-service/app` split into Models + Services/Repos;
  plus `etl`, `pipelines`, `ml`, `solr`). Anchored on the open blockers from
  `reports/inputs/derivability_verdicts.yaml`, `reports/narrative/pending_approved_decisions.md`,
  and `reports/narrative/notes.md`.
- **Companion file:** machine-readable candidates were kept in
  `reports/cma_crosswalk_derivation_candidates.csv` (removed in the reports/
  reorg as an unreferenced orphan; recoverable from git history if needed).
- **Scope honored:** no files in either repo were modified by the audit.

---

## 0. Source-of-truth guidance (read this first)

The `../cma/db/` tree carries **two disagreeing vintages**. Treat them as follows:

| Artifact | Vintage | Use for |
|---|---|---|
| `cma/db/migrations_schema/mysql-schema.sql` (DB `cma_dev_copy`, 10,077 lines) | current | **Column structure / source-of-truth for DDL.** Schema-only (no data). |
| `cma/db/CMA-Local-20241014.sql` (DB `cma-next`, Oct 2024) | current | **Reference-table VALUES / source-of-truth for enum codes.** All 68 `*_rfrnc` tables recovered. |
| `cma/db/cma-tables/*.sql` | 2016-07-02 | **Do not trust for values** -- several code lists grew/changed by 2024. Useful only as a structural cross-check. |

There are **no triggers, stored procedures, functions, generated columns, CHECK
constraints, or enforced FKs** in the source schema (dumped with
`FOREIGN_KEY_CHECKS=0`). All server-side derivation lives in **5 VIEWS** at the
tail of `mysql-schema.sql`; everything else is **application-side** (Laravel
`app/Models/Factories/*`, `app/Services/*`, `app/Repositories/*`). Number
generation (demo numbers, program codes) is app-side, not DB-side.

`etl/`, `pipelines/`, `ml/`, `solr/` produced **almost no** crosswalk/derivation
value (details in §6). The wins are concentrated in `db/` + `cma-service/app/`.

---

## 1. High-value wins (ranked) -- these directly unblock our blockers

### W1. `deliverable_type_id` BN-routing rule recovered (our #1 hard blocker)
The deliberately-deferred `deliverable_type` / BN-routing question
(`reports/crosswalks/proposed/deliverable_type_bn_routing.md`) has a concrete
legacy rule in the app:

- **BN routing:** `is_budget_neutrality = (bdgt_ntrlty_ind = 1 AND <type_code> IN (57, 70))`
  -- `cma-service/app/Http/Controllers/DeliverableController.php:1156-1561`.
- **Content routing codes** observed in the controller branch logic:
  `53 = Quarterly Monitoring Report`, `55 = Annual Monitoring Report`,
  `57 = Quarterly Budget Neutrality Report`, `62 = Monitoring Protocol`,
  `70 = Annual Budget Neutrality Report`; codes `63/65/67` are excluded from the
  "real deliverable" count.
  > **Correction (2026-06-26 re-audit):** the original draft mislabeled `57` as
  > "Budget Neutrality workbook" and `62` as "MRT Protocol"; the verified source
  > names in `reports/reference_data/mdcd_dlvrbl_rpt_ocrnc_rfrnc.csv` are
  > `57 = Quarterly Budget Neutrality Report` and `62 = Monitoring Protocol`.
- **Cadence vs content split:** cadence is a separate integer month-interval
  (`mdcd_dlvrbl_rpt_ocrnc_rfrnc`: `0=Single,1=Monthly,3=Quarterly,6=Semi-Annual,12=Annual`),
  joined `mdcd_dlvrbl.mdcd_dlvrbl_type_cd = mdcd_dlvrbl_rpt_ocrnc_rfrnc.<cd>`
  (`cma-service/app/Services/DeliverableService.php:53-57`, used throughout
  `DbDeliverableRepository.php`).

> **CONFLICT to resolve (see §3, C1):** the app's branch codes (53/55/57/62/70)
> do **not** fit the 8-value `mdcd_dlvrbl_type_rfrnc` (1-8) that the 2024 dump
> recovered, but they **do** fit the 0-88 content taxonomy of
> `mdcd_dlvrbl_rpt_ocrnc_rfrnc`. The app's "deliverable type code" in routing is
> almost certainly the **rpt_ocrnc** code, not `mdcd_dlvrbl_type_cd`. This must be
> confirmed before lifting the rule, but `mdcd_dlvrbl_rpt_ocrnc_rfrnc` (0-88) is
> very likely the content taxonomy the BN-routing investigation needs.
>
> **Resolved (2026-06-26 re-audit):** directionally right, operationally wrong.
> DEMOS `deliverable_type` *is* the `rpt_ocrnc` content vocabulary (17 named
> types), not the coarse 1-8 type. BUT `rpt_ocrnc_cd` exists **only on the
> reference table** -- no instance FK -- and the migratable `mdcd_dlvrbl` grain
> carries no content discriminator at all (only cadence `type_cd` 1-8 +
> `bdgt_ntrlty_ind` + free-text name). So routing cannot use `rpt_ocrnc`;
> `bdgt_ntrlty_ind` stays authoritative and `deliverable_type` resolves to only
> ~4 of 17 content types (fidelity ceiling). See
> `reports/crosswalks/proposed/deliverable_type_bn_routing.md`.

**Action:** feed this into `deliverable_type_bn_routing.md`; pull the full
`mdcd_dlvrbl_rpt_ocrnc_rfrnc` (0-88) rows from `CMA-Local-20241014.sql` and map
its content classes to DEMOS `deliverable_type`.

### W2. `current_phase_id` derivation rule recovered (our #3 hard blocker)
`amendment.current_phase_id` / `demonstration.current_phase_id` (NOT NULL, "no
source column" in `derivability_verdicts.yaml`) **can be derived**. PMDA stores
the application lifecycle as **paired started/concluded date columns per phase**
on `mdcd_demo_aplctn` (`phase_1..phase_6`, plus SME / FRT / 3b CMCS/OGC/OMB /
3c OGC/OMB), not a single column.

- **Rule** (`cma-service/app/Services/AppMgmtDemoService.php:240-436`):
  current phase = the **highest-ordered phase whose `*_started_dt` is populated
  AND `*_concluded_dt` is NULL/`0000-00-00`**; if all concluded -> last
  concluded / "Approved"; if none started, the application status code governs.
  Phase order: `received -> SME -> FRT -> 3b(CMCS/OGC/OMB) -> 3c(OGC/OMB) -> Phase4 -> 5 -> 6`.
- The full phase-date column inventory is in `mysql-schema.sql:1589-1639`.

**Action:** encode a `CASE` cascade over the phase-date pairs as the
`current_phase_id` derivation; revisit the `derivability_verdicts.yaml` entries
that currently call this non-derivable.

### W3. `medicaid_id` / `chip_id` provenance confirms our "preserve / mint" decision (#9)
- **Demo number is app-generated and already persisted** in `mdcd_demo_num`:
  format `11-W-00<seq>/<region>` where `<seq>` is a global counter in
  `system_parm` (`sys_parm_name = 'Demonstration Number'`) and `<region>` =
  `geo_ansi_state_rfrnc.rgnl_ofc_cd`
  (`cma-service/app/Repositories/DbAppMgmtDemoRepository.php:169-198`).
  -> **Carry `mdcd_demo_num` verbatim** (matches the committed legacy-preserve
  decision). If Postgres must continue the sequence, seed it from `system_parm`.
- **No `21-W` / CHIP-id generator exists anywhere in `cma`.** `mdcd_scndry_demo_num`
  is captured/entered, never generated. This **confirms** our decision that
  `chip_id` must be minted on the DEMOS side (PMDA carries no CHIP number) and is
  not a data-loss gap.
- **Region crosswalk discovered:** `geo_ansi_state_rfrnc.rgnl_ofc_cd` maps state ->
  CMS regional office (the `/R` segment). New, reusable for parsing/validating the
  `11-W-NNNNN/R` invariant.

### W4. Reusable derivation VIEW `v_demo_status_dtl` (status + amendment/renewal rollup)
`mysql-schema.sql:9519-9521`. Aggregates per demo: `amndmt_cnt` = count of
applications with `mdcd_demo_aplctn_type_cd = 2`, `rnwl_cnt` = count with `= 3`
(both filtered `mdcd_demo_aplctn_stus_cd IN (1,2,4,5,11) AND dltd_ind = 0`), then a
`CASE` deriving an approval descriptor: status 2 + 0/0 -> "Approved";
+ rnwl>0 -> "Approved-Extension Pending"; + amndmt>0 -> "Approved-Amendment Pending";
+ both -> "Approved-Amendment/Extension Pending". ~~**Directly portable** to derive a
demonstration approval/pending descriptor and amendment/extension counts.~~
> **Correction (2026-06-26 re-audit): NOT-APPLICABLE.** DEMOS `demonstration`
> has **no** approval-descriptor column and **no** amendment/renewal-count
> columns (verified against the pinned Prisma DDL + data-dictionary). The
> Approved/Extended/Pending distinction is a **read-time overlay** DEMOS
> recomputes from the migrated effective/expiration dates
> (`determineDemonstrationTypeStatus.ts`; see `sql/04_crosswalks/10_demo_status.sql`).
> There is no target field to populate, so this view is not portable.

### W5. Full RBAC role map + `XX` all-states sentinel (#7, #8, #13)
- **Authoritative role map** (hardcoded in `cma-service/app/Models/Role.php:28-62`,
  matches the 2024 `role_rfrnc` dump):
  `1=Internal Administrator, 2=CMS Project Officer, 3=Third Party Evaluation Analyst
  (external evaluator), 4=State User, 5=CMS Technical Director, 6=Monitoring Lead,
  7=Financial Lead, 8=Monitoring and Financial Lead, 9=DDME Analyst`.
  -> resolves the full `role_rfrnc` tuple, now split into `44/45_system_role` (System)
  + `46/47_demonstration_role` (Demonstration) + `42/43_role_person_type` (person_type).
- **`role_cd = 8` fans out to TWO assignments** (Monitoring Lead + Financial Lead) --
  important for the loader.
- **`XX` is an all-states sentinel** on `user_authrzd_state_acs.geo_ansi_state_cd`
  meaning "access to all states" (`cma-service/app/Models/User.php:99-127`).
  -> confirms our held `person_state` `XX` handling; **do not FK-validate `XX`** against
  `geo_ansi_state_rfrnc`, expand it to all states (mirrors what we already do for CMS users).
- **Demonstration-level roles are wide `*_user_id` FK columns on `mdcd_demo`**
  (`DbDemonstrationRepository.php:3659-3678`, `DemonstrationFactory.php:135-166`):
  `proj_ofcr_user_id`, `bkup_proj_ofcr_user_id`, `tchncl_drctr_user_id`,
  `mntrg_eval_tchncl_drctr_user_id`, `ro_mntrg_lead_user_id`, `ro_fincl_lead_user_id`,
  `state_prmry/scndry/3rd/4th/5th_poc_user_id`, `anlyst_user_id`,
  `anlyst_scndry_user_id`, `mc_anlyst_id`, `hcbs_anlyst_id`. -> **unpivot** into
  `demonstration_role_assignment` rows; resolves the ambiguous "which user is which
  role on a demo" join without going through `user_role_asgnmt`.

### W6. Contact unpivot map (the deferred contact workstream, #8)
The contact workstream (deferred in `pending_approved_decisions.md`) has a concrete
shape: `mdcd_demo_cntct` is a **1:1 satellite of `mdcd_demo`** with fixed wide
per-role name/email/phone columns (`state_mdcd_drctr_*`, `ro_fincl_lead_*`, `sota_*`,
`ro_state_lead_*`) -- free-text contacts, **not** `users` rows
(`mysql-schema.sql:1851-1873`; `DemoContacts.php`; `DemonstrationFactory.php:167-190`).
The DEMOS three-table contact target (`person` + `person_state` +
`demonstration_role_assignment`) is fed by unpivoting these wide columns to
`(demonstration, role_column, email)`, exactly as our deferred plan describes.

---

## 2. Reconciliation vs our existing artifacts (drift / gaps -- action required)

### R1. BUG: `reports/crosswalks/demo_status.csv` (active) is MISSING code 1 = 'Pending'
The active registry CSV starts at code 2. Both the 2024 (`CMA-Local-20241014.sql`)
and 2016 dumps confirm **`mdcd_demo_stus_rfrnc` code 1 = 'Pending'**.
`proposed/demo_status.proposed.csv` already includes it. This is the highest-priority
fix and intersects the held "demo-status code 1 'Pending'" SME blocker (#5) -- the
code is real and must at minimum be represented.
**Full 2024 set:** 1 Pending, 2 Approved, 3 Under Review, 4 Extended,
5 Temporarily Extended, 6 Expired, 7 Extension Pending, 8 Demonstration Hold, 9 Withdrawn.

### R2. BUG: `proposed/document_type.proposed.csv` invents a code 10 not in source
Source `mdcd_demo_aplctn_doc_type_rfrnc` tops out at codes 1-9 + 99
("Other"); there is **no code 10**. Our proposed CSV adds code 10 = "Final Budget
Neutrality Formulation Workbook", which does not exist in the source table.
**Action:** drop or re-source code 10.

### R3. CONFIRMED matches (no action, recorded for sign-off confidence)
- `amendment_status.csv`: all 4 codes match exactly (1 Pending, 2 Approved,
  3 Withdrawn, 4 Disapproved) -- the unsigned proposals are correct.
- `application_type.csv`: exact identity match (1 Demonstration, 2 Amendment, 3 Extension).
- `application_status.csv`: all 11 legacy codes are accounted for, but this is
  an **11 -> 6 collapse** onto the DEMOS `application_status` seed
  (Pre-Submission, Under Review, Approved, Denied, Withdrawn, On-hold), **not an
  identity match** (corrected 2026-06-26 re-audit).
- `sdg_division.csv`: matches `mdcd_chip_div_rfrnc` (0 -> NULL, 2, 3; **no code 1**).
  Note 2024 name for code 3 is "Division of Eligibility and Coverage Demonstrations"
  (the 2017 dump's "Medicaid Expansion" label is stale).
- `state.csv`: all 56 codes present; only label nit -- source `VI = 'US Virgin Islands'`
  vs our `'Virgin Islands'` (code matches).
- `system_role.csv`: codes 1 and 4 (system-level) match; codes 2,3,5-9 are
  demonstration-level (live in `demonstration_role.csv`, column-keyed).

### R4. New region crosswalk available
`geo_ansi_state_rfrnc.rgnl_ofc_cd` (state -> CMS regional office, the `/R` in
`11-W-NNNNN/R`) is not yet captured in `reports/crosswalks/`. Useful for validating
the demonstration-id provenance invariant (Gate 6).

---

## 3. Conflicts requiring SME / verification (do not silently pick a side)

### C1. Deliverable type-code namespace (blocks lifting the BN-routing rule cleanly)
- 2024 dump: `mdcd_dlvrbl_type_rfrnc` = 8 values (1-4 Q1-Q4 Operational Report,
  5/6 Semi-Annual 1/2, 7 Annual Report, 8 Demonstration Specific).
- App routing (`DeliverableController`): branch codes 53/55/57/62/70 -- these fit
  `mdcd_dlvrbl_rpt_ocrnc_rfrnc` (0-88), **not** the 8-value type table.
- **Resolution needed:** confirm whether the app's "deliverable type code" is
  `mdcd_dlvrbl_type_cd` or `mdcd_dlvrbl_rpt_ocrnc_cd` before encoding W1. Pull the
  full `mdcd_dlvrbl_rpt_ocrnc_rfrnc` rows to settle it.

### C2. Deliverable status codes 7 / 9 (our #12 undecided codes)
- 2024 dump (authoritative for the table): **7 = "Overridden", 9 = "In Audit"**;
  also 8 = "Under Review".
- App exclusion comment (`DeliverableService::getDeliverableStatusCodesForFilter`,
  "do not include N/A, in-audit, or under review", excludes `0,8,9`): implies
  **8 = In-Audit, 9 = Under Review**.
- **These disagree on what 9 is.** The 2024 reference table should win, but the app
  comment suggests drift. Both 7 and 9 have **no DEMOS `deliverable_status` analog**
  and stay blocked pending SME -- record both readings.

### C3. Comment-origin (`cmt_orgn_cd`) value set
Models say `I/C/S/R/B/A` (Internal/CMS/State/Resubmission/BN-resubmission/Reviewer);
Services say `S/C` drive state-vs-CMS file routing with `B` as a BN marker. Reconcile
the full domain before building the comments public/private routing (workflow #6 child).

### C4. Signature level OGD (our existing PRESERVE-OGD vs force-OA conflict)
Source `mdcd_demo_aplctn_sgntr_lvl_rfrnc`: `1=OA, 2=OCD, 3=OGD, 4=DD` (DD is
`dltd_ind=1`, deleted; no expanded text for the abbreviations exists in any artifact).
This does **not** resolve the already-flagged conflict in `notes.md` (force 'OA' on
demonstration vs preserve OGD); it only confirms the source code set. Still SME-gated.

---

## 4. Per-anchor resolution scorecard

| # | Anchor (open blocker) | Result from cma | Where |
|---|---|---|---|
| 1 | `deliverable_type_id` BN routing | **Rule recovered** (W1) + content taxonomy candidate (`rpt_ocrnc` 0-88) | DeliverableController, DeliverableService |
| 2 | amendment_status crosswalk | **Confirmed** 4 codes (R3); transitions are direct writes + history, no state machine | 2024 dump; DbDemonstrationRepository |
| 3 | `current_phase_id` (no source col) | **Derivation rule recovered** (W2) | AppMgmtDemoService; mysql-schema phase columns |
| 4 | signature_level OGD/OA/OCD/DD | Codes confirmed `1 OA/2 OCD/3 OGD/4 DD`; conflict still SME-gated (C4) | 2024 dump |
| 5 | demo_status code 1 'Pending' | **Confirmed real** = 'Pending'; our active CSV bug (R1) | 2024 + 2016 dumps |
| 6 | document_type multi-source fan-in | Codes 1-9/99 recovered; our proposed code 10 is bogus (R2); template-file FK + `cp:category` parse | 2024 dump; MonitoringReportingToolService |
| 7 | full `role_rfrnc` + code 3 | **Full 1-9 map recovered** (W5); code 3 = external evaluator | Role.php; 2024 dump |
| 8 | contact workstream pivot | **Unpivot map recovered** (W6) | mysql-schema; DemonstrationFactory |
| 9 | medicaid_id / chip_id | **Demo-number generator found; 21-W confirmed absent** (W3) | DbAppMgmtDemoRepository |
| 10 | sdg_division / `mdcd_chip_div_cd` | **Confirmed match** (R3), source = `mdcd_chip_div_rfrnc` | 2024 dump; CMCSDivision.php |
| 11 | BN semi-annual (5/6 + ind) | Cadence model recovered (W1); `bdgt_ntrlty_ind` at demo + deliverable grain | DeliverableService; mysql-schema |
| 12 | deliverable_status 7/9 | Values recovered but **conflicting labels** (C2); both blocked | 2024 dump; DeliverableService |
| 13 | application_type | **Confirmed match** (R3) | 2024 dump; AppMgmtDemoController |

---

## 5. Reusable SQL (already-covered / not-applicable)

> **Reclassified (2026-06-26 re-audit):** none of these is an actionable "lift
> candidate". Each is either already covered by an existing repo artifact or has
> no DEMOS target. Verdicts added in the last column.

| View | Path | What it derives | Verdict |
|---|---|---|---|
| `v_demo_status_dtl` | `mysql-schema.sql:9519-9521` | per-demo amendment/renewal counts + approval descriptor `CASE` | **NOT-APPLICABLE** -- no DEMOS descriptor/count column; the Approved/Extended/Pending distinction is a read-time overlay DEMOS computes from migrated dates (`determineDemonstrationTypeStatus.ts`). See W4 correction. |
| `v_app_mgmt_demo_types` | `mysql-schema.sql:9467-9504` | program-type code -> display title (AL, AC, BHP, BH, BE, CHIP, AHEAD, DSRIP, SUD, ... OTHR) over `mdcd_pendg_*_pgm_dtl` | **REDUNDANT** -- the code->title vocabulary is already (more completely) in `reports/pgm_dtl_tag_mapping.csv`, loaded by `sql/04_crosswalks/46_pgm_dtl_tag.sql`. |
| `v_demo_mgmt_demo_types` | `mysql-schema.sql:9506` | approved-demo program-type rollup | **REDUNDANT** -- same tag map (`pgm_dtl_tag_mapping.csv`) already unifies base + pending tables. |
| `v_demo_mgmt_mrt_demo_types` | `mysql-schema.sql:9506-9508` | SUD monitoring protocol/metric/reporting-tool indicators + start dates per demo (joins `mdcd_sud_pgm_dtl` + `mdcd_demo`) | **NOT-APPLICABLE** -- MRT is out-of-scope (workflow #9); the dumped view rows are all-zero indicators anyway. |

Deliverable due-date seeding logic (not a view, but a portable algorithm):
`DeliverableService.php:873-1000` loops `addMonths(cadence)` from
`state_prfmnc_yr_strt_dt` to `..._end_dt`, subtracting 1 day for quarterly/annual
period-ends; `due_date` fallbacks already mirror our loader
(`dlvrbl_due_dt` -> `dlvrbl_prd_strt_dt + dlvrbl_days_due_num` -> `dlvrbl_due_dt_chg_dt`).
> **REDUNDANT (2026-06-26 re-audit):** this algorithm already ran inside PMDA and
> persisted its output to `mdcd_dlvrbl.dlvrbl_due_dt`, which the loader carries
> verbatim (`sql/10_stg/28_deliverable_resolved.sql`). Re-deriving it would only
> risk drift from the persisted source of truth.

---

## 6. Per-directory summary

| Dir | Value | Summary |
|---|---|---|
| `db/cma-tables` + `db/migrations_schema` | **High** | DDL source-of-truth; reference-table structure; 5 derivation views; phase-date columns; no triggers/procs/FKs. |
| `db/*.sql` dumps | **High** | `CMA-Local-20241014.sql` = authoritative 2024 values for all 68 `*_rfrnc` tables. (`.sql.gz` not inspected -- see Open items.) |
| `cma-service/app/Models` | **High** | Derivation lives in `Models/Factories/*` (no Eloquent accessors/casts). Role map, `XX` sentinel, demo-team `*_user_id` role columns, file-routing rules, `cmt_orgn_cd` set. |
| `cma-service/app/Services` + `Repositories` | **Highest** | BN-routing rule (W1), current-phase rule (W2), demo-number generator (W3), deliverable status `CASE`, role/grant-level rules, comment-origin routing. |
| `etl/` | **Low** | Talend reference-table loaders; verbatim Excel->staging column renames only. No code translation. Yields a catalog of `*_RFRNC` tables + the `ETL_PROC_RSLT_IND` staging-status convention. **Security:** Talend-obfuscated DB passwords are committed in `.item` files -- do not propagate; rotate if hosts live. |
| `pipelines/` | **None** | Only Jenkins CI/CD deploy Groovy. No SQL/crosswalks. |
| `ml/` | **Low** | 2018 NLTK rule-based STC docx parser; cadence-based deliverable detection (confirms legacy = cadence, the approach DEMOS rejects). No trained model, no content-type classifier, no labeled data. |
| `solr/` | **Low** | Only `schema.xml` (mostly stock). One custom document-search field block (`demoId/demoNumber/sectionId/fileId/stateCode<->stateName`); no DataImportHandler SQL, no enum/facet value lists. |

---

## 7. Follow-up action items (ticket-style)

1. **[crosswalk-bug, P1]** Add `mdcd_demo_stus_rfrnc` code 1 = 'Pending' to the
   active `reports/crosswalks/demo_status.csv` (R1); reconcile with the held #5 SME
   decision.
2. **[crosswalk-bug, P1]** Remove/re-source the invented code 10 from
   `proposed/document_type.proposed.csv` (R2).
3. **[deliverable, P1]** Resolve the type-code namespace conflict (C1) by pulling the
   full `mdcd_dlvrbl_rpt_ocrnc_rfrnc` (0-88) rows; if it is the content taxonomy, map
   its classes to DEMOS `deliverable_type` and close
   `proposed/deliverable_type_bn_routing.md` using rule
   `is_bn = (bdgt_ntrlty_ind=1 AND code IN (57,70))`.
3. **[derivation, P1]** Encode the `current_phase_id` derivation (W2) as a `CASE`
   cascade over `mdcd_demo_aplctn` phase-date pairs; update the two
   `derivability_verdicts.yaml` entries that mark it non-derivable.
4. **[derivation, P2]** Lift `v_demo_status_dtl` (W4) into the status-derivation step;
   validate counts against `reports/derivability_*`.
5. **[rbac, P2]** *(Largely DONE.)* The unified `40_role.sql`/`41_role_check.sql`
   was removed in favor of the per-grant-level split: `44/45_system_role` +
   `46/47_demonstration_role` (live, registry-wired). The demo-team `*_user_id`
   columns are already unpivoted into `demonstration_role_assignment`. Remaining:
   the `role_cd=8` fan-out (two assignments) and the `XX`-all-states expansion;
   plus SME ratification of `system_role.csv` / `demonstration_role.csv`.
6. **[contact, P2]** Use the W6 unpivot map for the deferred contact workstream
   (`mdcd_demo_cntct` wide columns + `mdcd_demo` POC `*_user_id` columns).
7. **[crosswalk, P2]** Capture `geo_ansi_state_rfrnc.rgnl_ofc_cd` (state->region) as a
   crosswalk for the `11-W-NNNNN/R` invariant (R4).
8. **[program-type, P3]** Extract the `v_app_mgmt_demo_types` code->title list into a
   `program_type` crosswalk feeding `pgm_dtl_tag_mapping.csv`.
9. **[sme, P3]** Take to SME: deliverable_status 7/9 label conflict (C2),
   `cmt_orgn_cd` domain (C3), signature-level OGD (C4), and the blocked
   no-DEMOS-target codes (role 3 external evaluator, doc-type 6 Temporary Extension
   Letter, deliverable confirmation statuses, demo-type OTHR).
10. **[security, P3]** Flag/rotate the Talend-committed DB credentials in `cma/etl`.

---

## 8. Open items / not inspected

- `cma/db/cma_dev_copy_cleaned_trunc.sql.gz` (24 MB, gzip) was **not** inspected --
  the delegated session could not run `zcat`. It almost certainly mirrors the 2024
  dump; verify in an interactive session if a divergence is suspected:
  `zcat cma/db/cma_dev_copy_cleaned_trunc.sql.gz | grep -a 'INSERT INTO `..._rfrnc`'`.
- Expanded English meanings of the signature-level abbreviations (OA/OCD/OGD/DD) are
  **not stored anywhere** in cma (code or data).
- `cma-service/python/`, `cma-service/mrt/`, `cma/bn/`, `cma/scripts/`,
  `cma/stc-templates/` were out of the agreed scope; `cma/bn/` in particular may hold
  additional budget-neutrality logic if the BN workstream needs it.
