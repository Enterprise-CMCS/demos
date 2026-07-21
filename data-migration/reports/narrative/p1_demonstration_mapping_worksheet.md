# P1 demonstration mapping — decisions worksheet

Status: **awaiting SME confirmation** (no longer blocked on data). The
id-map foundation (`05_id_maps` + `10_stg/18,19_populate_*`) and the
corrected `mdcd_demo` / `mdcd_pendg_demo` filter views are done.

Source of truth for column facts: `reports/schema_snapshot/columns.csv`
(metadata snapshot of `cma_pro_11_1_000`). **Reference-table values are
now captured** in `reports/reference_data/` (68 `*_rfrnc` tables + 5
views, dumped by `migrate reference-data`). This unblocks authoring the
crosswalks — every value domain below is now known, so the skeletons are
replaced with concrete proposals for SME sign-off. The remaining true
blockers are (a) SME confirmation of the proposed code mappings and
(b) two `demonstration` NOT NULL columns the legacy schema does not carry
directly — `application_type_id` (now strongly indicated as the constant
`Demonstration`) and `current_phase_id` (now derivable from application-date
events) — see §2 and §6.

The DEMOS server codebase (`../demos/server/src`) has since been reviewed as
the **target-side source of truth**; its findings (phase-derivation rule,
`signature_level` CHECK, two-layer status, history triggers) are folded into
§2, §3, and the new §6.

---

## 1. Filter-layer schema mismatch (pre-snapshot placeholders)

The `sql/10_stg/` filter layer was authored before the schema snapshot and
references **identifiers that do not exist** in the real source. Only the
demonstration anchors matched their intended model; those two are now
fixed. The rest are **structural** mismatches, not simple renames, and are
deferred to their owning phase.

| Anchor / file | Assumed (placeholder) | Real (snapshot) | Status |
|---|---|---|---|
| `mdcd_demo` (`10_filter_demo.sql`) | `demo_id`, `demo_prjct_nbr`, `state_cd`, `crtd_dttm`, `demo_strt_dt` | `mdcd_demo_id`, `mdcd_demo_num`, `geo_ansi_state_cd`, `creatd_dt`, `state_prfmnc_yr_strt_dt` | **FIXED (P1)** |
| `mdcd_pendg_demo` (`11_filter_pendg_demo.sql`) | `demo_id`, `demo_prjct_nbr`, `state_cd`, `crtd_dttm`, `demo_strt_dt` | `mdcd_pendg_demo_id`, `mdcd_demo_num`, `geo_ansi_state_cd`, `creatd_dt`, `state_prfmnc_yr_strt_dt` | **FIXED (P1)** |
| `mdcd_demo_aplctn` (`12_filter_aplctn.sql`, block in `99_filter_report.sql`) | `aplctn_id`, `aplctn_prjct_nbr` | PK `mdcd_demo_aplctn_id`; **no application project number exists** — links via `mdcd_demo_id` / `mdcd_pendg_demo_id`; status `mdcd_demo_aplctn_stus_cd`, type `mdcd_demo_aplctn_type_cd` | **DEFER (P2)** — premise invalid; redesign filter around the linked demo's validity, not a project number |
| `mdcd_demo_amndmt` (`13_filter_amndmt.sql`) | (unreviewed) | verify against snapshot before P2 | **DEFER (P2)** |
| `mdcd_demo_rnwl` (`14_filter_rnwl.sql`) | (unreviewed) | verify against snapshot before P2 | **DEFER (P2)** |
| `mdcd_dlvrbl` (`15_filter_dlvrbl.sql`) | `dlvrbl_id`, `crtd_dttm`, `due_dt`, `d.demo_id` | `mdcd_dlvrbl_id`, `creatd_dt`, `dlvrbl_due_dt`, `mdcd_demo_id` (links to demo) | **DEFER (P3)** — same rename class as P1; model holds, snapshot-fixable |
| `mdcd_demo_cntct` (`16_filter_cntct.sql`, block in `99_filter_report.sql`) | `cntct_id`, `cntct_email_addr` (one row per contact) | keyed by `mdcd_demo_id`; **wide model** — per-role columns (`state_mdcd_drctr_email_adr`, `ro_fincl_lead_email_adr`, `sota_email_adr`, ...). No per-contact rows. | **DEFER (P5)** — also invalidates the "collapse on `cntct_email`" rule in `pending_approved_decisions.md` |
| `users` (`17_filter_user.sql`, block in `99_filter_report.sql`) | table `user_acct`; `user_id`, `user_nm`, `email_addr` | table `users`; `id`, `username`, `email`, `firstName`, `lastName`, `euaId` (camelCase) | **DEFER (P5)** — straight rename, but out of P1 scope |

