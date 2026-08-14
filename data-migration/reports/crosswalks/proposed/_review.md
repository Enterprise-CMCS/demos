# Crosswalk proposals — SME review & sign-off

Review-ready draft mappings from legacy MySQL reference codes to DEMOS
target values, generated from the captured reference data
(`reports/reference_data/*.csv`) and the Prisma-seeded DEMOS domains
(`state/prisma_ddl/<sha>.sql`). Each value domain is pre-filled with a
proposed mapping and a confidence level so SMEs confirm or edit rather
than author from a blank sheet.

## Not wired into the pipeline

- Proposals live under `reports/crosswalks/proposed/` and are not read by code.
- Live crosswalk SQL: `20_state.sql` (state identity map) and
  `10_demo_status.sql` are both populated (demo_status code 1 resolved to
  `Under Review` per decision D1, see `reports/narrative/pending_approved_decisions.md`;
  sign-off below = approved). Following the SME review, scaffolding tables
  + checks now also exist for `30/31_signature_level`,
  `50/51_deliverable_status`, `64/65_amendment_status`, and
  `70_renewal_status_deferred` (a documented no-op). These define the
  multi-column contracts; **all crosswalk values are now CSV-authored** in
  `reports/crosswalks/<name>.csv` and loaded via `registry.yaml` (the SQL files
  are DDL only). A check stays RED until its CSV carries the confirmed rows.
  **Role split (2026-06-26):** the unified
  `40/41_role` scaffold + the `role.proposed.csv` / `contact_type.proposed.csv`
  proposals were **removed**, superseded by the per-grant-level split that is
  already LOADED -- `44/45_system_role` (`system_role.csv`) +
  `46/47_demonstration_role` (`demonstration_role.csv`), plus the
  self-contained `42/43_role_person_type` (`role_person_type.csv`).
  **amendment_status (2026-06-26):** `64_amendment_status` is loaded from
  `amendment_status.csv` alongside the other live crosswalks above
  (`demo_status`, `signature_level`, `deliverable_status`); its 4 proposed
  values were accepted in-session to unblock the amendment loader `20_app/35`,
  but formal sign-off in the table below is still pending (SME-ratify).
  `deliverable_type` SQL is deliberately not authored yet -- it is gated on
  `deliverable_type_bn_routing.md`.
- Data-backed identity maps are populated (like `state`), not gated on SME
  judgment, because the source `*_rfrnc` name IS the DEMOS seed `id` verbatim:
  `60/61_application_type` (`mdcd_demo_aplctn_type_cd` -> `application_type`) and
  `62/63_sdg_division` (`mdcd_chip_div_cd` -> `sdg_division`, with the legacy
  `0`/`-- Please Select --` sentinel -> NULL). Their checks fail closed on any
  future unmapped source code.
- **application_status + document_type loaded (load-only, 2026-06-26).**
  `12/13_application_status` (`application_status.csv`) and
  `66/67_document_type` (`document_type.csv`, application subset) are now DDL +
  `registry.yaml` + fail-closed check, alongside the other live crosswalks.
  Neither has a consumer yet: `application.status_id` is still demo_status-derived
  in `20_app/30_demonstration.sql` (so `crosswalk_application_status` is loaded
  but unconsumed, exactly like `crosswalk_application_type` -- which is also
  loaded + checked but unconsumed, `30_demonstration.sql` uses the constant
  `'Demonstration'`); `crosswalk_document_type` waits on the deferred
  document/uploaded-files loader, so its completeness half stays inert until
  `mysql_raw.mdcd_demo_aplctn_doc` loads.
  (`demo_status`, `signature_level`, `role_person_type`, `deliverable_status`,
  `amendment_status`, `application_status`, and `document_type` are the
  load-ready CSVs in `reports/crosswalks/`.)
- `renewal_status` carries an unwired load CSV (`renewal_status.csv`) that is
  not in `registry.yaml` and has no `sql/04_crosswalks` file; it is deferred
  (no-op loader).
