# Migration notes log

Append-only log of surprises, decisions, and "things to remember" encountered during the build.
Format: `YYYY-MM-DD <author>: <note>`. Keep entries short; link out to commits or tickets where useful.

---

2026-05-29 ownership: reconciled this repo against the cloned DEMOS app
(`Enterprise-CMCS/demos`). Ownership decisions (full detail in
`reports/narrative/ownership-remediation-plan.md`):

- D1. Target schema is **`demos_app`**, not `app`. Prisma's baseline only
  `SET search_path TO demos_app` and never `CREATE SCHEMA`s it, so this
  repo (re)creates the empty `demos_app` before applying the Prisma
  artifact. All Python + SQL references renamed.
- D2. `demos_app.*_history` tables + `revision_type_enum` are Prisma-owned
  (`revision_id` PK, `revision_type`). Deleted our conflicting
  `01_ddl_supplements/10_history_shadows.sql`. P4 backfills the
  Prisma-defined tables (one `revision_type='I'` row per source revision).
- D3. History capture (`log_changes_*` triggers) is DEMOS-owned
  (`server/src/sql/history_triggers.sql`). `sql/32_app_triggers/` stays
  empty. Backfill must run before those triggers are installed.
- D4. **Deferred** (held by request): DEMOS does no in-DB JSONB validation
  (no `pg_jsonschema` in `server/`); our `31_constraint_triggers/00_jsonb_validation.sql`
  still attaches validation triggers to `demos_app.*`. Revisit whether to
  demote to migration-private parity only.
- D5. DEMOS post-Prisma objects (history triggers, functions, utility
  views, permissions, cron) are applied by the operator via
  `server/src/refreshDbObjects.ts` after P5, before flip — not by us.
- D6. The DEMOS `seeder.ts` uses `@faker-js/faker` to mint dev fixtures;
  it must **never** run against a migration target. Reference/lookup rows
  come from Prisma `INSERT`s in the migrations.
- D7. App-facing roles are **`demos_read` / `demos_write` / `demos_delete`**
  (from DEMOS `permissions.sql`), replacing our `app_ro`/`app_rw`. DEMOS
  `permissions.sql` owns the grants; `00_init/01_schemas.sql` no longer
  sets app-facing grants.

2026-06-08 schema-diagrams: first `make schema-drift` run flagged 2
relationships present in the hand model (`DEMOS_Data_Model.mmd`) but absent
from the Prisma-derived target model: FK154 (`reference.owner_person_type_id`
-> `cms_user_person_type_limit.id`) and FK155
(`reference_agreement.owner_person_type_id` -> `cms_user_person_type_limit.id`).
**Follow-up (SME):** confirm against the Prisma source whether these FKs
actually exist. If real, add overrides to `reports/inputs/fk_overrides.yaml` so they
flow into the generated model; if the hand model is stale, correct it instead.
Do not add a blind override. (Drift check is warn-only and off the cutover
apply path; `reports/schema_drift_report.md` is now local-only / gitignored
since it needs the sibling `../demos` checkout to regenerate.)

2026-06-22 user-rbac: built the user-level RBAC workstream into the
previously-empty `sql/23_app_derived/`.

- `person_state` is sourced from `user_authrzd_state_acs` (the team's
  authoritative state-access table), **not** `mdcd_demo` (the stale
  `proposed_table_map.yaml` arrow, now corrected). CMS users + admins fan out
  to **every** `demos_app.state` row, mirroring the DEMOS
  `assign_cms_user_to_all_states` trigger (which the pinned DDL itself applies
  for the FM/PW/MH territories); that app trigger fires only on future
  inserts, so migrated grants are materialized here. Non-CMS users get their
  explicit `uasa` states. The `XX` (all-states) sentinel on a non-CMS user and
  any unmapped state code are **held** (not granted) and surfaced via
  `stg.person_state_flags` / parity check 10 (PENDING).
- `system_role_assignment` is sourced from `user_role_asgnmt` for the two
  **System** roles only (code 1 Admin User / demos-admin, code 4 State User /
  demos-state-user) via the self-contained `04_crosswalks/44_system_role.sql`.
  `user_role_asgnmt` has no demonstration context, so the Demonstration-level
  roles (2,5,6,7,8,9) and code 3 (external evaluator -> non-user-contact) are
  out of scope here.
