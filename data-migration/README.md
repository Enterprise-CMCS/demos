# DEMOS Data Migration

MySQL CMS Medicaid Demonstrations -> DEMOS PostgreSQL warm cutover.

This repo is the executable form of the migration. The single canonical plan
lives in `docs/spec/canonical-spec.adoc`.

## Documentation

Comprehensive documentation lives in `docs/` (built with Asciidoctor). Build it
with `cd docs && make html` (or `make all` for HTML + deck), then open
`docs/build/README.html`.

- `docs/README.adoc` — landing page and reading guide.
- `docs/toc.adoc` — flat index of every page.
- `docs/operator/` — playbooks for the solo operator running the cutover.
- `docs/developer/` — guides for engineers extending the pipeline.
- `docs/sme/` — reference and how-to pages for the SME reviewing data decisions.
- `docs/spec/canonical-spec.adoc` — the single canonical migration plan.
- `docs/decks/cutover-day.adoc` — Reveal.js briefing deck.

## Layout

Nine directories, in the order data moves through them:

- `migration/` — the Python package: Typer CLI (`migrate <phase>`), shared
  helpers, one module per phase.
- `pgloader/` — load templates plus the two human-curated table lists.
- `sql/` — the numbered pipeline (`00_init` through `99_parity`). SQL is the
  source of truth for every transform; Python only orchestrates.
- `reports/` — curated inputs, generated audit artifacts, per-run output.
- `state/` — runtime gate files and rendered templates (gitignored).
- `runbooks/`, `scripts/`, `tests/`, `docs/` — playbooks, standalone tooling,
  three test tiers, and this documentation set.

Every path, including what is generated versus hand-edited, is enumerated and
build-checked in
[`docs/developer/reference-repo-layout.adoc`](docs/developer/reference-repo-layout.adoc).

## Architecture

The cutover is a layered pipeline: pgloader lifts MySQL into `mysql_raw`,
`sql/10_stg` reshapes it into `stg`, `sql/20_app` materializes `demos_app`, and
`sql/99_parity` proves the result against the source. Diagram and narrative:
[`docs/shared/architecture-overview.adoc`](docs/shared/architecture-overview.adoc)
(rendered into every book index). Stage-by-stage ownership:
[`docs/developer/reference-pipeline-stages.adoc`](docs/developer/reference-pipeline-stages.adoc).

## Sources of truth

These are the **human-curated** files. Every other file in the repo is either
generated, scaffolded, or runtime state. Edit these in review-friendly commits
with the rationale in the commit message. The enumerated checklist, with owner
and gate per file, is
[`docs/operator/reference-human-inputs.adoc`](docs/operator/reference-human-inputs.adoc).

| File | What it controls | Edited when |
|---|---|---|
| `.env` | Connection strings, healthz URL | Per-environment (never committed; template is `.env.example`) |
| `pgloader/drop_list.txt` | Tables skipped during pgloader full load | A MySQL table goes out of scope. Narrative in `reports/narrative/drop_list.md`. |
| `pgloader/delta_tables.tsv` | Tables re-pulled during cutover-day delta | A new mutable table lands in MySQL after the bulk load |
| `pgloader/schema.load`, `pgloader/delta.tmpl.load`, `pgloader/casts.load` | pgloader templates and the shared CAST block | Type-coercion or load-shape change |
| `reports/crosswalks/*.csv` + `reports/crosswalks/registry.yaml` | SME-confirmed code mappings, and the list of tables the crosswalks phase loads | A crosswalk is confirmed, corrected, or added |
| `reports/pgm_dtl_tag_mapping.csv` | SME-authored tag map driving the `21_app_associative` tag fold | New tag introduced |
| `reports/filter/keep_ids.csv`, `reports/filter/drop_ids.csv` | Force-keep / force-drop overrides on the row-level filter | The filter regexes misclassify a record |
| `reports/inputs/fk_overrides.yaml` | Manual patch layer over auto-generated FK candidates | A heuristic FK is wrong or needs operator confidence. See `migration/phases/fk_candidates.py`. |
| `reports/jsonb_schemas/*.schema.json` | Schemas loaded into the `migration.jsonb_schemas` registry by `migrate seeds`; parity oracles | A registered schema is introduced or reshaped |
| `reports/parity_accepted/*.csv` | SME-signed accepted-flag baselines the parity gates reconcile against | The SME accepts a new held-row set |
| `reports/narrative/*.md` | The decision record: drop-list rationale, history strategy, pending/approved decisions, and the append-only `reports/narrative/notes.md` | A decision lands or a surprise occurs |
| `runbooks/cutover.md`, `runbooks/rollback.md`, `runbooks/comms/` | Operator playbooks and stakeholder comms templates | The cutover procedure or messaging changes |
| `sql/01_ddl_supplements/` | Migration-private DDL on top of the Prisma artifact | A migration-private object changes (`demos_app` itself is Prisma-owned) |
| `sql/02_seeds_static/`, `sql/03_seeds_limiters/` | Repo-authored seeds and the hand-transcribed DEMOS validation-rule tables. `03_seeds_limiters` is empty: Prisma seeds the limiters. | A repo-owned reference value or transcribed rule changes |
| `sql/04_crosswalks/` | Crosswalk DDL plus the fail-closed `_check` queries (values come from the CSVs above) | A crosswalk table or check changes |
| `sql/10_stg/` | Stage-shaping transforms and the row-level filter | Source/target shape diverges |
| `sql/20_app/`, `sql/21_app_associative/`, `sql/23_app_derived/` | App-layer materialization | New entity, association, or derived row |
| `sql/30_constraints/`, `sql/31_constraint_triggers/`, `sql/32_app_triggers/`, `sql/40_indexes/`, `sql/50_sequences/` | Migration-owned constraints, triggers, indexes, sequence resets (Prisma FKs are captured and re-applied by `migrate constraints`) | A migration-owned invariant changes |
| `sql/99_parity/` | Parity SQL consumed by `migrate parity` | New parity dimension |
| `pyproject.toml`, `uv.lock`, `Makefile` | Dependencies, lock, operator-facing wrappers | Dep change or new target |