> `sql/10_stg/99_filter_report.sql` defines a single cross-anchor view
> `stg._filter_violations`. Because Postgres validates every referenced
> column at `CREATE VIEW`, that view (and the deferred `12`–`17` filter
> files) **will not apply against the real schema** until the anchors above
> are reconciled. The demonstration id-map path does **not** depend on
> `_filter_violations`, so the P1 foundation is unaffected.

---

## 2. `demos_app.demonstration` required columns with no source mapping

Prisma's `demonstration` (from `state/prisma_ddl/<sha>.sql`) has columns
the current mapping (`reports/source_target_columns.csv`, 16 rows total)
does not cover. The transform cannot be written until each is decided.

| Target column | Null? | Default | Candidate source | Decision needed |
|---|---|---|---|---|
| `application_type_id` | NOT NULL | — | `mdcd_demo_aplctn.mdcd_demo_aplctn_type_cd` — values now known (`mdcd_demo_aplctn_type_rfrnc.csv`): 1=Demonstration, 2=Amendment, 3=Extension | **Resolved (confirm) — §6.3:** the GraphQL `Demonstration` type has no application_type field; amendments/extensions are separate entities, so every migrated demonstration takes the constant `'Demonstration'`. SME to ratify |
| `current_phase_id` | NOT NULL | — | derivable — DEMOS phases are date-driven (§6.1): legacy date columns → DEMOS date-types → max-`phaseNumber` started phase | **Now derivable — §6.1:** the rule is target-specified (highest started phase). Remaining SME item = a *legacy-date-column → DEMOS-date-type* crosswalk; fully-approved historical demos → `Approval Summary` |
| `status_id` | NOT NULL | — | `mdcd_demo.mdcd_demo_stus_cd` via `crosswalk_demo_status` | See §3 — **proposed mapping ready** (9 values), needs SME confirmation |
| `state_id` | NOT NULL | — | `mdcd_demo.geo_ansi_state_cd` via `crosswalk_state` | Done (identity crosswalk exists); 56 source values in `geo_ansi_state_rfrnc.csv` |
| `signature_level_id` | nullable | — | `mdcd_demo.mdcd_demo_aplctn_sgntr_lvl_cd` | **CHECK forces `'OA'` — §6.2:** `demonstration.signature_level_id` must be `'OA'` regardless of legacy code, so insert constant `'OA'`. The legacy crosswalk (OA/OCD only) governs amendments/extensions in P2; OGD/DD have no valid target anywhere |
| `sdg_division_id` | nullable | — | unclear (`mdcd_chip_div_cd`? RO division?) | Identify source, or leave NULL |
| `clearance_level_id` | NOT NULL | `'CMS (OSORA)'` | — | Accept the Prisma default unless source carries it |
| `name` / `description` | NOT NULL / null | — | `mdcd_demo_name` / `mdcd_demo_desc` | Done (direct copy) |
| `effective_date` / `expiration_date` | nullable | — | `state_prfmnc_yr_strt_dt` / `state_prfmnc_yr_end_dt` | Done (date -> timestamptz) |
| `created_at` / `updated_at` | NOT NULL | CURRENT_TIMESTAMP / — | `creatd_dt` / `updtd_dt` (nullable) | `updated_at` needs COALESCE(`updtd_dt`, `creatd_dt`) |

---

## 3. `demo_status` crosswalk — proposed mapping (needs SME confirmation)

All 9 legacy codes are now captured in
`reports/reference_data/mdcd_demo_stus_rfrnc.csv`. The valid DEMOS targets
(seeded in `state/prisma_ddl/<sha>.sql` -> `application_status`) are:
**`Pre-Submission`, `Under Review`, `Approved`, `Denied`, `Withdrawn`,
`On-hold`**. DEMOS has **no `Extended` / `Expired` / `Pending` stored
status** — the legacy "extension" lifecycle is modeled in DEMOS as separate
`extension` entities, and `Active` / `Expired` are a computed date overlay
(§6.1 / two-layer note below), not stored values. The DEMOS baseline seeds
were since mined to resolve this: codes 4/5/6/7 now all map to the stored
status `Approved`, leaving **code 1 as the only genuine judgment call**.

