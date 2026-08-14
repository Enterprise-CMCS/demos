# Ownership Remediation Plan — reconcile migration repo with the DEMOS app repo

Status: **IMPLEMENTED** -- this plan has since been carried out: the
pipeline targets `demos_app` (D1), the history-shadow DDL was removed in
favour of Prisma's `*_history` tables (D2), and
`sql/31_constraint_triggers/00_jsonb_validation.sql` no longer wires
triggers on any live `demos_app` column (C4). **Subsequent update
(2026-06-25):** per the SMEs, the migration no longer populates the
`*_history` tables at all -- they are left empty for the DEMOS capture
triggers to fill post-cutover. The P4 `history` phase, `sql/22_app_history/`,
and the `history` gate were removed (superseding D2/D3/W3 below). Retained
as the historical analysis record; the conflict table in section 3
describes the *pre-remediation* state.
Author: automated analysis
Date: 2026-05-29 (status refreshed 2026-06-09)
Inputs:
- This repo: `/Users/zoeelkins/Documents/specs/demos-data-migration`
- DEMOS app (cloned): `/Users/zoeelkins/Documents/specs/demos`

## 1. Purpose

The DEMOS application repository is the source of truth for the target
database. Anything the DEMOS repo owns **supersedes** anything this
migration repo authors for the same concern. This plan enumerates the
ownership boundaries discovered by reading the DEMOS repo, the places
where this repo conflicts with or duplicates DEMOS-owned objects, and a
sequenced set of changes to bring the migration back inside its scope:
*populate an existing DEMOS database with transformed MySQL data — do
not author the schema and do not fabricate data.*

## 2. Evidence (what DEMOS owns)

| # | DEMOS artifact (path in `/specs/demos`) | What it owns |
|---|---|---|
| E1 | `server/src/model/migrations/20260312131729_prisma_init_baseline/migration.sql` | `SET search_path TO demos_app`; `CREATE TYPE revision_type_enum AS ENUM ('I','U','D')`; **all `*_history` tables** (`revision_id` PK + `revision_type`). |
| E2 | `server/src/model/migrations/*/migration.sql` (7 migrations) | Parent tables, columns, FKs, indexes, sequences, enums, **and lookup seed rows** (`INSERT INTO` in baseline + `…_create_reference_system_tables` + `…_state_updates_and_fixes`). |
| E3 | `server/src/sql/history_triggers.sql` (2,250 lines) | History capture: `log_changes_*()` functions + triggers on `demos_app.*`. |
| E4 | `server/src/sql/functions.sql` (45 KB) | Application DB functions. |
| E5 | `server/src/sql/utility_views.sql` | Application views. |
| E6 | `server/src/sql/permissions.sql` | Grants / privilege model on `demos_app`. |
| E7 | `server/src/sql/cron_schedules.sql` | `pg_cron` jobs. |
| E8 | `server/src/refreshDbObjects.ts` | Orchestrates applying E3–E7 **after** Prisma migrations. These are NOT Prisma migrations. |
| E9 | `server/src/seeder.ts` (uses `@faker-js/faker`) | Dev/fixture data generation (random demonstrations, tags, deliverables). Dev-only. |

Negative finding (important): a full-tree search of `server/` for
`pg_jsonschema` / `jsonb_matches_schema` / `json_matches_schema` returns
**no matches**. DEMOS stores `validation_data jsonb` etc. with **no
database-level JSON-schema enforcement**.

## 3. Conflicts in this repo

| ID | This repo | Conflict with DEMOS | Severity |
|---|---|---|---|
| C1 | Everything targets schema `app` (`migration/lib.py`, `phases/*`, `sql/*`) | Real schema is `demos_app` (E1). Pipeline builds into a schema Prisma never creates. | **Breaking** |
| C2 | `sql/01_ddl_supplements/10_history_shadows.sql` creates 32 `app.*_history` tables with `history_id`/`op`/`recorded_at` | Prisma already creates `demos_app.*_history` with `revision_id`/`revision_type` (E1). Different shape, same names. | **Breaking** |
| C3 | Planned `sql/32_app_triggers/` (history capture) | DEMOS owns capture via `history_triggers.sql` (E3). | High |
| C4 | `sql/31_constraint_triggers/00_jsonb_validation.sql` + `migration.jsonb_schemas` registry attach constraint triggers to `app.*` JSONB columns | DEMOS deliberately does **no** in-DB JSONB validation (§2 negative finding). We impose behavior on their tables they chose not to have. | Medium (scope) |
| C5 | `sql/00_init/01_schemas.sql` sets GRANTs + `ALTER DEFAULT PRIVILEGES` on `app` | DEMOS owns its privilege model via `permissions.sql` (E6) on `demos_app`. | Medium |
| C6 | `fetch_prisma` pulls only `model/migrations/*/migration.sql` | E3–E7 (history triggers, functions, views, permissions, cron) are NOT fetched/applied; a faithful stg clone needs them, but they are DEMOS deploy artifacts. | Medium (coordination) |
| C7 | `phases/init_pg._capture_fks` filters `nspname = 'app'`; `run_ddl` does `DROP SCHEMA app CASCADE; CREATE SCHEMA app` | Wrong schema; FK capture would return nothing and the manual schema create is redundant (Prisma creates `demos_app`). | **Breaking** (subsumed by C1) |