- **Follow-up (SME):** `04_crosswalks/40_role.sql` + `41_role_check.sql` (the
  full role tuple incl. Demonstration roles and code 3) remain a separate
  unsigned workstream. `41_role_check` hard-fails until every `role_rfrnc`
  code maps, so a real `crosswalks` run with `role_rfrnc` loaded still blocks
  there independently of this work; the new `44/45` files are self-contained
  and do not depend on it.
- Active-users (`deleted_at IS NULL AND deleted = 0 AND lastAccess` this
  decade) is wired as parity check 11 (coverage cross-check), **not** a filter
  change: the migration still loads every real user for FK integrity.

2026-06-24 pmda-scope: carried `mdcd_chip_div_cd` through staging
(`22_demonstration_resolved.sql` -> `sdg_division_cd`), joined
`mysql_raw.crosswalk_sdg_division`, and populated `demonstration.sdg_division_id`
in `20_app/30_demonstration.sql`. This unblocks DEMOS
`check_demonstration_non_null_fields_when_approved`, which rejects an Approved
demonstration with NULL `sdg_division_id` / `effective_date` / `expiration_date`
(the build drops only FK constraints, so this CHECK is live during `build_app`).
Approved demos missing any of the three are **held back** (not loaded, not
fatal) and logged per-row to `migration._parity_approved_demo_held`
(`99_parity/12_approved_demo_held_for_division.sql`) + the non-gating parity
check 13 (`reports/orphans/approved_demo_held_for_division.csv`). Check 8
(`11_demonstration_completeness.sql`) excludes these deliberate hold-backs so it
stays GREEN.

2026-06-24 pmda-scope: **signature-level re-scope.** Per the pinned Prisma DDL
(`20260602115947_check_signature_level`), `demonstration_signature_level_check`
forces `signature_level_id` NOT NULL AND `= 'OA'`, so the demonstration loader
sets it to the constant `'OA'` -- the per-application PMDA code
(`mdcd_demo_aplctn_sgntr_lvl_cd`, incl. `OGD`) **cannot** be represented at the
demonstration grain and is not carried there. This supersedes the
cross-cutting spec's "preserve `OGD` on demonstration; DEMOS CHECK widening is
an external blocker" note: OGD never lands on `demonstration`, so that widening
is moot here. Real signature-level derivation belongs to **amendment /
extension** (WP3): `amendment_signature_level_check` and
`extension_signature_level_check` allow `signature_level_id` NULL OR
`IN ('OA','OCD')`. WP3 crosswalks the PMDA signature code to `{OA, OCD}` and
leaves it NULL when unmappable (allowed by those CHECKs) rather than treating
`OGD`/`DD` as an external blocker.

2026-06-24 pmda-scope: **medicaid_id / chip_id divergence from the doc.** The
`pmda_highlights_reel.md` extract reads `mdcd_demo_num` / `mdcd_scndry_demo_num`
straight. DEMOS requires `medicaid_id` NOT NULL and a unique `chip_id`, and ships
a `generate_medicaid_chip_id_numbers` app trigger. Decision (held): **preserve
legacy project numbers** -- `medicaid_id` is always `mdcd_demo_num`
legacy-preserved and **never minted**; `chip_id` is `mdcd_scndry_demo_num` when
present, else **minted** `21-W-<seq>/<region>` (seq seeded above any preserved
`21-W-NNNNN/R` so a minted value cannot collide with a preserved one). The
divergence to flag for SMEs: a minted `chip_id` is a generated value with no
PMDA source row; preserved numbers are verbatim. We replicate the DEMOS mint
contract only for the NOT NULL `chip_id`, not for `medicaid_id`.

2026-06-24 pmda-scope (WP3): amendment / extension / pending application loaders
are **not** authored -- each is blocked by a committed decision, so WP3 adds
fail-closed crosswalk scaffolding (no invented mappings) and records the
blockers rather than building loaders:

- **Extension / renewal: DEFERRED post-MVP.** `04_crosswalks/70_renewal_status_deferred.sql`
  (documented no-op) -- DEMOS has no renewals concept; the "Renewal == Extension"
  framing is withdrawn. No loader.
- **Pending demos: blocked on demo-status code 1 ('Pending').** Code 1 is the
  withheld SME judgment call (`10_demo_status.sql`); pending demos with no
  approved counterpart would land on it. No pending-application loader.