- `demonstration_type` stays a direct-join loader
  (`21_app_associative/20_reference_demonstration_type.sql`) and intentionally
  has **no** `crosswalk_demonstration_type` table; its mapping lives only as
  provenance in `proposed/demonstration_type.proposed.csv`.
- Completeness checks (e.g. `11_demo_status_check.sql`) skip until the source
  table loads, then fail on any unmapped code. They stay RED until the confirmed
  values are present in the load CSV. This is intentional: filling the
  crosswalk with guesses would turn the check green and remove the forcing
  function, since it fails only on unmapped codes, not mis-mapped ones.

## How to sign off

1. For each `*.proposed.csv`, review `proposed_demos_text_id` against
   `notes`/`confidence` and put the agreed value in `sme_confirmed_value`
   (or correct the proposal).
2. Leave undecided rows (`confidence = none`) blank until the business
   decision is made; do not invent a target to clear them.
3. When a crosswalk is fully confirmed, transcribe `sme_confirmed_value`
   into the load-ready `reports/crosswalks/<name>.csv` (header = the crosswalk
   table columns) and add an entry to `reports/crosswalks/registry.yaml`
   (`table`, `csv`, `columns`). The crosswalks phase COPYs it; no inline
   `INSERT`. Only then does its check go green.
   - Note: several crosswalks are no longer single-target after the SME review.
     `deliverable_status` carries `(status_id, due_date_type_id,
     expected_to_be_submitted, emit_extension_status)`. Roles split into
     `crosswalk_system_role` (keyed by `legacy_role_cd`) and the column-keyed
     `crosswalk_demonstration_role` (keyed by `(source_table, source_column)`,
     carrying `role_id, grant_level_id, is_primary, treat_zero_as_null`), with
     `person_type_id` validated via `crosswalk_role_person_type`. Transcribe all
     target columns, not just a single `demos_text_id`.

## Confidence legend

- **high**: legacy name maps to a DEMOS value verbatim or near-verbatim; unlikely to change.
- **medium**: strong semantic match with a small judgment call.
- **low**: plausible best-effort; DEMOS has no clean equivalent.
- **none**: no DEMOS target exists; needs a business decision first.
- **n/a**: legacy sentinel (e.g. `N/A`, `-- Please Select --`) maps to `NULL`.

## Proposals at a glance

| Crosswalk (file) | Source rfrnc (count) | DEMOS target domain | high | med | low | none | n/a |
|---|---|---|---|---|---|---|---|
| **P1** demo_status | `mdcd_demo_stus_rfrnc` (9) | `application_status` (+ date overlay) | 4 | 5 | 0 | 0 | 0 |
| **P1** signature_level | `mdcd_demo_aplctn_sgntr_lvl_rfrnc` (5) | `signature_level` (OGD preserved; CHECK widening) | 3 | 0 | 0 | 1 | 1 |
| **P2** application_status | `mdcd_demo_aplctn_stus_rfrnc` (11) | `application_status` | 8 | 2 | 1 | 0 | 0 |
| **P2** application_type | `mdcd_demo_aplctn_type_rfrnc` (3) | `application_type` (data-backed, LOADED) | 3 | 0 | 0 | 0 | 0 |
| **P2** sdg_division | `mdcd_chip_div_rfrnc` (3) | `sdg_division` (data-backed, LOADED) | 2 | 0 | 0 | 0 | 1 |
| **P2** amendment_status | `mdcd_demo_amndmt_stus_rfrnc` (4) | `application_status` | 2 | 2 | 0 | 0 | 0 |
| **P2** renewal_status | `mdcd_demo_rnwl_stus_rfrnc` (4) | DEFERRED post-MVP | 0 | 0 | 0 | 4 | 0 |
| **P3** deliverable_status | `mdcd_dlvrbl_stus_rfrnc` (17) | `deliverable_status` + `due_date_type` + `expected_to_be_submitted` (+extension) | 8 | 6 | 0 | 2 | 1 |
| **P3** deliverable_type | `mdcd_dlvrbl_type_rfrnc` (8) | `deliverable_type` (BN routing under investigation) | — | — | — | — | — |
| **P3** deliverable_cnfrmtn_status | `mdcd_dlvrbl_cnfrmtn_stus_rfrnc` (3) | (no enum) | 0 | 0 | 0 | 2 | 1 |
| **P3** deliverable_acptnc_status | `mdcd_dlvrbl_acptnc_stus_rfrnc` (7) | `deliverable_status` (overlap) | 0 | 6 | 0 | 0 | 1 |
| **P3** deliverable_extension_status | `mdcd_due_dt_chg_rqst_dtrmntn_rfrnc` (5) | `deliverable_extension_status` | 2 | 3 | 0 | 0 | 0 |
| **P3** deliverable_extension_reason_code | `mdcd_state_user_due_dt_chg_rsn_rfrnc` (5) | `deliverable_extension_reason_code` | 3 | 1 | 0 | 0 | 1 |
| **P4** document_type | `mdcd_demo_aplctn_doc_type_rfrnc` (11) | `document_type` (application subset; multi-source fan-in) | 8 | 1 | 1 | 1 | 0 |
| **P5** contact_type | `mdcd_demo_cntct_type_rfrnc` (6) | `role` (Demonstration) + grant/person_type | 4 | 0 | 2 | 0 | 0 |
| **P5** role | `role_rfrnc` (9) | `role` + grant_level + assignment table + person_type | 4 | 0 | 3 | 2 | 0 |
| **P6** demonstration_type | `mdcd_demo_type_rfrnc` (63) | `reference_demonstration_type` (`tag_name_id`, `Demonstration Type`) | 61 | 0 | 0 | 2 | 0 |

