# Pending / approved unification decisions

## Invariant

Every `demos_app.demonstration.id` in DEMOS PG originates from PMDA
(`mdcd_demo` or `mdcd_pendg_demo`) via `migration._id_map_*`. New
demonstration IDs are created post-migration by the DEMOS backend and
are out of scope for this migration. PMDA-issued demonstration project
numbers conform to `^11-W-[0-9]{5}/(10|[1-9])$` -- `11-W-NNNNN/R`,
where `N` is a single digit (5 digits total) and `R` is the CMS Region
number 1-10. Values containing the substring `test` (case-insensitive)
are auto-dropped silently; all other malformed values (including NULL
where required) are excluded and flagged for SME review in the per-run
filter report. The invariant is enforced at Gate 6 by
`sql/99_parity/10_demonstration_id_provenance.sql`.

## Decision table

For every MySQL `mdcd_<x>` / `mdcd_pendg_<x>` pair, record the rule used to collapse them into the DEMOS `application` + `demonstration` flow. Default rule: collapse into a single `application` row keyed by demonstration identity; status flow captures lifecycle. Document exceptions here.

| Pair | DEMOS target | Rule | Tie-break | Notes |
|---|---|---|---|---|
| `mdcd_demo` / `mdcd_pendg_demo` | `application` + `demonstration` | **BUILT (2026-07-14).** "Approved wins": a pending demo whose project number matches a PMDA-valid approved demo FOLDS into that approved demonstration (`stg._pendg_demo_fold`); a pending demo with no approved counterpart loads as its own 'Under Review' demonstration (`sql/20_app/31_pending_demonstration.sql`) IF it has a project number; a no-project-number pending demo is held back non-gating (logged `_parity_pending_approved` category `pending_only_deferred`). | Approved wins; then, among orphans sharing a medicaid_id, the RED-4 region-suffix/lowest-legacy-id winner (loser held, logged `_parity_pending_demonstration_held`) | Pending demos carry no status column (uniformly 'Under Review') and no secondary-number column (chip_id always NULL). |
| `mdcd_demo_aplctn` / *(none)* | `application` | 1:1 | n/a | Already the application table in source |
| `mdcd_demo_amndmt` / `mdcd_pendg_demo_amndmt` | `amendment` | Collapse | Approved wins | |
| `mdcd_demo_rnwl` / `mdcd_pendg_demo_rnwl` | `extension` | Collapse | Approved wins | Renewals map to extensions in DEMOS |
| `mdcd_demo_cntct` / `mdcd_pendg_demo_cntct` | contact-only `person` + `person_state` + `demonstration_role_assignment` | **DEFER (contact workstream):** the source is a wide per-role model (`state_mdcd_drctr_email_adr`, `ro_fincl_lead_email_adr`, `sota_email_adr`, ...), not a long `(demo, role, email)` table -- there is no single `cntct_email` column to key on. The target is the three-table contact shape (a `person` per distinct contact email with no `users` row, its `person_state` grants, and a `demonstration_role_assignment` per role column); see `docs/specs/pmda-cross-cutting-derivation-spec.md` §5. The earlier `demonstration_role_assignment` + `person` shorthand omitted `person_state` and is superseded by this row. | Approved wins | Pivot the wide email columns to `(demonstration, role_column, email)` before resolving `person`. |
| `mdcd_*_pgm_dtl` / `mdcd_pendg_*_pgm_dtl` | `demonstration_type_tag_assignment` | Approved side BUILT (`21_app_associative/10`/`11` + `pgm_dtl_tag_mapping.csv`). Pending side BUILT (2026-07-14): fold-aware fixed-tag loader `21_app_associative/12` and free-text "Other" loader `21_app_associative/13` resolve the parent via `stg._pendg_demo_fold.demo_uuid` (a folded pending demo's tags attach to its approved counterpart), driven by `crosswalk_pendg_pgm_dtl_tag` (`04_crosswalks/47`) whose `reports/pgm_dtl_tag_mapping_pending.csv` is now **POPULATED** (68 rows derived mechanically from the filled base by prefix-swap `mdcd_`->`mdcd_pendg_`; no new SME judgment). Parity `99_parity/55` logs held free-text "Other" rows (non-gating) and fail-closes on any mapped-but-unseeded tag. | Approved wins (fold) | Templated transform mirroring the base 10/11/54 trio as pending 12/13/55. |
| `mdcd_dlvrbl` / *(none)* | `deliverable` | 1:1 | n/a | |
| `mdcd_dlvrbl_paper` / *(none)* | `deliverable` (paper sub-type) | 1:1 | n/a | Discriminator via `deliverable_type_id` |

## Workflow-level scope dispositions

PMDA is workflow-centric (see `pmda_highlights_reel.md`, "Most Important
Migration Workflows" 1-11). The decision table above records *entity* rules;
this section records the *disposition* of each numbered source workflow so a
reviewer can see, at a glance, what is built, what is deliberately deferred,
and what is out of scope. `BUILT` = a live `sql/20_app`/`sql/23_app_derived`
loader exists on `main` and populates the target; `PARTIAL` = core built, named
remainder deferred; `DEFERRED` = planned or scaffolded-but-not-yet-loading
(named owner/sequence/blocker); `OUT-OF-SCOPE` = not migrated, reason recorded.
Scope coverage is surfaced non-gating at the parity gate by
`sql/99_parity/30_scope_coverage.sql`.

| # | PMDA workflow | Disposition | Detail |
|---|---|---|---|
| 1 | Reference data | **BUILT** | `sql/04_crosswalks/*` + reference seeds; numeric/code values mapped via reviewed crosswalks, never blind-remapped. |
| 2 | Users, roles, state access | **BUILT** | `users`, `person`, `person_state`, `system_role_assignment` (System roles 1/4), `demonstration_role_assignment`. Inactive/deleted users still loaded for FK integrity; active-users coverage is parity check 11. |
| 3 | Approved demonstrations | **PARTIAL** | Core `demonstration` (+ `application`) BUILT, incl. `sdg_division_id` and the Approved-completeness hold-back (parity check 13). **Application approval date: BUILT** -- `20_app/36_application_date.sql` loads `mdcd_demo.aprvl_dt` as an `application_date` row (date_type 'Application Approval Date') for each loaded demonstration. **Amendments: BUILT** -- `20_app/35_amendment.sql` loads each PMDA-valid amendment (`10_stg/30_amendment_resolved`, id map `05/16`+`10_stg/29`) as an `application`+`amendment` IS-A pair. Three decisions were resolved in-session (recorded in `notes.md`/`_review.md` P2; SME-ratify): `64_amendment_status` values inlined (1->Under Review, 2->Approved, 3->Withdrawn, 4->Denied); `current_phase_id` status-derived (Approved->Approval Summary, Under Review->Review, Withdrawn/Denied->Concept); `signature_level_id` = OA/OCD-else-NULL (OGD/DD barred on amendments by `amendment_signature_level_check` + DEMOS `AMENDMENT_SIGNATURE_LEVELS`). Amendments whose only parent is a pending demo now resolve fold-aware (`10_stg/30` LEFT JOINs `stg._pendg_demo_fold`): they load against the pending demo's own 'Under Review' demonstration (orphan) or its approved counterpart (folded), and the 162 statusless pending-track amendments are assigned 'Under Review' by the loader; only amendments whose resolved parent never loaded (held-back/no-project pending, or a held-back approved parent) are excluded, logged non-gating by parity check 19 (`99_parity/52`). **medicaid.gov 1115 parity: BUILT** -- `extract-facts` command in `../document-ocr` scrapes medicaid.gov demonstration facts (State/Name/Status/Approval/Effective/Expiration), fuzzy-matches to migrated demos, and emits a snapshot CSV; parity check 20 (`99_parity/53`) cross-checks the snapshot against the migrated target (non-gating). **Extensions/renewals: DEFERRED post-MVP** (`70_renewal_status_deferred.sql`; DEMOS has no renewals concept). **Also deferred:** status history, performance-period history, comments, contacts (contact workstream above), final-decision info, site visits, post-award forums, authority documents. |
| 4 | Programs and demo types | **BUILT** | `demonstration_type_tag_assignment` BUILT from the 10-table `pgm_dtl_tag_mapping.csv` (approved fixed-tag `21_app_associative/10` + free-text "Other" `21_app_associative/11`). Pending track BUILT (2026-07-14): `04_crosswalks/47_pendg_pgm_dtl_tag.sql` + `reports/pgm_dtl_tag_mapping_pending.csv` (**POPULATED**, 68 rows derived mechanically from the filled base by prefix-swap; the source-absent `mdcd_pendg_fincl_pool_pgm_dtl` is dropped) + registry entry + fold-aware fixed-tag loader `21_app_associative/12` and free-text "Other" loader `21_app_associative/13`, both resolving the parent via `stg._pendg_demo_fold`; parity `99_parity/55` logs held free-text "Other" rows (non-gating) and fail-closes on any mapped-but-unseeded tag. **Deferred:** the base-mapping expansion to any additional `*_pgm_dtl` tables beyond the current 10 (an SME task); the pending CSV auto-inherits that expansion via the same prefix-swap. See `docs/specs/pmda-cross-cutting-derivation-spec.md` Table 1. |
| 5 | Waiver and expenditure authorities | **DEFERRED** | No `demos_app` loader yet. Waiver/expenditure/not-applicable-expenditure authority families + demo-link tables, preserving expiration dates, deleted flags, and section/title/category relationships. **SME:** confirm the DEMOS target model before build. |
| 6 | Deliverables | **DEFERRED (blocked)** | `deliverable` loader scaffold present (`20_app/40_deliverable.sql`) but currently a **no-op**: it RETURNs before INSERT while the `deliverable_type` crosswalk is unauthored -- the target requires `deliverable_type_id` NOT NULL, and `deliverable_type` is deliberately **not authored, gated on the `reports/crosswalks/proposed/deliverable_type_bn_routing.md` investigation** (BN routing is not a static code map). Also blocked on `cms_owner_user_id`/`cms_owner_person_type_id` + `demonstration_status_id` derivations. `deliverable_status` (50/51) is the one ready crosswalk (tuple mapping inlined, fail-closed on undecided codes 7/9). Children hang off the (blocked) loader: status history; comments by `cmt_orgn_cd` -> a `comment` loader is present (`20_app/50_comment.sql`, routing to `private_comment`/`public_comment` per `docs/sme/explanation-comments-routing.adoc`) but a no-op downstream of the blocked deliverable; uploaded files -> `document` (blocked on the `document_type` multi-source fan-in, `_review.md` P4); paper records; due-date-change requests -> `deliverable_extension` (proposed, not live); `deliverable_acptnc_status`/`deliverable_cnfrmtn_status` (overlap / no target -> likely drop). |
| 7 | Application management / pending demos | **BUILT (2026-07-14)** | Pending demos now load as their own 'Under Review' `application`+`demonstration` when they have a project number and no approved counterpart (`sql/20_app/31_pending_demonstration.sql`, staged by `10_stg/23_pendg_demo_fold` + `10_stg/24_pending_demonstration_resolved`); pending demos that fold into an approved counterpart are represented by that approved row; no-project-number pending demos are held back non-gating and reconciled at Gate 4 against `reports/parity_accepted/pending_approved_deferrals.csv` (the SME-signed reversal record). Pending amendments follow workflow 3 (fold-aware, 162 statusless -> 'Under Review'); pending program-detail tags now load fold-aware from the populated pending mapping (workflow 4). **Still deferred:** pending extensions (renewals deferred post-MVP), application comments, federal decisions, application documents. |
| 8 | Budget Neutrality | **PARTIAL** | JSONB shape is enforced by the BN oracle (parity check 3) on the `budget_neutrality` payload. **Out-of-scope here:** the file-backed + parsed BN corpus (template/workbook files, parsed demo years, MEGs, populations, PMPM/cost, warnings, totals, dashboard rows) -- DEMOS owns BN ingestion. Semi-annual BN type (5/6 + `bdgt_ntrlty_ind=1`) is an open SME blocker. |
| 9 | Monitoring Reporting Tool | **OUT-OF-SCOPE (SME-gated)** | File-backed + parsed workbook/report/protocol data; DEMOS owns MRT ingestion. Demo-level MRT flags/start dates ride along on `mdcd_demo`. Revisit only if SMEs require historical MRT content in DEMOS. |
| 10 | STC documents | **OUT-OF-SCOPE (SME-gated)** | Document/search/cart workflow around Special Terms and Conditions. Migrate only if DEMOS needs STC search, generated docs, bookmarks, or cart history. |
| 11 | Email, reports, help/support, admin | **OUT-OF-SCOPE** | Notification + operational/admin machinery; the source tables are already in `reports/narrative/drop_list.md` (`DROP_EMAIL`, `DROP_OPS`). New app handles notifications/auth audit/logging itself. |

**Re-scope triggers** mirror `reports/narrative/drop_list.md`: promote a `DEFERRED`/`OUT-OF-SCOPE`
workflow when the DEMOS spec adds a feature whose data lives in it, an SME
identifies required historical content, or audit/compliance requires it.

## Open decisions (SME sign-off required)

### D1. demo-status code 1 "Pending" -- the dress-rehearsal blocker

**Status:** RESOLVED (2026-06-26); SME-CONFIRMED (2026-07-10). The SME mapped
code 1 'Pending' -> 'Under Review' in `reports/crosswalks/demo_status.csv`, and
on 2026-07-10 confirmed 'Under Review' over 'Pre-Submission' ("load as Under
Review and see"; verify the auto-calculated federal comment period behaves).
This is the "real DEMOS status" path: 'Under Review' is a seeded
`application_status`, so the `NOT NULL` `demonstration.status_id` is satisfied
and a mdcd_demo carrying code 1 now loads as an Under Review demonstration. No
nullable-sentinel/loader changes were needed (those would have been required
only for the NULL-sentinel option). The options below are retained for
provenance.

**Scope update (SME 2026-07-10):** pending demonstrations (from
`mdcd_pendg_demo`, their pending amendments and pending program details) are now
**in scope to migrate** -- Option B in full, including the pending-application
loader that was previously deferred (workflow 7 below). **BUILT (2026-07-14)** in
the `migration/pending-demonstrations` branch: `10_stg/23_pendg_demo_fold` +
`10_stg/24_pending_demonstration_resolved` + `20_app/31_pending_demonstration`
load orphan pending demos (with a project number) as 'Under Review'
demonstrations, fold pending demos into their approved counterpart, and hold
back no-project-number pending demos non-gating. The 162 statusless pending
amendments (see `notes.md` 2026-06-30 dress-rehearsal probe) take status
'Under Review' to mirror their parent pending demo (assigned in
`20_app/35_amendment.sql`). Pending program-detail tags now load fold-aware
from the populated pending mapping (derived from the filled base; workflow 4).

**Context.** `mysql_raw.mdcd_demo.mdcd_demo_stus_cd` includes code `1`
("Pending"). `reports/crosswalks/demo_status.csv` maps codes 2-9 but
deliberately withholds code 1. `sql/04_crosswalks/11_demo_status_check.sql`
fails closed (`RAISE EXCEPTION`) on any source code absent from the crosswalk,
so a snapshot that contains even one code-1 demo aborts `migrate crosswalks`
**before** any loader or parity runs. Per workflow 7 above, pending-only
demonstrations (a pending demo with no approved counterpart) are deferred
post-MVP; an approved demo never sits on code 1. So the question is purely:
how do we represent code 1 so the fail-closed check passes without inventing a
demonstration that we are not migrating?

**Options:**

| Opt | Decision | Cost | Effect |
|---|---|---|---|
| **A (recommended)** | Treat Pending as an unmapped **sentinel**: add `1,Pending,,<note>` to `demo_status.csv` (NULL `demos_text_id`), mirroring the `sdg_division` 0 and `signature_level` 0/4 sentinels. | One CSV row. No loader work. | Check passes (code present); pending-only demos resolve to a NULL status and are not loaded as demonstrations, exactly as workflow 7 already defers. Forcing function preserved for codes 2-9. |
| **B** | Pending **is** a real DEMOS status: pick a target (`application_status` candidates: `Pre-Submission`, `Under Review`, or a `Pending` seed) **and** build the deferred pending-application loader (workflow 7). | New loader + crosswalk + tests; expands MVP scope. | Pending demos migrate as applications. Only choose if SMEs require pending demos in the first cutover. |
| **C** | Leave the data alone, **narrow the check** so it asserts only codes on demos that survive the staging filter (deferred pending-only codes stop gating). | SQL change to `11_demo_status_check.sql` + apply-twice test. | Unblocks without a crosswalk row, but weakens the forcing function and still needs the SME to confirm pending-only demos are out of scope. Not preferred vs A. |

**Recommendation:** **Option A** unless SMEs decide pending demonstrations must
be migrated in the first cutover, in which case **Option B**. Either way the
choice is the SME's; record it below and the engineer applies it.

- [ ] **A** -- sentinel NULL   - [x] **B** -- map to a real status ('Under Review')   - [ ] **C** -- narrow the check
- Decided by: SME (CSV-authored)  Date: 2026-06-26  Confirmed: SME 2026-07-10 ('Under Review' over 'Pre-Submission'; pending demos in scope to migrate)

### D2. Workflow-7 reversal record (pending demos now load)

**Status:** BUILT (2026-07-14); SME sign-off PENDING. The 2026-07-10 answer
reversed the long-standing "defer all pending-only demos" rule (D1 context, and
the former `no_approved_counterpart` deferrals). Those pending demos now load as
'Under Review' demonstrations; only no-project-number pending demos remain
deferred. Because this reverses a previously SME-signed deferral set, the
reversal is recorded for explicit sign-off in
`reports/parity_accepted/pending_approved_deferrals.csv`: its header documents
the reversal and the residual deferred set is now only the `no_project_number`
rows. Gate 4 stays PENDING (not GREEN) until that file is signed
(`# Status: SIGNED` + Reviewer + Date), which is the forcing function for the
SME to ratify the reversal.

- [ ] Reversal reviewed and the residual no-project-number deferrals accepted.
- Decided by: ____________  Date: __________  (sign `pending_approved_deferrals.csv`)

## Sign-off

- Reviewer: SME
- Date: 2026-07-10