- **Amendment: new fail-closed status scaffolding.** Added
  `04_crosswalks/64_amendment_status.sql` (empty `crosswalk_amendment_status`)
  + `65_amendment_status_check.sql` (auto-run in the crosswalks phase; fails
  closed once any source amendment carries an unmapped `mdcd_demo_amndmt_stus_cd`).
  Proposed values exist in `reports/crosswalks/amendment_status.csv` (4 codes)
  but are not signed off, so the table stays empty per the `_review.md` rule.
  Two further amendment-loader blockers are recorded but not coded:
  `amendment.current_phase_id` (NOT NULL) has no source column (SME/design
  decision), and an OGD-coded amendment is rejected by
  `amendment_signature_level_check` ({NULL, OA, OCD}).

2026-06-24 pmda-scope (FLAG for SME reconciliation): the 2026-06-24
signature-level re-scope note above (demonstration forced 'OA'; amendment/
extension "crosswalk to {OA, OCD}, NULL when unmappable") **conflicts** with the
committed PRESERVE-OGD decision in `04_crosswalks/30_signature_level.sql` and
`reports/crosswalks/proposed/_review.md` ("signature_level -- PRESERVE OGD"),
which maps `OGD -> 'OGD'` and treats the CHECK widening as a DEMOS target-schema
task, explicitly rejecting OGD->NULL as data loss. These two positions are not
reconciled. Per decision, the earlier note is left as written and this conflict
is flagged here (and in `_review.md`) for SME resolution rather than silently
overwritten. Until reconciled, the loaders force 'OA' on demonstration (CHECK)
and the amendment scaffolding stays empty/fail-closed, so neither position is
actually exercised yet.

