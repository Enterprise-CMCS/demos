# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the project is pre-1.0, minor versions may carry new features alongside
behavior changes. Commit history follows [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Changed
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