Proposed mapping (4 high-confidence, 5 medium; **no unresolved `low`/`none`
rows** — counts per `reports/crosswalks/proposed/archive/demo_status.proposed.csv`).
`dltd_ind` from the reference table is shown because only codes 2/6/9 are
active lookups today:

| legacy_cd | legacy_name | dltd_ind | proposed `application_status` | confidence | rationale / question |
|---|---|---|---|---|---|
| 1 | Pending | 1 | `Pre-Submission` | medium | pre-approval state; confirm vs `Under Review` |
| 2 | Approved | 0 | `Approved` | **high** | confirmed by `v_demo_status_dtl` (`stus_cd=2`) |
| 3 | Under Review | 1 | `Under Review` | **high** | direct |
| 4 | Extended | 1 | `Approved` | medium | no stored `Extended` status; `Active`/`Expired` computed from dates (`determineDemonstrationTypeStatus`); stored status = `Approved`, extension lifecycle surfaces via the separate `extension` entity |
| 5 | Temporarily Extended | 1 | `Approved` | medium | see code 4 |
| 6 | Expired | 0 | `Approved` | medium | no stored `Expired` status; `Expired` is a computed date overlay (`expiration_date < now`); stored status = `Approved` (it *was* approved) |
| 7 | Extension Pending | 1 | `Approved` | medium | extensions are a separate entity; a demo with a pending extension was already `Approved`, so stored status stays `Approved` (consistent with 4/5/6); the pending review surfaces via the extension's status, not the demo |
| 8 | Demonstration Hold | 1 | `On-hold` | **high** | direct |
| 9 | Withdrawn | 0 | `Withdrawn` | **high** | direct |

`Denied` is unused by this mapping (no legacy "Denied" demonstration
status; it exists at the *application* level — `mdcd_demo_aplctn_stus_cd`
6=Denied / 7=Disapproved, relevant to P2).

**Two-layer status (confirmed via `../demos`).** DEMOS stores `status_id`
(the `application_status` domain above) **and** separately computes a
display status `Pending` / `Active` / `Expired` at read time from
`effective_date` / `expiration_date`
(`demonstration/determineDemonstrationTypeStatus.ts`) — it is *not* a stored
column. This resolves codes 4/5/6: an `Extended` / `Temporarily Extended` /
`Expired` demonstration is stored as `Approved` (it *was* approved) and
surfaces as Active/Expired via the date overlay; no `Extended` / `Expired`
*stored* status is needed. The DEMOS baseline-seed review extended the same
logic to code **7 (`Extension Pending`)**: the demo was already `Approved`
and the pending review lives on the separate `extension` entity, so its
stored demonstration status stays `Approved`. Recommendation (proposals
updated): map codes **4, 5, 6, 7 → `Approved`** at medium confidence,
leaving **code 1 (`Pre-Submission` vs `Under Review`)** as the only
remaining genuine judgment call — pending SME confirmation.

Once SME confirms, transcribe into `reports/crosswalks/demo_status.csv`
(columns `legacy_int_cd,legacy_name,demos_text_id,notes`) and inline the
`INSERT` in `sql/04_crosswalks/10_demo_status.sql`. The completeness check
(`sql/04_crosswalks/11_demo_status_check.sql`) fails closed once
`mdcd_demo` is loaded with unmapped codes, so every code above must have a
row before `migrate crosswalks` passes.

---

## 4. Pending / approved collapse — contact key invalid

`reports/narrative/pending_approved_decisions.md` says contacts collapse "on
`cntct_email`". The real `mdcd_demo_cntct` / `mdcd_pendg_demo_cntct` tables
have **no `cntct_email` column** (wide, per-role model — see §1). The
collapse key for `demonstration_role_assignment` + `person` must be
redefined (per-role email columns) when P5 is scoped. The demonstration
collapse itself (`mdcd_demo` vs `mdcd_pendg_demo`, approved-wins) is
unaffected.

---

## 5. What is now deliverable (reference data landed)

