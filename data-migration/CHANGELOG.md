# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the project is pre-1.0, minor versions may carry new features alongside
behavior changes. Commit history follows [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added
- SME-review exports (`scripts/sme_review_exports.py`, `make sme_review_exports`)
  close two open SME action items with two run-stamped CSVs written to the
  gitignored `reports/runs/`. `othr-names` reads the parity view
  `migration._parity_pgm_dtl_tag_othr_held` and lists the free-text "Other"
  program-detail names held back from the demonstration-type tag fold (each a
  1115 demonstration name, not a category) for SDG review. `comments-snapshot`
  produces a reach-back snapshot of the seven non-deliverable comment tables the
  migration leaves in PMDA (`mdcd_demo_cmt`, `mdcd_demo_amndmt_cmt`,
  `mdcd_demo_rnwl_cmt`, `mdcd_pgm_cmt`, `mdcd_demo_finl_dcsn_dtl_cmt`,
  `mdcd_demo_pgm_mntrg_doc_cmt`, `bdgt_ntrlty_fil_doc_cmt`), normalizing their
  heterogeneous columns into one set with a `deleted` column so soft-deleted rows
  stay visible; absent tables are skipped, and an entirely missing source dies
  rather than emit a misleading empty CSV. Default subcommand runs both.
- `authorities-snapshot` (a third `sme_review_exports.py` subcommand) delivers
  the SME-review snapshot for workflow 5 (waiver / expenditure authorities) and
  formally defers the loader. DEMOS models authorities nowhere (verified across
  the Prisma models and `demos/server/src`; "Expenditure Cap" / "Emergency
  Waiver Authority" exist only as flat demonstration-type tag strings), and the
  BN workbook path is a separate DEMOS-owned concern, so there is no target to
  load into. The subcommand snapshots the full ~38-table PMDA corpus (per-demo
  instances, reference lookups, library/catalog masters, bene-group links,
  program-detail overlaps, plus history/load and pending mirrors), one
  full-fidelity CSV per present table (verbatim `SELECT *`, all rows incl.
  soft-deleted; a resolved `demonstration_id` is appended where the source
  carries `mdcd_demo_id`), plus a manifest flagging each table's
  tier/history/pending/program-detail overlap for SME triage. The table set is
  drift-guarded against `reports/schema_snapshot/table_stats.csv`. Not part of
  the default `both`; run it explicitly. Outputs land in the gitignored
  `reports/runs/` and are shared out-of-band (potentially sensitive), never
  committed.
- Deliverables and their comments now migrate. The `deliverable_type` crosswalk
  is authored (`sql/04_crosswalks/52_deliverable_type.sql` +
  `reports/crosswalks/deliverable_type.csv`, registry-wired): the legacy
  report-occurrence code maps directly to `demos_text_id` with no BN matrix (see
  the correction banner in
  `reports/crosswalks/proposed/deliverable_type_bn_routing.md`), so the
  previously held-back `sql/20_app/40_deliverable.sql` now loads (the remaining
  RETURN is a defensive guard for a partial crosswalk build, not a block), and
  `sql/20_app/50_comment.sql` cascades each deliverable comment into
  `private_comment`/`public_comment` (routed by the still-gated
  `crosswalk_comment_origin` with an author-person-type fallback). Supersedes the
  0.5.0 "loads 0 rows today" note. Still deferred: the seven non-deliverable
  comment sources (exported as an SME snapshot via `make sme_review_exports`),
  `cmt_orgn_cd` route authoring, the `document` loader (`document_type`
  multi-source fan-in), and `deliverable_extension`.
- Pending demonstrations now migrate (workflow-7 reversal, per the 2026-07-10
  SME answers). `sql/10_stg/23_pendg_demo_fold.sql` classifies each PMDA-valid
  pending demo "approved wins" (folded / orphan_loadable / held_no_project);
  `sql/10_stg/24_pending_demonstration_resolved.sql` + the loader
  `sql/20_app/31_pending_demonstration.sql` load orphan pending demos (a project
  number, no approved counterpart) as their own 'Under Review' demonstration
  (chip_id always NULL; no source status column), folding matched pending demos
  into their approved counterpart and holding back no-project-number pending
  demos. The RED-4 duplicate-medicaid loser and any state absent from
  `state_region` are held back non-gating and logged in
  `migration._parity_pending_demonstration_held`.
- Fold-aware pending program-detail tags now load. `reports/pgm_dtl_tag_mapping_pending.csv`
  is populated with 68 rows derived mechanically from the filled base
  `pgm_dtl_tag_mapping.csv` (prefix-swap `mdcd_`->`mdcd_pendg_`, same tags + date
  columns; the source-absent `mdcd_pendg_fincl_pool_pgm_dtl` is dropped -- no new
  SME judgment), driven by `sql/04_crosswalks/47_pendg_pgm_dtl_tag.sql` + a
  `crosswalk_pendg_pgm_dtl_tag` registry entry. Two fold-aware loaders resolve the
  parent via `stg._pendg_demo_fold`: the fixed-tag
  `sql/21_app_associative/12_pending_demonstration_type_tag_assignment.sql` and the
  free-text "Other"
  `sql/21_app_associative/13_pending_demonstration_type_tag_othr.sql`. Parity
  `sql/99_parity/55_pendg_pgm_dtl_tag_othr_held.sql` logs held free-text "Other"
  rows (non-gating) and fail-closes on any mapped-but-unseeded tag -- mirroring the
  base 10/11/54 trio as pending 12/13/55.
- Milestone dates and per-phase status now migrate (per the 2026-07-10 SME
  answers). `sql/10_stg/25_application_milestone.sql` is a source-only tall
  crosswalk mapping every high-confidence legacy phase-milestone column (approved
  + pending demonstrations, both from `mdcd_demo_aplctn`) to a seeded DEMOS
  `date_type`; `sql/20_app/36_application_date.sql` (rewritten from approval-date-
  only) loads all of them into `demos_app.application_date`, and
  `sql/23_app_derived/50_application_phase.sql` derives the 8
  `demos_app.application_phase` rows per loaded demonstration (approved + pending)
  and amendment from the loaded `current_phase_id`. A Federal Comment past-window
  failsafe forces that phase to 'Completed' when its loaded end date is before
  cutover (`2026-08-20`, a single documented SQL constant) so the DEMOS nightly
  `update_federal_comment_phase_status()` cron cannot spuriously advance a window
  that closed by cutover. Parity `sql/99_parity/56_application_milestone.sql` logs
  the granular phase_3 clearance sub-dates + amendment dates deferred for SME
  review (non-gating) and fail-closes on the Federal Comment guard. The full
  legacy-column crosswalk + deferred columns are documented in
  `reports/narrative/milestone_date_mapping.md`.

### Changed
- Amendments resolve their parent fold-aware
  (`sql/10_stg/30_amendment_resolved.sql` LEFT JOINs `stg._pendg_demo_fold` and
  adds `parent_is_pending`); the loader (`sql/20_app/35_amendment.sql`) assigns
  'Under Review' to the 162 statusless pending-track amendments (LEFT JOIN the
  status crosswalk + COALESCE), and the fail-closed unmapped-status guard in
  `sql/99_parity/52_amendment_load.sql` mirrors the loader's drop condition so
  those pending-track amendments are not falsely flagged.
- Parity check 4 (`sql/99_parity/04_pending_approved.sql`) was redefined for the
  reversal: `leaked` now flags a must-not-load (folded / no-project) pending demo
  that nevertheless got its own demonstration row, and `pending_only_deferred`
  is the residual no-project-number set. `reports/parity_accepted/pending_approved_deferrals.csv`
  was repurposed as the SME-signed reversal record (former
  `no_approved_counterpart` rows removed because they now load).
- The demonstration loader (`sql/20_app/30_demonstration.sql`) no longer mints
  `chip_id`. Per the 2026-07-10 SME decision, CMS assigns CHIP ids and the DEMOS
  app owns `chip_id` (nullable column + post-load backfill), so the migration
  preserves the legacy 21-W number when present and otherwise leaves `chip_id`
  NULL instead of minting a `21-W-<seq>/<region>` fallback. It still advances
  `chip_id_number_seq` past every preserved legacy 21-W number so a later DEMOS
  backfill / in-app mint cannot collide with a preserved value. The demonstration
  flow-trace `chip_source` vocabulary changed from `preserved|minted` to
  `preserved|deferred` (deferred rows carry a NULL `chip_id`).
- All crosswalk values are now CSV-authored and loaded via the registry; no
  inline `INSERT`s remain in `sql/04_crosswalks`. The four formerly-inline
  crosswalks moved their values to load-ready CSVs:
  `reports/crosswalks/signature_level.csv`, `role_person_type.csv`,
  `deliverable_status.csv`, and `amendment_status.csv` (the matching
  `30/42/50/64_*.sql` files are now DDL only). This keeps SME-authored updates
  to a single CSV per domain. `reports/crosswalks/registry.yaml` now declares a
  `columns:` list per entry, passed to `copy_csv_into_table` as `header_expect`,
  so a renamed/reordered/missing CSV column fails closed instead of mis-loading.

### Removed
- Budget-neutrality migration machinery, per the SME decision that DEMOS owns
  BN ingestion from uploaded workbooks (the SME will translate the existing
  v2.13 workbooks to v2.14 and upload them post-launch). Deleted the staging
  aggregate `sql/10_stg/60_budget_neutrality.sql`, the migration-private parity
  oracle `sql/01_ddl_supplements/10_bn_workbook_detail.sql` (table + CONSTRAINT
  TRIGGER), the BN id-map `sql/05_id_maps/12_mdcd_dlvrbl_fil_doc.sql`, the
  parity view `sql/99_parity/03_jsonb_shape.sql`, the `budget_neutrality` JSON
  schema `reports/jsonb_schemas/budget_neutrality.schema.json`, and the
  `_jsonb_shape` parity check (its check position is left as a documented gap so
  the remaining check numbers stay stable). `sql/31_constraint_triggers/00_jsonb_validation.sql`
  now wires no trigger on any table; the JSONB schema registry stays as generic
  infrastructure for the three remaining reference schemas (`uipath_response`,
  `uipath_token_list`, `application_validation`). The live
  `demos_app.budget_neutrality_workbook` table is unchanged (DEMOS-owned; the
  migration leaves it empty for DEMOS to fill from uploads).
- Superseded unified role crosswalk: `sql/04_crosswalks/40_role.sql`,
  `41_role_check.sql`, and the `reports/crosswalks/proposed/role.proposed.csv`
  / `contact_type.proposed.csv` proposal sheets. The single overlapping
  `crosswalk_role` table was replaced by the per-grant-level split that is
  already live and registry-wired: `44/45_system_role` (`system_role.csv`),
  `46/47_demonstration_role` (`demonstration_role.csv`), and the self-contained
  `42/43_role_person_type`. This also removes a latent hazard -- because
  `run_crosswalks` globs every `*.sql`, the orphaned `41_role_check.sql` would
  have fail-closed on the permanently-empty `crosswalk_role` once `role_rfrnc`
  loaded, blocking the entire `crosswalks` phase.

### Added
- Developer wiki page `docs/developer/explanation-api-validator-conformance.adoc`:
  a design record (ADR) for validating migrated `demos_app` data against the
  DEMOS API validator before cutover -- rule inventory and three-bucket
  classification, the critical-versus-report severity split, a read-only
  conformance harness hosted in `../demos` (commit-pinned and shelled out, no
  Node toolchain added here), and a pre-flip `conformance` gate kept distinct
  from parity. Implementation is deferred until the date/phase/document
  loaders land.

### Fixed
- Date-only values are now anchored to **America/New_York**, matching the DEMOS
  convention, instead of being cast as midnight UTC (which rendered one day early
  for Eastern users). New helpers `migration.eastern_day_start` /
  `migration.eastern_day_end` in `sql/00_init/03_helper_fns.sql` wrap every
  calendar-date column at write time -- start-of-day for most types, end-of-day
  for `Completeness Review Due Date` and `Federal Comment Period End Date` (per
  `server/src/constants.ts` `DATE_TYPES_WITH_EXPECTED_TIMESTAMPS`). Applied across
  `sql/10_stg/25_application_milestone.sql` (17 milestone values),
  `sql/10_stg/22_demonstration_resolved.sql`,
  `sql/10_stg/24_pending_demonstration_resolved.sql`,
  `sql/10_stg/28_deliverable_resolved.sql`,
  `sql/10_stg/30_amendment_resolved.sql`, and the tag validity windows in
  `sql/21_app_associative/10`-`13`. True instants (`created_at` / `updated_at`)
  are left untouched. The amendment name-synthesis render
  (`sql/20_app/35_amendment.sql`, `sql/99_parity/52_amendment_load.sql`) now
  wraps `to_char(effective_date, ...)` with `AT TIME ZONE 'America/New_York'`, and
  the Federal Comment cutover constant was re-anchored to Eastern midnight
  (`'2026-08-20 00:00:00-04:00'`) in `sql/23_app_derived/50_application_phase.sql`
  and `sql/99_parity/56_application_milestone.sql`. See
  `reports/narrative/timestamp_timezone_audit.md`.
- The migration now pins its Postgres session to UTC (defense-in-depth):
  `migration/lib.py` `pg_dsn()` appends `options=-c timezone=UTC` and the pgloader
  scripts (`pgloader/schema.load`, `pgloader/delta.tmpl.load`) add
  `timezone to 'UTC'`, so the run is deterministic on any host and the 16 audit
  `datetime` columns convert to `timestamptz` deterministically.

## [0.7.0] - 2026-06-25

Removes the P4 history backfill: per the SMEs, the `demos_app.*_history`
tables do not have to be populated at cutover. They ship empty (created by
the Prisma DDL) and the DEMOS `log_changes_*` capture triggers fill them
post-cutover. The cutover gate sequence collapses from
`build_app -> history -> constraints` to `build_app -> constraints`.

### Removed
- `migration/phases/history.py` and the `migrate history` CLI command.
- `sql/22_app_history/` (10 snapshot transforms + README + `.gitkeep`).
- The `history` gate and its entry in `PHASES`, the resume map, and the
  root Makefile.

### Changed
- `migrate constraints` now `requires="build_app"` (was `requires="history"`).
- Flow-trace tooling (`table_flow_trace.py`, `table_flow_to_adoc.py`) no
  longer emits a `demonstration_history` stage.
- `reports/narrative/history_strategy.md` rewritten: the migration does NOT populate
  history; DEMOS owns the tables and its capture triggers fill them
  post-cutover.
- Extensive docs rewrite across operator, developer, SME, and spec pages
  reframing history as "DEMOS-owned, not migrated."
- `CODE_REVIEW.md` findings S3 and the `22_app_history` idempotency row
  marked resolved/moot.

## [0.6.0] - 2026-06-25

Adds the first per-table migration-flow reference for `demonstration`, backed
by drift-guarded generators and a PG-only end-to-end trace harness.

### Added
- Operator reference `reference-demonstration-flow.adoc`: prose plus a
  hand-authored Mermaid funnel and four generated partials (column contract,
  crosswalks, SQL stages, and a normalized live run trace) covering the full
  `mysql_raw.mdcd_demo` -> `demos_app.demonstration` path, with parity checks
  6/8/13.
- `docs/tools/table_flow_trace.py`: DB-gated emitter that replays the real
  pipeline against a curated `mysql_raw` fixture on a throwaway Postgres and
  writes a normalized run trace plus a committed manifest (UUIDs tokenized,
  minted chips masked, so output is byte-stable across reruns).
- `docs/tools/table_flow_to_adoc.py`: offline generator for the column,
  crosswalk, and stage partials, fail-closed on a missing crosswalk CSV or a
  renamed stage file.
- Curated all-branches fixture (`tests/sql/fixtures/demo_flow/`) plus live
  (`tests/sql/test_demonstration_flow_live.py`) and offline drift tests.
- Make targets `demonstration-flow-trace` (root) and `flow-pages` (docs, wired
  into `html`/`all`), with `make help`, docnav, and reference-makefile wiring.

## [0.5.0] - 2026-06-25

Unblocks the deliverable family against the re-pinned 26-migration DDL and
lands recent-migration fidelity fixes, on top of the RBAC, demonstration, and
crosswalk derivations accumulated since 0.4.1.

### Added
- Deliverable family: id-map (`migration._id_map_mdcd_dlvrbl`), source view
  `stg.deliverable_resolved`, and a held-back loader
  (`sql/20_app/40_deliverable.sql`) that loads 0 rows today and activates with
  no further change once the `deliverable_type` crosswalk is signed off, plus
  gating and non-gating parity checks (15/16/17). `scope_coverage` now reports
  `deliverable` as PARTIAL.
- Document family: inert, guarded scaffolds for the three-state
  deliverable-link routing (`check_deliverable_null_states`) and the
  `no_submitted_deliverable_cms_files` invariant, with the document and
  `deliverable_action` contracts documented in the cross-cutting derivation
  spec.
- Demonstration-level RBAC role-assignment derivation.
- Demonstration `sdg_division_id` population and parity scope dispositions
  (WP1, WP2).
- Inline `signature_level` and `deliverable_status` crosswalk mappings, and
  fail-closed amendment-status scaffolding.

### Fixed
- Demonstration loader now sets `status_updated_at = updated_at` to mirror
  DEMOS migration 20260616155913, instead of letting the NOT NULL DEFAULT
  stamp every migrated row with the cutover instant.
- Reconciled the RBAC role tables in derivability audit metadata.

### Changed
- Re-pinned the Prisma DDL to 26 migrations and refreshed the partials.
- SQL test harness reuses an already-running Postgres before spinning up a new
  container.

## [0.4.1] - 2026-06-23

Two production bug fixes surfaced by an expanded, hardened test suite:
`build_app` no longer wipes the Prisma-seeded lookups, and the parity gate
fails loudly instead of silently.

### Fixed
- `build_app` now drops the re-added `demos_app` FKs before truncating, so
  `TRUNCATE ... CASCADE` can no longer cascade through a validated FK into an
  excluded Prisma-seeded lookup and wipe it on a re-run (CODE_REVIEW H1).
- `run_parity` now hard-fails (non-zero exit) when the overall gate is RED, or
  PENDING without `--accept-pending`, instead of logging a warning and exiting
  0, so `make rebuild` and CI can no longer declare success over a non-green
  parity gate (CODE_REVIEW H2).

### Changed
- Test tooling: enabled Ruff's flake8-pytest-style (`PT`) rules, added
  `--strict-markers`/`--strict-config` and `filterwarnings = ["error"]` to
  pytest, added freeze/preflight failure-path coverage, and hardened the gate
  tests to assert the FATAL exit reason via captured stderr.

## [0.4.0] - 2026-06-23

Makes crosswalk mapping inputs CSV-canonical (single source via a shared COPY
helper and registry), derives the user-level RBAC tables, and fixes two
production bugs in the history backfill and JSONB schema validation.

### Added
- User-level RBAC derivation: `person_state` (from `user_authrzd_state_acs`,
  CMS/admin fan-out mirroring the DEMOS `assign_cms_user_to_all_states`
  trigger) and `system_role_assignment` (from `user_role_asgnmt` for the two
  System roles), with parity checks 9-11.
- Parity check flagging PMDA-resolved demonstrations missing from the
  `demonstration` load.

### Changed
- **BREAKING**: Crosswalk values now load from `reports/crosswalks/*.csv` via
  a shared `copy_csv_into_table` helper and `reports/crosswalks/registry.yaml`
  (the crosswalks phase runs create-DDL, COPY-CSV, run-checks). The
  `sql/04_crosswalks/*.sql` files are DDL-only (no `INSERT`); edit the CSV
  instead of the SQL. `system_role` gains a CSV; `pgm_dtl_tag_mapping` loads
  into `mysql_raw.crosswalk_pgm_dtl_tag` and drives the tag-assignment fold
  loop, honoring per-row `from_dt_col`/`to_dt_col` (fixes a latent divergence
  for non-standard source tables).
- Malformed filter-override CSVs now die instead of being silently skipped
  (CODE_REVIEW M2).
- Derivability audit console summary clarified with Rich tables.

### Fixed
- History backfill for `demonstration`, `amendment`, and `extension` now
  includes `status_updated_at` (NOT NULL on the history tables; previously
  omitted, violating the constraint added by Prisma migration
  `20260616155913`).
- `jsonb_matches_schema` calls in the JSONB schema registry now cast the
  schema argument to `json` (`pg_jsonschema` expects `(json, jsonb)`, not
  `(jsonb, jsonb)`).

## [0.3.0] - 2026-06-22

Derives the core DEMOS demonstration record from legacy CMS data and
de-stales the derivability tooling and audit.

### Added
- Demonstration derivation: a source-only staging view
  (`stg.demonstration_resolved`) and an app loader
  (`sql/20_app/30_demonstration.sql`) that mint `demos_app.application` and
  `demonstration` rows from the legacy `mdcd_demo` tables. Status promotes via
  the `demo_status` crosswalk (codes 2-9; code 1 `Pending` withheld pending
  SME), `current_phase_id` derives from the highest started legacy phase date,
  and `medicaid_id`/`chip_id` preserve legacy values or mint `21-W` numbers
  with a sequence pre-advance to avoid in-batch collisions. Fail-closed,
  idempotent, and trigger-free at build time.
- Fail-closed derivability verdicts for the ALTER-added `medicaid_id` and
  `chip_id` columns.

### Changed
- The schema replay behind the data-dictionary and source-target-column
  generators is now ALTER-aware via a shared `schema_model` engine, so the
  derivability and schema fragments no longer drift from the live schema.

## [0.2.0] - 2026-06-21

First versioned milestone since the initial skeleton: the MySQL CMS -> DEMOS
PostgreSQL warm-cutover pipeline is now feature-complete across schema
ingestion, staging, crosswalks, parity, and cutover guards.

### Added
- Prisma-owned DDL ingestion with a hash-pinned artifact, GitHub migration
  fetch, FK back-translation, and a `--refresh` cache bypass.
- Staging row-level allowlist filtering with SME override CSVs, PMDA-only demo
  ID enforcement, and `11-W-NNNNN/R` filter triage.
- Crosswalks for `application_type` and `sdg_division` identity maps, role /
  document / deliverable mappings, and a tag-pivot fold for demonstration tags.
- Users migration from MySQL users to DEMOS `person`/`users`, including
  `person_type` derivation from legacy role assignments.
- Budget-neutrality source enumeration with a parity staging step.
- Parity checks: JSONB-shape validation and reconstructed-FK orphan detection.
- Offline DuckDB analysis with Parquet companions and a `mysql_raw`
  load-fidelity check.
- Prod-schema drift guard before the rebuild `DROP`.
- Schema introspection via schema-snapshot and reference-data phases, plus
  DEMOS RDS DSN resolution from Secrets Manager.
- Documentation generators: reference data dictionary, schema diagrams with a
  drift check, Prisma migration analysis, derivability audit, column-mapping
  proposals, and `verify-doc-facts` doc verifiers.
- `make` ergonomics: Rich panels and banners, surfaced CLI flags with `ARGS`
  passthrough, and `spin_up`/`spin_down` for a local dev Postgres.

### Changed
- Ported orchestration from Bash to a `uv`-managed Python/Typer CLI.
- Replaced mypy with `ty` (Astral) for type checking.
- Renamed the target schema `app` -> `demos_app`.
- Relocated budget-neutrality validation off the live column.
- Injected the HTTP fetcher and healthz sleeper for testability.

### Fixed
- pgloader: map MySQL zero-dates to null, copy data in the full load (not
  schema-only), share one CAST block across full and delta loads, apply the
  drop list in the delta load, fail on reported table errors, and fail fast on
  a missing pgloader binary or `MYSQL_URL`.
- Schema/DDL: terminate each Prisma migration in the composed DDL, interpolate
  the table name in the seeded-table capture query, and drop-then-add FKs so
  the constraints phase is re-runnable.
- Crosswalks: disambiguate two legacy sources in `crosswalk_role` and re-check
  completeness against post-delta data.
- SQL: exclude soft-deleted demo-years and groups from the BN oracle and reject
  force-keep IDs absent from the source table.
- Cutover: probe healthz from an `Env` field and exit when unset; gate
  `build_stg` on delta to block a pre-freeze cutover.
- `lib`: default `psql_query` params to `None` to avoid a literal-`%` crash.

### Tooling, Tests & Docs
- Added a live-engine integration tier and SQL apply-twice harnesses on a real
  Postgres.
- CI runs the SQL harness against a Postgres service with a coverage floor and
  fails on data-dictionary drift.
- Extensive operator, developer, and SME documentation.

## [0.1.0] - 2026-05-05

### Added
- Initial migration repo skeleton (Week 1 deliverables) establishing the
  project structure, packaging, and baseline orchestration.

[0.7.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.6.0...v0.7.0
[0.6.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.5.0...v0.6.0
[0.5.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.4.1...v0.5.0
[0.4.1]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.4.0...v0.4.1
[0.4.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.3.0...v0.4.0
[0.3.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.2.0...v0.3.0
[0.2.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/compare/v0.1.0...v0.2.0
[0.1.0]: http://192.168.1.237:3000/zoekomrade/demos-data-migration/releases/tag/v0.1.0