## Cross-cutting decisions

- **Status is not 1:1 -- PMDA over-encoded a single variable.** Per SME
  review, PMDA packed due-date and lifecycle/display information into single
  status codes; DEMOS represents these relationally and projects display-only
  states. So several "status" crosswalks map to a *combination* of target
  columns, not one value, and the migration must bring in the underlying data
  the projected states are computed from.
- **demo_status is two-layer.** DEMOS stores `status_id` and computes a
  `Pending`/`Active`/`Expired`/`Extended` display overlay from
  effective/expiration dates (`determineDemonstrationTypeStatus.ts`).
  - Codes 4/5/6/7 (`Extended`, `Temporarily Extended`, `Expired`,
    `Extension Pending`) store as `Approved`; the overlay surfaces the rest
    **only if the effective/expiration dates are migrated**. Mapping to
    `Approved` alone loses the distinction, so the demonstration transform must
    carry those dates.
  - Code 1 (`Pending`) is resolved to `Under Review` per decision D1
    (`reports/narrative/pending_approved_decisions.md`), medium confidence; secondary SME
    confirmation (`Under Review` vs `Pre-Submission`) still wanted.
  - `Withdrawn` (code 9) is migration-only -- DEMOS has no in-app path to it.
- **Renewals are DEFERRED (post-MVP).** DEMOS has no renewals concept. The
  earlier "Renewal == Extension" framing is withdrawn; `renewal_status` is not
  mapped and `sql/04_crosswalks/70_renewal_status_deferred.sql` is a documented
  no-op (NOTICE, never fails closed) until the post-MVP renewal design exists.
- **Deliverable status maps a SET of legacy codes to a COMBINATION.** This is
  the domain with the least direct path. DEMOS spreads what PMDA baked into one
  status across three `deliverable` columns plus an optional extension:
  - `status_id` (FK `deliverable_status`), `due_date_type_id`
    (`Normal`/`Open Ended`), `expected_to_be_submitted` (boolean), and
    `emit_extension_status` (FK `deliverable_extension_status`).
  - `Open-ended` (code 15) is NOT a status: set `due_date_type_id='Open Ended'`
    and infer the lifecycle status (driven by `mdcd_dlvrbl.mdcd_dlvrbl_open_endd_ind`
    + status history). Previously this was dropped to NULL -- a data loss now fixed.
  - `Pending Due Date Change` (code 16): emit a `deliverable_extension`
    (`Requested`), not a status.
  - `Request Resubmission`: the `Requested Resubmission` action moves
    `Submitted`/`Under CMS Review` to `Upcoming`.
  - "Overridden"-prefixed codes set `expected_to_be_submitted=false`; the
    resolved status needs SME + status-history lookup.
  - See `deliverable_status.proposed.csv` (tuple columns) and
    `sql/04_crosswalks/50_deliverable_status.sql` / `51_*_check.sql`.