Before the dump, the only derivable work was mechanical filter
reconciliation + id-maps. With `reports/reference_data/` populated, every
crosswalk *value domain* is known, so all crosswalks below can be authored
**now as SME-reviewable proposals** (legacy value -> proposed DEMOS value),
following the §3 pattern. Sizes are source row counts.

| Phase | Crosswalk(s) authorable now | Source reference file (`reports/reference_data/`) | Still blocked on |
|---|---|---|---|
| P1 | `demo_status` (9), `signature_level` (5), `state` (56, done) | `mdcd_demo_stus_rfrnc`, `mdcd_demo_aplctn_sgntr_lvl_rfrnc`, `geo_ansi_state_rfrnc` | SME confirm §3; `application_type_id` + `current_phase_id` derivation rules (§2) |
| P2 | application status (11), application type (3), amendment status (4), renewal status (4) | `mdcd_demo_aplctn_stus_rfrnc`, `mdcd_demo_aplctn_type_rfrnc`, `mdcd_demo_amndmt_stus_rfrnc`, `mdcd_demo_rnwl_stus_rfrnc` | Filter redesign — `mdcd_demo_aplctn` has no project number (§1); collapse model |
| P3 | deliverable status (17), type (8), confirmation status (3), acceptance status (7) | `mdcd_dlvrbl_stus_rfrnc`, `mdcd_dlvrbl_type_rfrnc`, `mdcd_dlvrbl_cnfrmtn_stus_rfrnc`, `mdcd_dlvrbl_acptnc_stus_rfrnc` | `15_filter_dlvrbl.sql` column fix; parent demonstration insert; comment-routing design |
| P5 | contact type (6), role (9) | `mdcd_demo_cntct_type_rfrnc`, `role_rfrnc` | Wide-contact collapse redesign (§4); `16/17` filter fixes |

**Net change:** the reference dump removed the "no value domains" blocker
across P1–P5. What remains is genuine design/SME work, not data
availability:

1. **SME confirmation** of proposed code mappings (§3 now resolves codes
   4/5/6/7 → `Approved` from the DEMOS baseline seeds; **code 1** is the only
   open judgment call).
