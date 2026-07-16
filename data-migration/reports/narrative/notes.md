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

2026-07-10 sme-answers: the SME answered the 2026-07-10 question set. This entry
records the dispositions; the code lands across five dedicated branches (see the
approved spec). This branch (`migration/sme-decision-ratifications`) is docs-only.

- **Ratified, already implemented (no logic change):** signature level 'OA' on
  every demonstration; the 'DD' hard-stop (no live demo is DD; a live DD still
  fails closed); deliverable confirmation-status drop (`Not Ready / Ready for
  CMS Review` has no target); deleted deliverables left behind (soft-delete
  excluded, same as demos); demonstration `type` = 'Demonstration'; role routing
  by source table/column (external evaluator -> non-login contact; Technical
  Director split Policy TD vs M&E TD); 'Not Applicable' demo type dropped;
  state-access hold for all-states / unrecognized non-CMS users; comments
  default to internal and move to public when needed (route by author until SDG
  supplies the origin-code meanings -- remind SDG; contractors won't always be
  caught by CMS-vs-EE, accepted).
- **Amendment statuses RATIFIED (2026-07-10):** 1->Under Review, 2->Approved,
  3->Withdrawn, 4->Denied (was in-session-accepted; `64_amendment_status.sql`,
  `amendment_status.csv`, `_review.md` P2 updated).
- **Document-type leftovers SETTLED (2026-07-10):** codes 6/99 -> General File,
  7 -> BN Workbook; no new document_type added -- just filed under existing
  seeds (David rubber-stamp pending, non-blocking).
- **Semi-annual BN -> keep Quarterly** ("identical"). Resolves the workflow-8
  open item. Mechanics: profile the source first; add a `bdgt_ntrlty_ind`
  override -> Quarterly BN Report only if live semi-annual BN deliverables
  exist (rpt_ocrnc code 6 'Semi-Annually' is seen only on soft-deleted rows
  today). Gated behind the still-blocked deliverable loader.
- **CHIP id -- STOP MINTING (reverses the 2026-06-24 "mint 21-W fallback"
  decision).** SME: CMS/DEMOS mints CHIP ids, the migration must not invent
  them. Contract (built in `migration/chip-id-no-mint`): the migration preserves
  the real legacy 11-W medicaid_id and 21-W chip_id, leaves chip_id (and, for
  pending demos, medicaid_id) NULL when the source has none, and drops the
  `21-W-<seq>/<region>` fallback. The DEMOS side makes medicaid_id/chip_id
  nullable for the migration window and ships a null-only backfill (disable the
  immutable-fields trigger, mint region-based ids ONLY where NULL, re-enable,
  re-set NOT NULL -- the pattern already used in migration `20260602201004`).
  NOTE: DEMOS `generate_medicaid_chip_id_numbers` mints BOTH ids and forbids
  manual set, and `prevent_changing_immutable_demonstration_fields` makes them
  immutable -- so the backfill must mint chip_id only where NULL and must never
  touch a preserved medicaid_id. No `is_migrated_from_pmda` column is added to
  `demonstration` (that idea is dropped).
- **Pending demonstrations -- IN SCOPE to build** (`migration/pending-demonstrations`;
  see D1 scope update in `pending_approved_decisions.md`). Status 'Under Review';
  the 162 statusless pending amendments take 'Under Review' (mirror parent).
- **All milestone dates -- bring them** (`migration/milestone-dates`), guarding
  the federal comment period: DEMOS's cron `update_federal_comment_phase_status()`
  auto-starts the Federal Comment phase when 'now' is inside a loaded window, so
  pre-set the Federal Comment phase_status to avoid spuriously advancing
  cutover-spanning windows. Today only the approval date is migrated
  (`20_app/36`).
- **Withdrawn demonstrations -- keep loading + list for SDG** (SDG clarification
  still wanted, non-blocking).
- **Two SME-requested exports** (`migration/sme-review-exports`): held 'Other'
  program names (source `99_parity/54`) and a comments snapshot.
- **Routed to owners (no code yet):** deliverable acceptance-status precedence
  (David -- does it override the main status?); renewals/extensions (David --
  kept deferred post-MVP, profile for his call); BN summary-only sufficiency
  (Vivian -- proceeding tentatively); phase-mapping ordinals 4/5/6, clearance
  collapse into SDG Preparation, early-step split, Concept default (David &
  Vivian -- current mapping kept meanwhile); comment origin-code meanings (SDG).