Generated and runtime files, never edited by hand: everything under `state/`,
`reports/generated/`, `reports/runs/`, `reports/rehearsals/`,
`reports/orphans/`, `reports/schema_snapshot/`, and `reports/reference_data/`.

## Bootstrap

Prerequisites: [`uv`](https://docs.astral.sh/uv/) for environment and dependency
management, Python 3.11 (newer interpreters work in dev, but lint and type
checking are pinned to 3.11 semantics and CI evaluates against it), PostgreSQL
16+ with `pgcrypto` / `uuid-ossp` / `pg_jsonschema`, and pgloader. DuckDB
arrives via `uv sync` and installs its own scanner extensions on first use.
Every environment variable is documented in
[`docs/operator/reference-environment.adoc`](docs/operator/reference-environment.adoc).

The Makefile pins `UV_PROJECT_ENVIRONMENT` to `~/.venvs/demos-migration` to keep
the venv out of iCloud-synced paths, which evict files and hang every `uv run`;
export your own to override (CI does).

```sh
cp .env.example .env                # fill in connection strings
make sync                           # uv sync --extra dev (creates the venv + installs)
make test                           # pytest + coverage
make spin_up                        # optional: throwaway local dev Postgres from .env
make init && make ddl               # roles, schemas, extensions, Prisma DDL + supplements
make load_full                      # pgloader pulls MySQL -> mysql_raw (drop list applied)
```

## Commands

Everything runs through `make` targets: thin wrappers around
`uv run migrate <phase>` (`uv run` auto-syncs the lockfile, so no manual venv
activation). `make help` prints the full screen; the entry points a newcomer
needs are:

```sh
make help                  # every target, grouped
make rebuild               # init -> ddl -> load_full -> seeds -> crosswalks -> id_maps -> build -> constraints -> parity
make status                # show gate state
make diagnose              # read-only triage report (parity + load-fidelity; no gates)
make sql-check             # SQL hygiene: pg_format check + sqlfluff lint + front-matter
make test-db-up            # throwaway Postgres for the live SQL harness
```

Cutover phases run in order: `preflight`, `freeze`, `delta`, `build`,
`constraints`, `parity`, `flip`, `smoke`, `decom`. Pass command flags via
`ARGS`, e.g. `make fetch_prisma ARGS="--refresh"`.
`./scripts/cutover.sh <phase>` is a thin shim forwarding to `uv run migrate`.

The authoritative command reference is generated from the CLI itself:
[`docs/operator/reference-cli.adoc`](docs/operator/reference-cli.adoc). Every
`make` target is documented in
[`docs/operator/reference-makefile.adoc`](docs/operator/reference-makefile.adoc),
and both are checked against the code on every docs build.

## Conventions, testing, and versioning

- **SQL conventions** — structured front-matter on every hand-written file,
  `pg_format` owning all layout and case, `sqlfluff` lint-only, the alias
  vocabulary, and the recurring domain literals:
  [`docs/developer/reference-sql-conventions.adoc`](docs/developer/reference-sql-conventions.adoc).
  Gate locally with `make sql-check`; it also runs as a pre-commit hook on
  staged SQL (`uv run pre-commit install` once, from the repository root).
- **Idempotency** — every stage is re-runnable on the same `mysql_raw`
  snapshot, but the mechanism is layer-specific: `CREATE OR REPLACE` for views
  and functions, `IF NOT EXISTS` for migration-owned DDL, `TRUNCATE` + `INSERT`
  for stage and app data, `ON CONFLICT DO NOTHING` for id maps so minted UUIDs
  survive a rebuild, and drop-recreate for crosswalk tables. Three places
  deliberately upsert with `DO UPDATE` to reconcile their own values:
  `sql/02_seeds_static/25_state_region.sql`,
  `sql/02_seeds_static/30_deliverable_action_chain.sql`, and the JSONB registry
  load in `migration/phases/init_pg.py`. Rationale and the full pattern table:
  [`docs/developer/explanation-idempotency.adoc`](docs/developer/explanation-idempotency.adoc).
- **Gating** — each phase requires the prior phase's `state/<phase>.ok` file:
  [`docs/operator/reference-gates-state.adoc`](docs/operator/reference-gates-state.adoc).
- **Testing** — three tiers (unit, live SQL harness, live MySQL + Postgres
  integration) with the commands and coverage story in
  [`docs/developer/howto-run-tests-locally.adoc`](docs/developer/howto-run-tests-locally.adoc).
- **Versioning** — Semantic Versioning driven by
  [Conventional Commits](https://www.conventionalcommits.org/), pinned in
  `pyproject.toml` and `migration/__init__.py`, with notable changes in
  `CHANGELOG.md` (Keep a Changelog). Current version: **0.7.0**.