2. **Two `demonstration` NOT NULL columns** with no source value —
   `application_type_id` (which of a demo's applications sets it?) and
   `current_phase_id` (phase-derivation rule). These still block the P1
   demonstration insert even after crosswalks land.
3. **Structural filter redesigns** — `mdcd_demo_aplctn` (no project
   number), `mdcd_demo_cntct` (wide per-role), `users` (camelCase). These
   are snapshot-derivable but were authored against a guessed schema.
4. **Target designs not yet specced** — deliverable comment routing (P3),
   `pgm_dtl` -> JSONB tag pivot (P4, ~80 families, mapping ~10/80 and one
   wrong table name), history backfill (P6, 182 `*_hstry` tables, depends
   on all of P1–P5).

## 6. DEMOS codebase findings (target-side source of truth)

Reviewed `../demos/server/src` (GraphQL/Prisma server). The 49 `*Schema.ts`
files are **GraphQL SDL** (graphql-tag) + TS interfaces; runtime validation
is **zod** (`validationUtilities.ts`, custom scalars `NonEmptyString` /
`DateTimeOrLocalDate`, `check*Functions.ts`). The rules binding on the
migration are the Postgres **CHECK constraints** in
`server/src/model/migrations/*/migration.sql` and the DEMOS-owned objects in
`server/src/sql/`. (`data/research/duckdb_exporter/ddls/*.sql` are **stale**
research artifacts — ignore; `reports/schema_snapshot/` stays the source
schema authority.)

### 6.1 Phase model — `current_phase_id` is derivable
- 8 phases, ordered by `phaseNumber`: Concept → Application Intake →
  Completeness → Federal Comment → SDG Preparation → Review →
  Approval Package → Approval Summary (`applicationPhaseConstants.ts`
  `PHASE_ACTIONS`; `Federal Comment` is `Not Permitted` for auto-transition).
- Phases are **event-driven**: a `phaseDateType` table maps each date-type →
  a phase; `startPhasesByDates.ts` starts a phase when its date exists
  (earliest `phaseNumber` wins). `current_phase_id` = the highest-numbered
  started phase.
- **Migration rule:** populate the demo's application dates, map each legacy
  date column → DEMOS date-type, take the max-`phaseNumber` started phase. A
  fully-approved historical demo (Approval Summary date present) →
  `Approval Summary`.
- **Remaining SME item** shrinks to a *legacy-date-column → DEMOS-date-type-
  name* crosswalk (the date-type names are the `dateToStart` / `dateToComplete`
  strings in `PHASE_ACTIONS`, e.g. `"Approval Summary Start Date"`).

### 6.2 `signature_level` CHECK — demonstration forced to `OA`
`migrations/20260602115947_check_signature_level`:
- `demonstration.signature_level_id` **must be `'OA'`** (`NOT NULL AND = 'OA'`).
- `amendment` / `extension`: `NULL` or `'OA'` / `'OCD'` only.
- **`OGD` is never valid** on any of the three; legacy `DD` has no target.

→ For P1, insert `signature_level_id = 'OA'` for **every** demonstration,
regardless of `mdcd_demo_aplctn_sgntr_lvl_cd`. The legacy→DEMOS crosswalk
governs only amendments/extensions (P2), where OGD/DD must collapse to NULL
or be rejected. See updated `proposed/signature_level.proposed.csv`.

### 6.3 `application_type_id` = `Demonstration` (confirmed)
The GraphQL `Demonstration` type carries **no** application_type field;
amendments and extensions are separate arrays/entities
(`demonstrationSchema.ts`). → every migrated demonstration gets the constant
`'Demonstration'`; amendment/extension types are set on their own rows in
P2. (SME to ratify.)

### 6.4 History triggers (P6)
DEMOS history is **trigger-driven**: per-entity `log_changes_<entity>()`
triggers write to `<entity>_history` with a `revision_type_enum`
(`I` / `U` / `D`) (`server/src/sql/history_triggers.sql`; re-installed by
`refreshDbObjects.ts`). Consequences for cutover: (a) the bulk load **must
disable these triggers** or every insert double-writes history; (b) any
history backfill writes `<entity>_history` directly with `revision_type='I'`.
The 182 legacy `*_hstry` tables map onto this shape in P6.

### 6.5 Other CHECKs to honor at insert
Whitespace checks on demonstration text + deliverable name
(`check_demonstration_text_whitespace`, `check_deliverable_name_whitespace`)
and person_type restriction references — the stg layer must trim/validate
before insert.

### 6.6 `medicaid_id` / `chip_id` (migration `20260602201004_add_medicaid_chip_id_values`)
Two new `demonstration` columns, both `NOT NULL` + `UNIQUE`. The DEMOS
migration backfills *existing* rows by **minting** from sequences joined to
`state.region` (`format('11-W-%s/%s', lpad(nextval(medicaid_id_number_seq),5,'0'), s.region)`
for medicaid; `21-W-...` for chip) — this is the app clone path and knows
nothing of PMDA's real numbers.

- `medicaid_id` ← PMDA `mdcd_demo.mdcd_demo_num` (`varchar(20)`). **High-confidence,
  data-grounded, important** — letting DEMOS mint instead would assign every
  demonstration a fake waiver number. Verify uniqueness before load.
- `chip_id` ← PMDA `mdcd_demo.mdcd_scndry_demo_num`. **Not a simple copy**: the
  source secondary number is *nullable* but the target is `NOT NULL` + `UNIQUE`.
  Mint a fallback (mirror `21-W-<seq>/<region>`) only where the source is
  missing, and advance `chip_id_number_seq` past our minted values so a later
  app insert cannot collide.
- **Timing:** populate both at *insert time*. The migration disables
  `prevent_changing_immutable_demonstration_fields` to backfill; that trigger
  blocks later changes, so a post-insert `UPDATE` would fail.
- Not yet in `reports/source_target_columns.csv` — blocked on refreshing the
  DEMOS model snapshot (`mmd_sql_compare/demos_data_model.mmd`) which predates
  this migration; the column-map lint requires the target column to exist there.
- Full per-pin statement inventory: `docs/shared/generated/prisma-migration-analysis.adoc`
  (generated by `docs/tools/prisma_migration_analysis.py`); see
  `docs/developer/reference-prisma-migration-analysis.adoc`.

---

## Sign-off

- Reviewer: __________________
- Date: __________________
- Notes: __________________