2026-07-14 chip-id: **the migration no longer mints `chip_id` (supersedes the
2026-06-24 mint decision).** Per the 2026-07-10 SME answers, CMS (not the
migration) assigns CHIP ids and the DEMOS app owns `chip_id`: it makes the
column nullable and backfills/mints the NULLs after load. So
`20_app/30_demonstration.sql` now sets `chip_id` to the preserved legacy 21-W
number when the source has one, else **NULL** (never a `21-W-<seq>/<region>`
fallback). The loader still advances `chip_id_number_seq` past every preserved
legacy 21-W number so DEMOS's later backfill / in-app mint cannot collide with a
preserved value. `medicaid_id` is unchanged (always legacy-preserved, never
minted). The demonstration flow-trace `chip_source` vocabulary changed from
`preserved|minted` to `preserved|deferred` (deferred rows carry a NULL
`chip_id`); the manifest, tests, and generated partials were updated to match.

2026-07-14 pending demonstrations (workflow 7 reversal, `migration/pending-demonstrations`):
per the 2026-07-10 SME answers, pending demos now migrate. `stg._pendg_demo_fold`
(`10_stg/23`) classifies each PMDA-valid pending demo "approved wins": a pending
demo whose project number matches a valid approved demo **folds** into it; one
with no counterpart is an **orphan_loadable**; one with no project number is
**held_no_project**. `10_stg/24` projects orphans and `20_app/31` loads them as
their own 'Under Review' demonstration (chip_id always NULL, no status column ->
uniformly Under Review), holding back the RED-4 duplicate-medicaid loser and any
state absent from `state_region` (logged non-gating in
`_parity_pending_demonstration_held`). Amendments resolve fold-aware
(`10_stg/30` LEFT JOINs the fold; `20_app/35` assigns 'Under Review' to the 162
statusless pending-track amendments; `99_parity/52` unmapped-status guard mirrors
the loader's drop condition so they are not falsely flagged). Parity check 4
(`99_parity/04`) was redefined: `leaked` = a must-not-load (folded/no-project)
pending demo that got its own row; `pending_only_deferred` = the residual
no-project-number set, reconciled against
`reports/parity_accepted/pending_approved_deferrals.csv` (now the SME-signed
reversal record; the former `no_approved_counterpart` rows were removed because
they load). Pending program-detail tags now **load** fold-aware:
`reports/pgm_dtl_tag_mapping_pending.csv` is populated (68 rows derived
mechanically from the filled base `pgm_dtl_tag_mapping.csv` by prefix-swap
`mdcd_`->`mdcd_pendg_`, same tags + date columns; the source-absent
`mdcd_pendg_fincl_pool_pgm_dtl` is dropped -- no new SME judgment), driven by
`04_crosswalks/47_pendg_pgm_dtl_tag.sql` + registry entry. The fold-aware
fixed-tag loader `21_app_associative/12` and free-text "Other" loader
`21_app_associative/13` resolve the parent via `stg._pendg_demo_fold`; parity
`99_parity/55` logs held free-text "Other" rows (non-gating) and fail-closes on
any mapped-but-unseeded tag -- mirroring the base 10/11/54 trio as pending
12/13/55. This branch also stacks the two prior unmerged branches (2026-07-10
crosswalk sign-offs; stop minting chip_id) via cherry-pick.

Milestone dates and per-phase status now migrate. `10_stg/25` is a source-only
tall crosswalk mapping every high-confidence legacy phase-milestone column
(approved + pending demonstrations, both from `mdcd_demo_aplctn`, aggregated to
the furthest milestone reached) to a seeded DEMOS `date_type`; `20_app/36`
(rewritten from approval-date-only) loads them into `application_date`, and
`23_app_derived/50` derives the 8 `application_phase` rows per loaded
demonstration (approved + pending) and amendment from the loaded
`current_phase_id` (earlier=Completed, current=Started, later=Not Started;
Concept never Not Started). A Federal Comment past-window failsafe forces that
phase to 'Completed' when its loaded end date is before cutover (`2026-08-20`, a
single documented SQL constant in `23_app_derived/50` mirrored in
`99_parity/56`) so the DEMOS nightly `update_federal_comment_phase_status()` cron
cannot spuriously advance a window that closed by cutover. Amendments get phases
only (no confidently-mappable milestone-date column). The granular phase_3
clearance sub-dates (SME/FRVT/CMCS/OGC/OMB), the application-status date, and the
amendment application/status dates are deferred for SME review and logged
non-gating in `_parity_application_milestone_unmapped` (`99_parity/56`); the full
crosswalk + deferred columns live in `reports/narrative/milestone_date_mapping.md`.

2026-07-14 timestamps: a data engineer flagged migrated dates as one day early
for Eastern users. Audit confirmed the cause: the migration cast MySQL `date`
columns with a bare `::timestamptz`, which under the UTC RDS session stores
midnight UTC -- but DEMOS anchors date-only values to **America/New_York**
(start-of-day, or end-of-day `23:59:59.999` for the two "End of Day" types),
proven by `server/src/constants.ts` `DATE_TYPES_WITH_EXPECTED_TIMESTAMPS`, the
GraphQL `TZDate` write path, and the `timezone('America/New_York', date_trunc('day', ...))`
triggers in `server/src/sql/functions.sql`; every consumer renders back through
Eastern (`AT TIME ZONE 'America/New_York'` in SQL, browser-local in the client),
so midnight UTC displays as the prior day. Fixed by anchoring every date-only
value at write time via new helpers `migration.eastern_day_start` /
`migration.eastern_day_end` (`00_init/03_helper_fns.sql`, SQL/STABLE/STRICT)
across loaders `10_stg/25` (17 milestone values), `10_stg/22`, `10_stg/24`,
`10_stg/28`, `10_stg/30`, and tag windows `21_app_associative/10`-`13`; true
instants (`created_at`/`updated_at`) untouched. The amendment name render
(`20_app/35`, `99_parity/52`) now wraps `to_char(effective_date, ...)` in
`AT TIME ZONE 'America/New_York'`, and the Federal Comment cutover constant was
re-anchored to Eastern midnight (`'2026-08-20 00:00:00-04:00'`) in
`23_app_derived/50` + `99_parity/56`. The Postgres session is also pinned to UTC
(`lib.py` `pg_dsn()` `options=-c timezone=UTC`; pgloader `timezone to 'UTC'`) as
defense-in-depth. Sweep found and included two beyond the initial enumeration:
`10_stg/24` (pending effective/expiration) and `10_stg/28` (deliverable due_date).
The DuckDB `pmda_exporter.py` `datetime`->naive `timestamp` divergence is a
separate, non-load-path issue -- left as a handoff recommendation to the
data-tools team (DEMOS + pgloader remain source of truth). Full write-up:
`reports/narrative/timestamp_timezone_audit.md`.

2026-07-15 sme-review-exports: Branch 5 (last coding branch of the 2026-07-10
SME-answers stack) adds `scripts/sme_review_exports.py` (`make sme_review_exports`),
an operator-run exporter that closes two open SME action items. `othr-names`
exports the held free-text "Other" program-detail names from
`migration._parity_pgm_dtl_tag_othr_held` for SDG review; `comments-snapshot`
snapshots the seven non-deliverable comment tables PMDA keeps but DEMOS drops
(`mdcd_demo_cmt`, `mdcd_demo_amndmt_cmt`, `mdcd_demo_rnwl_cmt`, `mdcd_pgm_cmt`,
`mdcd_demo_finl_dcsn_dtl_cmt`, `mdcd_demo_pgm_mntrg_doc_cmt`,
`bdgt_ntrlty_fil_doc_cmt`), normalizing their heterogeneous columns into one set
with a `deleted` column (all rows kept, per SME "snapshot works"). Both write
run-stamped CSVs to the gitignored `reports/runs/` (the comment text is
potentially sensitive, so outputs are shared with SDG out-of-band, never
committed). Query tier takes a live connection (DB-tested via `pg_db`); an
entirely absent source dies rather than emit an empty CSV. The remaining open
SME items carry no branch and are routed to owners (David/Vivian/SDG); see
`reports/narrative/pending_approved_decisions.md`.

2026-07-15 deliverable-loader-live (doc reconciliation): the deliverable family
is no longer blocked -- superseding the 2026-06-24 "0 rows today" /
"only hard blocker: deliverable_type" entries above and any "still-blocked
deliverable loader" phrasing in the 2026-07-10 SME-answers entry. The
`deliverable_type` crosswalk is authored and registry-wired
(`04_crosswalks/52_deliverable_type.sql` + `reports/crosswalks/deliverable_type.csv`):
per the correction banner in
`reports/crosswalks/proposed/deliverable_type_bn_routing.md`, the legacy
report-occurrence code maps directly to `demos_text_id` (no BN matrix), so
`20_app/40_deliverable.sql` loads (its remaining RETURN is only a defensive
partial-crosswalk-build guard) and `20_app/50_comment.sql` cascades deliverable
comments into `private_comment`/`public_comment`. Consequence for the workflow-8
follow-up: the semi-annual BN -> Quarterly override is no longer "gated behind
the still-blocked deliverable loader" -- it can be profiled directly (rpt_ocrnc
code 6 'Semi-Annually' seen only on soft-deleted rows today; add a
`bdgt_ntrlty_ind` override only if live rows appear). Still deferred: the seven
non-deliverable comment sources (Branch 5 exports the snapshot; fate is an SME
call), `cmt_orgn_cd` route authoring (SDG), the `document` loader
(`document_type` fan-in), and `deliverable_extension`. Build-state row 6 in
`pending_approved_decisions.md` updated to BUILT.