## 4. Ownership decisions (ratify before implementing)

- **D1.** Target schema is `demos_app`. This repo renames all references.
- **D2.** `*_history` tables and `revision_type_enum` are DEMOS-owned.
  This repo deletes its shadow DDL. *(Superseded 2026-06-25: the
  migration no longer backfills into Prisma's tables either; they are
  left empty for the DEMOS capture triggers to fill post-cutover.)*
- **D3.** History capture triggers are DEMOS-owned. This repo authors no
  history triggers. *(Superseded 2026-06-25: the migration no longer
  backfills history at all, so the "backfill runs while triggers are
  absent" ordering concern is moot.)*
- **D4.** In-DB JSONB validation is NOT part of DEMOS. This repo demotes
  JSONB schema checks to migration-private *parity* validation; it does
  not attach triggers to `demos_app.*`.
- **D5.** DEMOS post-migration objects (functions, views, permissions,
  cron, history triggers) are applied by DEMOS tooling (`refreshDbObjects.ts`),
  not by this repo. This repo documents the required apply order.
- **D6.** The faker `seeder.ts` is dev-only and must never run against a
  migration target. Reference/lookup rows come from Prisma `INSERT`s.
- **D7.** `migration.state_region` stays (DEMOS `state` has only
  `id`/`name`; no `region`). Migration-private, never pushed to `demos_app`.

## 5. Remediation workstreams (sequenced)

### W1 — Schema rename `app` → `demos_app` (Breaking; do first)
Touch points (verified by grep):
- Python: `migration/lib.py`, `phases/init_pg.py`, `phases/build.py`,
  `phases/constraints.py`, `phases/parity.py`, `phases/history.py`,
  `phases/fk_candidates.py`, `phases/fetch_prisma.py`, `cli.py`.
- SQL: `99_parity/10_demonstration_id_provenance.sql`,
  `00_init/01_schemas.sql`, `04_crosswalks/10_demo_status.sql`,
  `04_crosswalks/20_state.sql`, `31_constraint_triggers/00_jsonb_validation.sql`,
  `02_seeds_static/25_state_region.sql`, plus READMEs.
Specific edits:
- `init_pg.run_ddl`: **remove** `DROP SCHEMA IF EXISTS app CASCADE; CREATE SCHEMA app;`
  (Prisma's baseline creates `demos_app`). If a reset is still wanted,
  reset `demos_app` only after confirming Prisma recreates it.
- `_capture_fks`: change `WHERE … nspname = 'app'` to `'demos_app'`.
- `_capture_seeded_tables`: change `table_schema = 'app'` / `app.%I`
  to `demos_app`.
- `build_app`: `truncate_schema_data(env, "demos_app", …)`.
- Confirm `app_ro`/`app_rw` USAGE re-grant logic targets `demos_app`
  (see W5 — may be superseded by `permissions.sql`).
Verification: `migrate ddl` against an ephemeral PG produces tables under
`demos_app`; `\dt demos_app.*` non-empty; FK capture file non-empty.

### W2 — Remove superseded history-shadow DDL (Breaking)
- Delete `sql/01_ddl_supplements/10_history_shadows.sql`.
- Update `sql/01_ddl_supplements/README.md` to state history tables are
  Prisma-owned.
- Confirm `01_ddl_supplements/00_jsonb_schema_registry.sql` keeps only
  the `migration.*` registry/objects (see W4).
Verification: after `migrate ddl`, `demos_app.amendment_history` exists
with columns `revision_id`, `revision_type`, … (Prisma shape), and no
duplicate/conflicting definition is applied by this repo.

### W3 — ~~Rewrite history backfill to DEMOS shape~~ (Superseded 2026-06-25)
*This workstream was implemented (10 snapshot transforms in
`sql/22_app_history/`) and subsequently **removed entirely**. Per the
SMEs, the migration does not populate the `*_history` tables; they ship
empty for the DEMOS `log_changes_*` capture triggers to fill
post-cutover. The P4 `history` phase and `history` gate were also
removed; cutover collapses to `build_app -> constraints`.*

### W4 — Demote JSONB validation to migration-private parity (scope)
- Remove `sql/31_constraint_triggers/00_jsonb_validation.sql` triggers on
  `demos_app.*` (D4). Keep the `migration.jsonb_schemas` registry +
  `jsonschema` checks as a **parity** dimension in `phases/parity.py` /
  `sql/99_parity/` only.
- Update `reports/jsonb_schemas/README`-level docs and
  `docs/developer/reference-jsonb-schema-registry.adoc` accordingly.
Verification: no triggers exist on `demos_app` JSONB columns after a full
build; parity still reports JSONB-shape pass/fail.

### W5 — Reconcile grants with DEMOS `permissions.sql` (coordination)
- Compare `sql/00_init/01_schemas.sql` against `server/src/sql/permissions.sql`.
- Decision needed: either (a) this repo only ensures the migration role
  can build, and DEMOS `permissions.sql` sets the final app-role grants,
  or (b) keep a minimal grant here that does not contradict DEMOS.
Verification: after DEMOS `permissions.sql` runs, `app_ro`/`app_rw` (or
the DEMOS-named roles) have exactly the privileges DEMOS expects.

### W6 — Document the post-Prisma apply boundary (coordination)
- Add a note to `docs/spec/canonical-spec.adoc` and `runbooks/cutover.md`:
  the DEMOS deploy applies `refreshDbObjects.ts` (history triggers,
  functions, views, permissions, cron). Define the cutover order:
  1. Prisma migrations (this repo fetches + applies, or DEMOS applies)
  2. this repo's `mysql_raw` load → `stg` → `demos_app` build (triggers
     absent; `*_history` tables left empty for DEMOS to populate)
  3. DEMOS `refreshDbObjects.ts` for live operation
- Confirm with the DEMOS team **who** runs step 1 and step 3 against stg.
Verification: runbook reflects the agreed order; a stg dry run follows it.

### W7 — Guardrails / docs
- Add to `reports/narrative/notes.md` and `CODE_REVIEW.md` the ownership decisions
  D1–D7 and the faker-seeder prohibition (D6).
- Update `APPS.md` target-DB row (`demos_app`, not `demos_migration`/`app`).

## 6. Suggested order & dependencies

```
W1 (rename) ──┬─► W2 (delete shadows) ──► ~~W3 (backfill rewrite)~~ [superseded]
              ├─► W4 (jsonb demote)
              ├─► W5 (grants)
              └─► W6 (apply-order docs) ──► W7 (guardrails/docs)
```

W1 and W2 are breaking and unblock everything; do them together. W3
depends on both. W4/W5/W6/W7 are independent of W3 and can proceed in
parallel after W1.

## 7. Open questions for the DEMOS team

1. Is `demos_app` the schema name in **all** environments (stg/prod), or
   is it parameterized? (Drives whether the rename should be a config var.)
    Answer: `demos_app` is the schema name in all environments.
2. Who applies `refreshDbObjects.ts` (E8) against the staging clone — the
   DEMOS deploy or this migration's operator?
    Answer: If the staging clone is managed by the data migration operator, `refreshDbObjects.ts` should be applied by the data migration operator.
3. ~~Should history backfill set `revision_type = 'I'` for every initial
   row, or is there a preferred convention for migrated history?~~
    ~~Answer: Yes, `revision_type = 'I'` should be set for every initial row.~~
    *(Superseded 2026-06-25: the migration no longer backfills history.
    The `*_history` tables are left empty for the DEMOS capture triggers.)*
4. Are the DB roles `app_ro`/`app_rw` (our names) the same as DEMOS's
   expected roles, or do we adopt DEMOS's role names from `permissions.sql`?
    Answer: We adopt DEMOS's role names from `permissions.sql`.
5. Confirm DEMOS does not want any in-DB JSONB validation (so W4 is safe).
    Answer: I am unsure at the moment.

## 8. Out of scope (unchanged, still owned by this repo)

`mysql_raw` pgloader load, `stg` transforms, `migration._id_map_*`,
crosswalks, row-level filters, demonstration-ID provenance invariant,
`migration.state_region`, parity (incl. JSONB-shape parity), and the
gated cutover orchestrator.