2026-06-24 pmda-scope (WP4): the deliverable workflow (#6) and its children are
**blocked**, so no `20_app` deliverable loader is authored; the blockers are
recorded rather than coded around:

- **Primary blocker: `deliverable.deliverable_type_id` (NOT NULL).** The
  `deliverable_type` crosswalk is deliberately **not authored** -- it is gated
  on the `reports/crosswalks/deliverable_type_bn_routing.md` investigation
  (legacy cadence-based types vs DEMOS content-based types; BN routing needs
  the per-deliverable `mdcd_dlvrbl.bdgt_ntrlty_ind`, not a static code map). We
  do NOT add a fail-closed stub here because that would contradict the
  committed deliberate gate; the investigation must land first.
- **Owner + demonstration-status derivations.** `deliverable` also requires
  `cms_owner_user_id`/`cms_owner_person_type_id` (resolve from source owner via
  the users id-map + `role_person_type`) and `demonstration_status_id`, neither
  wired.
- **Ready crosswalk.** `deliverable_status` (`50/51`) is the one ready piece:
  the tuple mapping (status_id / due_date_type_id / expected_to_be_submitted /
  emit_extension_status) is inlined, fail-closed on the undecided codes 7/9.
- **Children all hang off the blocked loader:** status history; comments by
  `cmt_orgn_cd` -> public/private comment (routing design in
  `docs/sme/explanation-comments-routing.adoc`); uploaded files -> `document`
  (blocked on the `document_type` multi-source fan-in, `_review.md` P4); paper
  records; due-date-change -> `deliverable_extension` (proposed, not live);
  `deliverable_acptnc_status`/`deliverable_cnfrmtn_status` (overlap / no target,
  likely drop). The deliverable/document history snapshots (`22_app_history/14`,
  `17`) stay empty (0 rows) until a live loader exists -- correct, no activation
  needed. Coverage stays visible via the non-gating `migration._scope_coverage`
  (parity check 14), which lists `deliverable`/`document` as DEFERRED.

2026-06-24 deliverable-unblock: **partly reverses the WP4 "no deliverable
loader" decision above.** A re-audit of the re-pinned 26-migration DDL resolved
the derivations WP4 listed as unwired, so the deliverable family is now
SCAFFOLDED with a held-back loader (`sql/20_app/40_deliverable.sql`) that loads
**0 rows today** and activates with no further change once the one remaining
hard blocker is signed off. `migration._scope_coverage` now lists `deliverable`
as **PARTIAL** (was DEFERRED); `document` stays DEFERRED.

- **Only hard blocker left: `deliverable_type_id` (NOT NULL).** Unchanged from
  WP4 -- still gated on `reports/crosswalks/proposed/deliverable_type_bn_routing.md`.
  The loader RETURNs before its INSERT while `mysql_raw.crosswalk_deliverable_type`
  is absent, so (by PL/pgSQL lazy planning) it never name-resolves the missing
  table and holds back every deliverable. This is the sole reason 0 rows load.
- **Every other column is wired (DDL-audited):**
  - `cms_owner_user_id` = `mdcd_dlvrbl.creatd_user_id` via `migration._id_map_users`;
    `cms_owner_person_type_id` = that owner's `person_type` via
    `stg.users_resolved`. The composite FK `(cms_owner_user_id,
    cms_owner_person_type_id) -> users(id, person_type_id)` plus the
    `cms_user_person_type_limit` FK constrain the owner to
    `{demos-admin, demos-cms-user}`, so a **state-user creator is held back**
    (anomaly), not loaded with a bad type.
  - `demonstration_status_id` = constant **'Approved'**. `deliverable_demonstration_status_limit`
    seeds only 'Approved', and the composite FK `(demonstration_id,
    demonstration_status_id) -> demonstration(id, status_id)` forces a
    deliverable to attach **only to an Approved demonstration**. The loader inner
    -joins a loaded Approved demo, holding back deliverables of non-Approved or
    held-back parents. (Amendment/extension carry a plain `demonstration_id` FK
    only -- this Approved coupling is deliverable-specific.)
  - `status_id` / `due_date_type_id` / `expected_to_be_submitted` = the
    `crosswalk_deliverable_status` tuple (`50/51`, already ready, fail-closed on
    codes 7/9).
  - `due_date` = `dlvrbl_due_dt`, else `dlvrbl_prd_strt_dt + dlvrbl_days_due_num`
    days, else `dlvrbl_due_dt_chg_dt`.
  - `name` = `btrim(mdcd_dlvrbl_name)`; empty held back. The trim satisfies
    `check_deliverable_name_has_no_leading_trailing_whitespace` (migration
    `20260528211105`).
- **New plumbing:** id-map `migration._id_map_mdcd_dlvrbl` (`05_id_maps/15_*`
  create + `10_stg/26_*` populate from `stg._valid_dlvrbl_ids`); source-only
  staging view `stg.deliverable_resolved` (`10_stg/28_*`); parity views
  `migration._parity_deliverable_held` (non-gating check 17, logged to
  `reports/orphans/deliverable_held.csv`), `_parity_deliverable_completeness`
  (gating check 15), `_parity_deliverable_integrity` (gating check 16). All
  guarded on `stg.deliverable_resolved` so they are clean no-ops in the
  app-layers idempotency harness.
- **Soft deletes** (`mdcd_dlvrbl.dltd_ind = 1`) are excluded from
  `stg.deliverable_resolved`, mirroring `demonstration_resolved`; whether a
  soft-deleted deliverable should map to the DEMOS 'Deleted' `deliverable_status`
  is a deferred SME decision (not invented here).
- **Document linkage (migration `20260623125420_no_deliverable_submitted_cms_files`):**
  the new CHECK `no_submitted_deliverable_cms_files` excludes CMS-attached files
  from submissions (`NOT (deliverable_is_cms_attached_file = true AND
  deliverable_submission_action_id IS NOT NULL)`). The 3-state document routing
  and the `deliverable_action` state machine are captured as spec contracts in
  `docs/specs/pmda-cross-cutting-derivation-spec.md`, with inert, guarded
  scaffolds (`sql/10_stg/27_document_deliverable_link_resolved.sql`,
  `sql/99_parity/43_document_cms_file_submission_invariant.sql`, both no-ops
  until a `stg.document_resolved` loader lands). The document loader stays
  DEFERRED on the `document_type` fan-in (`_review.md` P4).

2026-06-24 status-updated-at: DEMOS migration `20260616155913_add_status_updated_at_to_applications`
adds `status_updated_at` (NOT NULL, DEFAULT CURRENT_TIMESTAMP) to
`demonstration`, `amendment`, `extension` (+ their `_history`) and **backfills it
to `updated_at`**. The demonstration loader (`sql/20_app/30_demonstration.sql`)
now sets `status_updated_at = updated_at` explicitly; without it the NOT NULL
DEFAULT would silently stamp every migrated demonstration with the cutover
instant (no parity check would ever fire, since the column is never NULL). The
`demonstration_history` snapshot (`22_app_history/10`) already mirrors the
column, so the fix propagates to history. **Follow-up:** the deferred amendment
/ extension loaders (WP3) MUST do the same (`status_updated_at = updated_at`)
when authored; `deliverable` does NOT have this column.

2026-06-26 cma-audit reconcile: reconciled `reports/audits/cma_code_audit.md`
high-value wins against the repo (codeable-now scope). Findings:

- **W2 `current_phase_id` is already built** for `demonstration`:
  `sql/10_stg/22_demonstration_resolved.sql` encodes the highest-phase-by-date
  cascade over the `mdcd_demo_aplctn` phase columns and the loader adds the
  `Approved -> 'Approval Summary' -> 'Concept'` fallback. Deliberate divergence
  from the audit: the repo follows DEMOS's "highest *started* phase" rule
  (server `applicationPhaseConstants.ts`), not the legacy CMA app's "started AND
  not-concluded" rule. `amendment.current_phase_id` stays with the deferred
  amendment loader (WP3).
- **R4 region crosswalk is already built** as `migration.state_region`
  (`sql/02_seeds_static/25_state_region.sql`). Added a non-gating drift check
  (`sql/99_parity/50_state_region_source_drift.sql` + parity check 18) that
  cross-checks the seed against the audit's source-of-truth column
  `geo_ansi_state_rfrnc.rgnl_ofc_cd`; verified the source values match the seed.
- **W1 audit `rpt_ocrnc` routing claim disproven.** The audit (W1/C1) proposed
  routing `deliverable_type` on `mdcd_dlvrbl_rpt_ocrnc_rfrnc` codes 57/70. Re-test
  against `reports/schema_snapshot/columns.csv` + the 2024 dump confirms
  `rpt_ocrnc_*` columns exist ONLY on the reference table -- no instance FK -- so
  it cannot drive per-deliverable routing. `mdcd_dlvrbl.bdgt_ntrlty_ind` remains
  authoritative. Recorded in `deliverable_type_bn_routing.md` (re-test section +
  vocabulary appendix); `deliverable_type` stays gated on SME sign-off.
- **R2 fixed:** removed the invented source code 10 from
  `proposed/document_type.proposed.csv` (the 2024 `mdcd_demo_aplctn_doc_type_rfrnc`
  has codes 1-9 + 99 only; code 10 is a valid DEMOS *seed* but never a PMDA
  *source* code). Proposed-only; `document_type` remains DEFERRED (P4).
- **R1 unchanged:** active `demo_status.csv` deliberately withholds code 1
  ('Pending', SME blocker #5) behind the fail-closed `11_demo_status_check.sql`;
  `proposed/demo_status.proposed.csv` already carries it. Per decision the active
  path is not touched.

2026-06-26 amendment-loader: **built the amendment loader, superseding the
2026-06-24 WP3 "Amendment: scaffolded/blocked" note above.** Approved-parent
amendments now migrate as an `application` + `amendment` IS-A pair. New code:
`05_id_maps/16_mdcd_demo_amndmt.sql` + `10_stg/29_populate_id_map_mdcd_demo_amndmt.sql`
(id map), `10_stg/30_amendment_resolved.sql` (source-only resolver),
`20_app/35_amendment.sql` (loader), `99_parity/52_amendment_load.sql` + parity
check 19 (non-gating accounting). The three prior blockers were resolved in-session
(SME-ratify; recorded in `pending_approved_decisions.md` #3 and `_review.md` P2):
- **status crosswalk inlined** in `64_amendment_status.sql` (1->Under Review;
  2->Approved; 3->Withdrawn; 4->Denied). `65_*_check.sql` still fails closed on
  any future unmapped code.
- **`current_phase_id` (no source column) is status-derived:** Approved->
  'Approval Summary'; Under Review->'Review'; Withdrawn/Denied->'Concept'.
- **signature: OA/OCD-else-NULL** (`OA`->'OA', `OCD`->'OCD', else NULL). This
  adopts the 2026-06-24 signature-level re-scope stance **for amendments only**,
  resolving the `_review.md` OPEN CONFLICT: OGD/DD are dropped to NULL on
  amendments (parity-logged) per DEMOS `AMENDMENT_SIGNATURE_LEVELS=['OA','OCD']`
  + `amendment_signature_level_check`, while OGD is preserved elsewhere
  (demonstration signature seed + the "OGD Approval to Share with SMEs"
  Review-phase date type). Demonstration's PRESERVE-OGD decision is untouched.
Amendments whose only parent is a pending (unmigrated) demo -- or whose approved
parent was itself held back -- are excluded and logged non-gating (check 19,
`migration._parity_amendment_held`). `clearance_level_id` is omitted to take the
table DEFAULT 'CMS (OSORA)'. `updated_at`/`status_updated_at` mirror `created_at`
(only `creatd_dt` exists on the source). The `amendment` column rules are now
recorded in `reports/source_target_columns.csv`. Follow-on (separate, not
blocking): a medicaid.gov 1115 scraper as an outcome-fact parity workstream
(demonstration-level Status/Approval/Effective/Expiration only; it cannot supply
the internal CMS workflow phase, which is never published).

2026-06-26 1115-scraper: **built the medicaid.gov 1115 scraper parity workstream**
(the follow-on noted above). Two repos changed:

- **document-ocr** (`../document-ocr`): new `extract-facts` command + `scripts/facts.py`
  that scrapes every approved Section 1115 demonstration detail page on medicaid.gov
  (reusing the existing BrowserFetcher + discovery flow) and extracts six structured
  facts (State, Name, Status, Approval Date, Effective Date, Expiration Date) from the
  page's `table.waiver-details-custom` elements. The facts are fuzzy-matched (rapidfuzz
  token_set_ratio >= 90, state + name) against an input CSV of migrated demonstrations;
  the output is a flat snapshot CSV with `match_status` ('matched'/'mg_only'/
  'migrated_only'), both sides' facts, match_score, and runner-up info for ambiguous
  matches. A `.meta.json` sidecar records the scrape timestamp.
- **demos-data-migration**: (1) new `application_date` loader (`20_app/36`) materializes
  the demonstration's approval date (`mdcd_demo.aprvl_dt`, added to
  `stg.demonstration_resolved`) as an `application_date` row with date_type_id
  'Application Approval Date' (seeded by DEMOS migration `20260617124348`); (2) new
  parity check 20 (`99_parity/53` + `parity.py`) loads the snapshot CSV into
  `migration._medicaid_gov_1115_snapshot`, joins to the current `demos_app.demonstration`
  + `application_date` by `medicaid_id`, and logs any discrepancy (status/effective/
  expiration/approval date mismatch, mg_only, migrated_only, ambiguous match) per-row to
  `reports/orphans/medicaid_gov_1115_drift.csv`. Non-gating (always GREEN); medicaid.gov
  data may legitimately lag the internal CMS data.

The snapshot is a one-time commit; an operator re-scrapes before a cutover by exporting
`SELECT state_id, name, medicaid_id FROM demos_app.demonstration` to a CSV, running
`extract-facts --migrated-csv <csv> --output reports/medicaid_gov_1115_snapshot.csv`,
and committing the result. The scraper does NOT require a Mistral API key.

2026-06-26 role-crosswalk-cleanup: **resolved the "Follow-up (SME)" role item
above by removing the superseded unified workstream, not by authoring it.** The
single `crosswalk_role` table was the wrong shape -- its two legacy sources map
to two different DEMOS grant levels + assignment homes -- so it was already
replaced by the per-grant-level split: `44/45_system_role` (`system_role.csv`)
feeds `system_role_assignment`; `46/47_demonstration_role`
(`demonstration_role.csv`, column-keyed) feeds
`demonstration_role_assignment` + `primary_demonstration_role_assignment`;
`42/43_role_person_type` (`role_person_type.csv`) drives `person.person_type_id`.
All three are live and registry-wired (CSV-authored). Deleted: `sql/04_crosswalks/40_role.sql`,
`41_role_check.sql`, `reports/crosswalks/proposed/role.proposed.csv`,
`contact_type.proposed.csv`. This also closes a latent hazard: `run_crosswalks`
globs every `*.sql`, so the orphaned `41_role_check.sql` would have fail-closed
on the permanently-empty `crosswalk_role` the moment `role_rfrnc` loaded,
blocking the whole `crosswalks` phase. The remaining role work is pure SME
ratification of the values already in `system_role.csv` / `demonstration_role.csv`
(the `*_check.sql` files fail closed on any uncovered source code), not code.

2026-06-30 dress-rehearsal-probe (first end-to-end run, static IMPL snapshot ->
local target): the full pipeline `init -> ... -> parity` now runs end-to-end.
Five mechanical breakages surfaced and were fixed in-code with regression tests;
see `reports/rehearsals/rehearsal_20260630_215909Z.md` for the per-finding writeups.
Surprises worth carrying forward:

- **Parity check 5 (reconstructed-FK orphans) had never produced a result.** It
  hard-crashed (`UndefinedColumn: column t.id does not exist`) because
  `scripts/generate_fk_candidates.sql` hardcoded the parent PK guess as `id`
  while mysql_raw PKs are `<table>_id`. So every prior parity run that reached
  check 5 would have aborted the gate. Fixed two ways: the heuristic now
  resolves the real single-column PK, and `_orphans` is now resilient (an edge
  whose column is absent or whose key types are incompatible is reported
  *uncheckable* -> PENDING, never a crash). Lesson: a check that has only ever
  been exercised against a partial/empty `mysql_raw` can be silently broken; the
  probe (full load) is what revealed it.

- **Once check 5 runs it is RED with ~200 source-side orphans**, almost all in
  out-of-scope `*_hstry`/`*_bkup`/`tmp_bak_*`/`mdcd_pendg_*` tables plus obvious
  heuristic false edges (`mdcd_demo.proj_ofcr_user_id ->
  mdcd_demo.state_5th_poc_user_id`). The legacy MySQL declares no FKs, so
  inferred edges naturally dangle. The reconstructed-FK candidate set needs
  curation/scoping before check 5 can gate a cutover -- it is not a migration
  defect.

- **The associative tag loader joined the id map, not the loaded parent.**
  `migration._id_map_mdcd_demo` carries every legacy demo (incl. the 387
  soft-deleted that never load); the tag-assignment INSERT joined it directly,
  so 681/821 tag rows orphaned the `demonstration_id` FK. Pattern to watch in
  any associative/derived loader: scope to the loaded parent table, not the
  id map.

- **Crosswalk completeness checks must scope to the migratable set.** Both the
  signature (31) and deliverable-status (51) checks fail-closed on legacy codes
  that appear only on soft-deleted / out-of-scope rows. Scoping clause (a)/(c)
  to `dltd_ind=0 ∩ stg._valid_*_ids` (with a raw-source fallback that keeps the
  standalone tests fail-closed) is the same fix shape as the earlier
  sdg_division case.

- **DEMOS strict `effective_date < expiration_date` rejects zero-length
  windows.** Source `mdcd_cmnty_enggmt_pgm_dtl` has a `from_dt == to_dt` row;
  the tag loader's NULL-period filter had to be extended to non-positive
  windows.

- **The freeze is drivable non-interactively** for a static source via
  `printf 'y\n' | make freeze` (confirm() reads stdin); the curated
  `pgloader/delta_tables.tsv` makes `delta` a ~3s targeted re-pull instead of a
  full reload.

- **Amendments can be silently dropped by an unmapped/NULL status, invisibly to
  parity (rehearsal 20260709).** `demos_app.amendment` loaded 0 while parity was
  GREEN. Trace: source 266 -> stg.amendment_resolved 189 -> loaded 0. The loader
  (`20_app/35_amendment.sql`) inner-joins `crosswalk_amendment_status` on
  `status_cd`, and 162 of the 189 staged rows have a NULL source status, so they
  vanish with no error and no held-row log. Check 19's accounting views share the
  same inner join, so the drop was invisible at the gate too (fail-open + parity
  blind spot). The 162 are the **pending-demonstration track** (perfect 1:1
  discriminator: presence of `mdcd_pendg_demo_id`; disposition fields uniformly
  empty), not drafts and not a vintage artifact -- so there is genuinely no
  source status to map. Fix `c6af234` adds a fail-closed guard
  (`_parity_amendment_unmapped_status` view + parity check + 3 tests) mirroring
  the pgm_dtl mapped-but-unseeded pattern: parity now RED-s and logs the rows for
  SME disposition rather than letting them silently disappear. Pattern to watch:
  any loader whose crosswalk join is INNER can silently shed unmapped-key rows,
  and if the accounting view reuses that same join the loss is doubly invisible.