- **Deliverable confirmation/acceptance have no standalone enum.** DEMOS
  expresses them through `deliverable_status` plus the `deliverable_action_*`
  state machine (baseline seed `20260312131759_init_baseline`).
  - Confirmation enum (`Not Ready`/`Ready for CMS Review`): no target;
    readiness is implicit in the action timeline (`Submitted Deliverable`
    then `Started Review`). Recommend drop.
- **Due-date-change request is the deliverable-extension grain.**
  `mdcd_due_dt_chg_rqst` is the legacy extension request; two of its columns
  are mostly data-backed maps with small judgment calls (proposed CSVs added,
  not yet live -- they ride with the P3 deliverable workstream):
  - `mdcd_due_dt_chg_rqst_dtrmntn_cd` -> `deliverable_extension_status`.
    `Approved`/`Withdrawn` are verbatim; `Not Approved`->`Denied` (semantic),
    `Approved/Alternate Date`->`Approved` (the alternate date is data in
    `altrnt_dlvrbl_due_dt`, not a status), undetermined->`Requested`.
  - `mdcd_state_user_due_dt_chg_rsn_cd` -> `deliverable_extension_reason_code`.
    `Other`/`Technical Difficulties` verbatim, `Covid-19`->`COVID-19`
    (case-fold); `State Level Emergency` has no target -> `Other` (lossy), since
    DEMOS keeps only three reasons.
- **document_type is a multi-source fan-in.** The application doc-type table
  `mdcd_demo_aplctn_doc_type_rfrnc` is 8/11 verbatim with the `document_type`
  seed (proposed CSV added). But `document_type` is the union of several legacy
  doc-type families (site-visit, template, reference-material, help/support);
  promoting it live needs SME reconciliation of those other families plus the
  three application leftovers (`Temporary Extension Letter`, `Final BN
  Worksheet`, `Other`). The proposal documents the application subset only.
- **deliverable_type BN routing is under investigation.** Legacy types are
  cadence-based (Q1-Q4 / Semi-Annual / Annual); DEMOS types are content-based,
  with distinct `Annual Budget Neutrality Report` / `Quarterly Budget
  Neutrality Report`. Routing BN reports correctly is NOT a static code map:
  it needs the per-deliverable `mdcd_dlvrbl.bdgt_ntrlty_ind` flag. The
  investigation (signal selection, proposed rule, open questions, verification
  queries) is in `deliverable_type_bn_routing.md`; the crosswalk/SQL are gated
  on its sign-off. Non-BN operational reports still map to `Monitoring Report`
  with cadence captured as the reporting period / due date.