2026-07-15 authorities-snapshot (workflow 5): resolved the one previously
outstanding blocking sign-off (the "waiver/expenditure DEMOS target model").
Grill + code investigation confirmed DEMOS has NO authority entity anywhere
(every `.prisma` model + all ~100 `demos/server/src/model/*` dirs; only the flat
tag strings "Expenditure Cap"/"Emergency Waiver Authority" exist, used by
workflow 4). The BN workbook path (`shared_library/src/BN/rulesets/*` ->
`budget_neutrality` JSONB, workflow 8) was evaluated and is separate/out-of-scope:
it carries only spend numbers keyed by a free-text "Waiver Name" (MBES Schedule
C), not the structured authority records; DEMOS owns BN ingestion. SME chose
snapshot-only (defer the loader), all tiers, BN separate. So no `demos_app`
loader is built; instead `scripts/sme_review_exports.py authorities-snapshot`
exports the full ~38-table corpus (instance/reference/library/bene-link/
program-detail tiers + history/load + pending mirrors), one verbatim CSV per
present table (all rows incl. soft-deleted; resolved `demonstration_id` where the
source has `mdcd_demo_id`) + a manifest flagging tier/history/pending/pgm_dtl
overlap. The map is drift-guarded against `reports/schema_snapshot/table_stats.csv`.
Two sub-questions are surfaced to the SME via manifest flags rather than decided
in code: the `mdcd_emer_wvr_authrty_pgm_dtl` workflow-4/-5 overlap
(`pgm_dtl_overlap=1`) and the deleted/history/pending fate. A real load, if the
SME later requires one, is a follow-up workflow (net-new DEMOS authority schema +
full scaffolding). See `pending_approved_decisions.md` D5.