- **Role/contact -- system vs demonstration level.** PMDA has no
  system-vs-demonstration distinction; DEMOS encodes it via `role.grant_level_id`,
  `role_person_type`, and two assignment homes (`system_role_assignment` vs
  `demonstration_role_assignment`). The unified `40/41_role` crosswalk was
  removed and split into three loaded crosswalks (see "Role split (2026-06-26)"
  above):
  - `crosswalk_system_role` (`system_role.csv`), keyed by `legacy_role_cd`:
    `Internal Administrator` -> Admin User (System), `State User` -> State User
    (System).
  - `crosswalk_demonstration_role` (`demonstration_role.csv`) is **column-keyed**
    (`PRIMARY KEY (source_table, source_column)`), mapping each per-role
    `user_id` column on `mdcd_demo` to a `(role_id, grant_level_id, is_primary,
    treat_zero_as_null)` tuple -- not a legacy code. The "Monitoring Lead and
    Financial Lead" fan-out is therefore two source columns, not one combined
    code: `ro_mntrg_lead_user_id` -> M&E Technical Director and
    `ro_fincl_lead_user_id` -> Project Officer (Financial Lead owns the demo
    including BN). `proj_ofcr_user_id` is `is_primary`; `tchncl_drctr_user_id`
    -> Policy TD (M&E TD has its own column).
  - `crosswalk_role_person_type` (`role_person_type.csv`) validates the
    `person_type_id` derived from the migrated person.
  - The `role` seed has 8 rows: Project Officer, State Point of Contact, DDME
    Analyst, Policy Technical Director, Monitoring & Evaluation Technical
    Director (`Demonstration`); Admin User, CMS User, State User (`System`).
  - `Third Party Evaluation Analyst` and `CMS Technical Director` stay SME
    calls (no external-evaluator role; generic TD must be split Policy vs M&E).
- **signature_level -- PRESERVE OGD.** The earlier proposal collapsed OGD/DD to
  NULL and forced demonstrations to `'OA'`; per review that is data loss. OGD
  exists in the seed; the only obstacle is the CHECKs
  (`20260602115947_check_signature_level`): demonstration must be `'OA'`,
  amendment/extension allow `NULL`/`'OA'`/`'OCD'`.
  - The crosswalk maps `OGD -> 'OGD'`; widening those CHECKs is a DEMOS
    target-schema task (see "Schema changes requested of DEMOS team").
  - A separate DEMOS trigger forbids a NULL signature on an *approved*
    demonstration; `31_signature_level_check.sql` fails closed if an approved
    source demo would resolve to NULL. `DD` (deleted in source) needs an SME
    decision.
  - **RESOLVED for amendments (2026-06-26), still split by entity.** The
    `reports/narrative/notes.md` entry (2026-06-24 pmda-scope, signature-level re-scope)
    proposed "crosswalk to {OA, OCD}, leave NULL when unmappable" for
    amendment/extension. In-session this was accepted **for amendments only**:
    the loader (`20_app/35`) maps `OA->'OA'`, `OCD->'OCD'`, else NULL, and the
    dropped `OGD`/`DD` codes are parity-logged (check 19,
    `migration._parity_amendment_signature_dropped`) rather than silently lost.
    This matches the DEMOS constant `AMENDMENT_SIGNATURE_LEVELS=['OA','OCD']` and
    the `amendment_signature_level_check`, which deliberately bar OGD on
    amendments. **OGD is NOT lost overall:** it remains a valid demonstration
    signature (PRESERVE-OGD below stands; demonstration is still CHECK-forced to
    'OA' pending the widening) and an "OGD Approval to Share with SMEs"
    Review-phase date-type milestone. Extensions are deferred post-MVP, so their
    signature rule is not yet inlined; SMEs should ratify the same OA/OCD-else-
    NULL rule there at build time.

- **demonstration_type is data-backed identity, not a judgment crosswalk.**
  `mdcd_demo_type_rfrnc.mdcd_demo_type_name` IS the `demos_app.tag_name.id`
  value verbatim (61/63 codes), so this proposal documents the resolution
  rather than authoring it. Unlike the status crosswalks it is **not** consumed
  by a `sql/04_crosswalks` check: the loader
  `sql/21_app_associative/20_reference_demonstration_type.sql` resolves the code
  by joining the source lookup directly and folds `rfrnc_matl` rows into
  `reference_demonstration_type` (the demo-type analog of the pgm_dtl tag-pivot;
  `reference_tag_assignment` is the wrong target -- it is restricted to the
  single seeded `Reference` tag). The only SME calls are the two unseeded codes
  `0` (Not Applicable) and `OTHR` (Other): out-of-scope, fold, or add a tag. The
  loader stays inert until the reference loader and `migration._id_map_rfrnc_matl`
  exist (separate workstream: `rfrnc_matl -> demos_app.reference` needs an owner
  user/person-type FK).

## Schema changes requested of DEMOS team