2026-07-16 bn-out-of-scope (workflow 8): SME decided budget-neutrality is NOT
migrated -- DEMOS owns BN ingestion from uploaded workbooks. Users upload BN
workbooks (v2.14 format) into DEMOS, which validates them and writes
`demos_app.budget_neutrality_workbook` itself; the SME will translate the
existing v2.13 workbooks to v2.14 and upload them post-launch. This supersedes
the BN cluster (workflows 5-9 / branches 5-9) that had staged a migration-private
BN aggregate and validated it as a parity oracle, and it moots the
"semi-annual BN -> keep Quarterly" workflow-8 override recorded on 2026-07-10
(there is no BN load to override). The BN migration machinery was retired
(code + tests, verified green): deleted `sql/10_stg/60_budget_neutrality.sql`,
`sql/01_ddl_supplements/10_bn_workbook_detail.sql` (parity-oracle table +
CONSTRAINT TRIGGER), `sql/05_id_maps/12_mdcd_dlvrbl_fil_doc.sql`,
`sql/99_parity/03_jsonb_shape.sql` (+ its `_jsonb_shape` parity check; the check
position is left as a documented numbering gap), and
`reports/jsonb_schemas/budget_neutrality.schema.json`.
`sql/31_constraint_triggers/00_jsonb_validation.sql` now wires no trigger on any
table; the JSONB schema registry stays as generic infrastructure for the three
remaining reference schemas (`uipath_response`, `uipath_token_list`,
`application_validation`). The live `demos_app.budget_neutrality_workbook` table
is unchanged (empty at cutover, for DEMOS to fill). The
`budget_neutrality_ind` deliverable-type routing QA
(`sql/99_parity/43_deliverable_bn_qa.sql`) is unrelated to the BN corpus and
stays. See `pending_approved_decisions.md` D6 and the `[Unreleased]` CHANGELOG
"Removed" entry.