These are target-schema changes the DEMOS team must make for the migration to
preserve data; they are **not** crosswalk mappings and are tracked separately.

- **Widen the signature-level CHECKs** (`20260602115947_check_signature_level`)
  if OGD- (and possibly DD-) level demonstrations are migrated. Today
  `demonstration_signature_level_check` forces `'OA'` and the amendment/extension
  checks allow only `NULL`/`'OA'`/`'OCD'`, so any OGD row is rejected -- a loss
  of data. The crosswalk preserves `'OGD'`; loading it depends on this change.
- **Confirm the approved-signature trigger contract.** A NULL signature is
  rejected on approved demonstrations; the migration treats approved source
  rows with signature code 0 as a pre-load data-quality exception. Confirm the
  exact trigger so the validation matches.
- **(Post-MVP) renewals.** DEMOS needs a renewals representation before
  `renewal_status` can be migrated; deferred for now.
- **(Possible) semi-annual BN deliverable type.** If the BN-routing
  investigation finds semi-annual budget-neutrality deliverables, DEMOS has no
  `Semi-Annual Budget Neutrality Report` type -- a decision/new type may be
  needed (see `deliverable_type_bn_routing.md`).

## Sign-off

| Crosswalk | Reviewer | Date | Status (approved / edits / blocked) |
|---|---|---|---|
| demo_status | Zoe Elkins | 2026-06-26 | approved |
| signature_level | Zoe Elkins | 2026-06-26 | approved; filter and flag DD rows |
| application_status | Zoe Elkins | 2026-06-26 | approved; LOADED (load-only via `application_status.csv` + `registry.yaml`); not yet consumed (`application.status_id` still demo_status-derived) |
| application_type | Zoe Elkins | 2026-06-26 | approved; data-backed identity (LOADED); confirm if any future code beyond 1/2/3 |
| sdg_division | Zoe Elkins | 2026-06-26 | approved; data-backed identity (LOADED); confirm 0/`-- Please Select --` -> NULL; 2026-06-30 audit added code `1` -> NULL (retired/undefined division, no rfrnc entry, only on 24 soft-deleted demos) |
| amendment_status | Droid (in-session) | 2026-06-26 | edits accepted in-session to unblock loader (1->Under Review, 2->Approved, 3->Withdrawn, 4->Denied); loaded from `amendment_status.csv` via `registry.yaml`; **awaiting formal SME ratification** (esp. Pending->Under Review vs Pre-Submission, Disapproved->Denied) |
| renewal_status | | | DEFERRED post-MVP (no mapping) |
| deliverable_status | Zoe Elkins | 2026-07-09 | approved |
| deliverable_type | Zoe Elkins | 2026-07-09 | approved |
| deliverable_cnfrmtn_status | | | |
| deliverable_acptnc_status | | | |
| deliverable_extension_status | Zoe Elkins | 2026-07-09 | approved; data-backed; confirm Not Approved->Denied, Approved/Alternate Date->Approved, undetermined->Requested |
| deliverable_extension_reason_code | | | data-backed; confirm State Level Emergency->Other (lossy) and Covid-19 case-fold |
| document_type | Zoe Elkins | 2026-06-26 | approved (application subset); LOADED (load-only via `document_type.csv` + `registry.yaml`); completeness inert until `mdcd_demo_aplctn_doc` loads; reconcile other doc-type families separately |
| contact_type | Zoe Elkins | 2026-06-26 | folded into the demonstration-role split (`demonstration_role.csv`); standalone proposal removed |
| role | Zoe Elkins | 2026-06-26 | approved; system-level LOADED (`system_role.csv`); demonstration-level LOADED via column-keyed `crosswalk_demonstration_role` (`demonstration_role.csv`) |
| demonstration_type | Zoe Elkins | 2026-06-26 | approved; data-backed identity; drop '0'/Not Applicable and filter/flag 'OTHR'/Other rows |
| pgm_dtl_tag | Zoe Elkins | 2026-07-09 | approved; 10 source tables ratified by SME |
