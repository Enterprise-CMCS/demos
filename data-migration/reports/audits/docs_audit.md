# Documentation accuracy + stale-reference audit

Fine-tooth-comb audit of the documentation set (`docs/**`) plus the
repo-root `README.md`, `runbooks/**`, and the hand-authored narrative
docs under `reports/`. Every finding below was verified line-by-line
against the live codebase (`migration/`, `sql/`, `pgloader/`,
`Makefile`, `docs/tools/`).

- **Date:** 2026-06-09
- **Method:** exhaustive line-by-line; propagation-first (shared snippets first)
- **Fix policy:** generated pages are flagged, not hand-edited (regenerated via their tool); everything else is corrected.

## Ground-truth snapshot (authoritative)

| Fact | Value |
|---|---|
| Target PG schema | `demos_app` (NOT `app`) |
| Other schemas | `mysql_raw`, `stg`, `migration` |
| PG database | `demos_migration` |
| `lib.PHASES` | preflight, freeze, delta, build_stg, build_app, history, constraints, parity, flip, smoke, decom |
| CLI commands | init, fetch-prisma, fetch-prisma-schema, ddl, seeds, crosswalks, id-maps, load-full, fk-candidates, schema-snapshot, reference-data, preflight, freeze, delta, build, history, constraints, parity, flip, smoke, decom, rollback, resume, status |
| Env fields (`Env`) | PG_URL, MYSQL_URL, MYSQL_DB, PG_DB, PRISMA_REPO, PRISMA_REPO_REF, PRISMA_MIGRATIONS_PATH, PRISMA_SCHEMA_PATH, GITHUB_TOKEN; + MIGRATE_NONINTERACTIVE; + NEW_APP_HEALTHZ_URL (read directly in flip.py) |
| `build.py` truncation | `truncate_schema_data(env, "demos_app", ...)` and `"stg"` |
| Removed | `sql/01_ddl/` (DDL fetched from Prisma; supplements in `sql/01_ddl_supplements/`) |
| `00_jsonb_validation.sql` | ships **no** trigger on any live `demos_app.*` column; BN trigger is on `migration.bn_workbook_detail`; uipath/application_validation unwired |
| SQL dirs gitkeep-only | 20_app, 21_app_associative, 23_app_derived, 30_constraints, 32_app_triggers, 40_indexes, 50_sequences, 03_seeds_limiters |
| SQL dirs populated | 00_init(5), 01_ddl_supplements(2), 02_seeds_static(1), 04_crosswalks(4), 05_id_maps(3), 10_stg(13), 22_app_history(8), 31_constraint_triggers(1), 99_parity(1) |

> Note: `sql/20_app/`, `sql/21_app_associative/`, `sql/23_app_derived/`
> (directory names) and the `build_stg` / `build_app` sub-phase names
> are **correct** and must not be "fixed" to `demos_app`.

## Legend

- **Problem class:** `schema-name` · `removed/renamed-path` · `phase/CLI/Make mismatch` · `env-var` · `file/table/column ref` · `stale-status/date` · `broken-xref/anchor` · `toc-completeness` · `generated-doc-drift` · `cosmetic/typo`
- **Severity:** `high` (wrong/misleading) · `medium` (stale, recoverable) · `low` (cosmetic)
- **Status:** `open` · `fixed` · `flagged (generated)`

## Generated pages register (flag-only; regenerate, do not hand-edit)

| Page / fragment | Regen command | Generator |
|---|---|---|
| `docs/operator/reference-cli.adoc` | `make cli-ref` | `docs/tools/cli_to_adoc.py` (`migrate --help`) |
| `docs/shared/generated/schema-*.adoc` (5) | `make schema-diagrams` | `docs/tools/schema_diagrams_to_adoc.py` |
| `reports/source_target_columns_{coverage,sections,table}.adoc` | `make column-map` | `docs/tools/source_target_columns_to_adoc.py` |

> `docs/developer/reference-data-dictionary.adoc` is **hand-maintained**
> (no generator emits it; `data_dictionary_to_xlsx.py` only produces an
> `.xlsx`), so its drift is fixed in place, not flagged.

---

## Book 1 — shared/ (propagates into every book via `include::`)

### shared/glossary.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 8 | `app:: Final DEMOS schema. Built from \`stg\` by \`sql/20_app/*\`` | schema-name | rename glossary term `app` -> `demos_app` (keep `sql/20_app/*`) | high | fixed |
| ~32 | parity entry: "comparing MySQL and the new app schema" | schema-name | "...the new `demos_app` schema" | medium | fixed |

### shared/architecture-overview.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 11 | mermaid `S -->|sql/20_app/| A[app DEMOS]` | schema-name | node label `app DEMOS` -> `demos_app` (keep edge label `sql/20_app/`) | high | fixed |

### shared/schema-overview.adoc
- clean (uses `demos_app` throughout; Prisma ownership accurate).

### shared/pipeline-stage-map.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| stage 31 row | "DEMOS `CONSTRAINT TRIGGER`s (added late)" | file/table/column ref | 31 ships only the migration-private JSONB trigger on `migration.bn_workbook_detail`; reword ("migration-private JSONB validation trigger") | low | fixed |
| stage 32 row | "App triggers (history-on-UPDATE, etc.)" | stale-status | 32 is intentionally empty (DEMOS owns history triggers via `refreshDbObjects.ts`); note it is empty | low | fixed |

---

## Book 2 — spec/

### spec/canonical-spec.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 91 | §2 mermaid `S -->|sql/20_app/| A[app DEMOS]` | schema-name | node label -> `demos_app` | high | fixed |
| ~340-352 | §8 `phases/` listing | file/table/column ref | add modules `fetch_prisma.py`, `fetch_prisma_schema.py`, `schema_snapshot.py`, `reference_data.py`; `init_pg.py` comment says "indexes / sequences" but those run in `constraints.py` | medium | fixed |
| §8 reports/ layout | `fk_final.sql` | removed/renamed-path | file does not exist; Prisma-superseded (FKs ship in artifact). Remove/annotate | medium | fixed |
| §8 reports/ layout | `parity_baseline.md` | file/table/column ref | file does not exist; remove | low | fixed |
| §8 reports/ layout | `crosswalks/mdcd_demo_stus_rfrnc.csv`, `mdcd_dlvrbl_stus_rfrnc.csv` | file/table/column ref | actual crosswalk CSVs use DEMOS-side names (`state.csv`, `demo_status.csv`); fix or mark illustrative | low | fixed |
| 688 (§10 P3) | `lib.truncate_schema_data('app', exclude_tables=...)` | schema-name | code passes `"demos_app"`; fix arg to `'demos_app'` | high | fixed |
| §14 checklist | "reviewed `fk_final.sql` (DEMOS composite form)" (x2 bullets) | stale-status | fk_final.sql Prisma-superseded; update checklist | medium | fixed |
| ~1422 (§16 Implemented) | "*Remaining SQL stages* (`05_id_maps`, `10_stg`, ... `22_app_history`, ...) are scaffolded with `.gitkeep` only" | stale-status | 05_id_maps(3), 10_stg(13), 22_app_history(8), 99_parity(1) are populated; correct the list | high | fixed |
| ~1432 (§16 Outstanding) | lists `sql/05_id_maps/`, `sql/10_stg/`, `sql/22_app_history/`, `sql/99_parity/` as gitkeep-only | stale-status | same as above; remove the populated dirs from the "deliberately empty" list | high | fixed |
| ~1432-1437 | "`00_jsonb_validation.sql` ships the JSONB shape CONSTRAINT TRIGGERs (currently on live `demos_app` columns; slated to relocate ...)" | stale-status | file now ships NO live-column trigger; BN already on `migration.bn_workbook_detail`; uipath dropped | high | fixed |
| ~1455-1458 (§16 NOTE) | "*Implementation follow-up:* ... currently still wires triggers on the live `demos_app` columns ... it must relocate ..." | stale-status | relocation already done; rewrite as completed | high | fixed |
| §15 Fri / §16 | `event.event_data`, `application.validation_data` JSONB drafts | file/table/column ref | no `event` table / no `application.validation_data` column in Prisma contract (per disposition note); mark historical/illustrative | low | preserved (historical; §16 disposition note supersedes) |
| §9.H | `10_stg/30_pgm_detail_consolidated.sql` -> `stg.demonstration_type_tag_assignment` | file/table/column ref | design-level; actual approach is `tag_pivot` from `reports/pgm_dtl_tag_mapping.csv`; align or mark as plan | low | preserved (design; propagations in dev/sme tag pages fixed) |

> Status-refresh scope: §16 and the §10/§9 status text must be brought
> to current code state per the approved plan; §15 day-by-day Week-1
> narrative is preserved as historical (only hard factual errors fixed).

### spec/migration-plan.adoc
- clean (branch tracker; statuses consistent with code; all xrefs resolve). Minor: re-verify Branch 2/5 "20_app loader pending" still true (it is: 20_app gitkeep-only).

---

## Book 3 — operator/

### operator/index.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| via shared include | renders `A[app DEMOS]` from architecture-overview | schema-name | fixed by shared/architecture-overview fix | high | fixed |
| How-to list | omits `howto-curate-filter.adoc` | toc-completeness | add link | low | fixed |

### operator/howto-curate-filter.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 8 | `sql/02_seeds_static/25_state.sql` | file/table/column ref | actual file is `25_state_region.sql` | medium | fixed |

### operator/howto-troubleshoot-parity-red.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| ~22-30 | "one section per `CheckResult`" lists 5 | stale-status | parity.py now has 6 checks (adds "Demonstration ID provenance"); add it or soften | low | fixed |

### operator/reference-cli.adoc  (GENERATED)
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| NOTE blocks | "Live `--help` text was not captured at generation time" | generated-doc-drift | regenerate via `make cli-ref` in a synced env | low | flagged (generated) |

### operator/reference-makefile.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| build-pipeline table | omits `make schema_snapshot`, `make reference_data` | phase/CLI/Make mismatch | add the two rows | low | fixed |

### operator/ — clean
tutorial-first-cutover-rehearsal, howto-cutover-day, howto-rollback, howto-rebuild-from-scratch, howto-troubleshoot-pgloader, howto-troubleshoot-fk-violations, reference-gates-state, reference-environment (NEW_APP_HEALTHZ_URL + template-only PG_*/MYSQL_* correctly described), reference-comms-templates, explanation-cutover-state-machine, explanation-rehearsal-strategy.

---

## Book 4 — developer/

### developer/index.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 36-44 Reference list | omits `reference-schema-diagrams.adoc` | toc-completeness | add xref | low | fixed |

### developer/howto-promote-jsonb-schema.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 14-18 | "target columns (...) have triggers wired" | stale-status | no triggers on any live `demos_app.*` column; BN trigger is on `migration.bn_workbook_detail` | high | fixed |
| 30-32 | "the trigger ... is attached during phase P5 (`migrate constraints`)" | stale-status | no live-column trigger attached; qualify | high | fixed |
| 105-106 | "The trigger is attached during `constraints`; ... now validated" | stale-status | correct the Verify step | high | fixed |

### developer/reference-jsonb-schema-registry.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 93 | "`budget_neutrality` — validates `demos_app.budget_neutrality_workbook.validation_data`" | stale-status | validates `migration.bn_workbook_detail` (migration-private oracle) | high | fixed |
| 94 | "`uipath_response` — validates `demos_app.uipath_result.response`" | stale-status | unwired; not validated in-DB | high | fixed |
| 96 | "`uipath_token_list` — validates `demos_app.uipath_value.token_list`" | stale-status | unwired; not validated in-DB | high | fixed |
| 78 | "raises `check_violation`; surfaces during the first build pass after constraints" | stale-status | no live trigger fires; mark illustrative | medium | fixed |

### developer/reference-prisma-ddl.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 111 | mermaid `K[migrate ddl: DROP+CREATE app]` | schema-name | `demos_app` | medium | fixed |
| 114 | mermaid `N[drop FKs in app]` | schema-name | `demos_app` | medium | fixed |

### developer/reference-pipeline-stages.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 74 | "Crosswalks: ... `\copy`." | file/table/column ref | crosswalk SQL uses inline `INSERT ... VALUES` (psycopg, no `\copy`) | medium | fixed |
| 20 | "`80-89` \| UiPath, event." | file/table/column ref | no `event` table; drop "event" | low | fixed |

### developer/reference-python-package.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| Env.load row | env list omits `PRISMA_SCHEMA_PATH` | env-var | add `PRISMA_SCHEMA_PATH` | low | fixed |

### developer/explanation-idempotency.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 31 | "`DROP TABLE IF EXISTS` then `CREATE TABLE` then `\copy` \| Crosswalks" | file/table/column ref | crosswalks use inline `INSERT ... VALUES` | medium | fixed |

### developer/explanation-fk-strategy.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 14 | mermaid `C[Drop FKs in app schema]` | schema-name | `demos_app schema` (B/D/E "app" = build sub-phase, leave) | medium | fixed |

### developer/reference-data-dictionary.adoc  (HAND-MAINTAINED — fixable)
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 61 | "`validation_data`, `response`, `token_list`, `event_data` ... enforced by the CONSTRAINT TRIGGER in `...00_jsonb_validation.sql`" | file/table/column ref | no live-column trigger; `event_data` has no table; correct | medium | fixed |
| 667 | "`response` ... CONSTRAINT TRIGGER -> schema `uipath_response`" | file/table/column ref | unwired; no trigger | medium | fixed |
| 696 | "`token_list` ... CONSTRAINT TRIGGER -> schema `uipath_response`" | file/table/column ref | unwired; (and would be `uipath_token_list`) | medium | fixed |
| 655 | "== UiPath and event" | file/table/column ref | no `event` table; retitle | low | fixed |

### developer/reference-source-target-columns.adoc  (wrapper of GENERATED fragments)
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| 82 | "`json_pack:<field>` ... Used for `validation_data`, `event_data`" | generated-doc-drift | `event_data` has no backing table; regen via `make column-map` | low | flagged (generated) |

### developer/ — clean
tutorial-add-a-new-transform (the `sql/01_ddl/` mention is an explicit "no longer exists" note), howto-add-a-phase, howto-snapshot-source-schema, howto-dump-reference-data, howto-add-a-crosswalk, howto-edit-pgloader-cast, howto-revalidate-jsonb (includes the runbook — see runbooks/revalidate-jsonb.md), howto-run-tests-locally, howto-write-a-parity-check, reference-templates, reference-fk-overrides-yaml, reference-schema-diagrams (generated; consistent), reference-id-maps, explanation-why-python-not-bash, explanation-history-backfill.

---

## Book 5 — sme/

### sme/index.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| via shared include | glossary `app::` term renders here | schema-name | fixed by shared/glossary fix | high | fixed |

### sme/reference-pgm-dtl-tag-mapping.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "How it is consumed" | "`sql/10_stg/30_pgm_detail_consolidated.sql` ... `INSERT INTO stg.demonstration_type_tag_assignment`" | file/table/column ref | neither exists; actual consumption is `tag_pivot` from `reports/pgm_dtl_tag_mapping.csv`; history is `sql/22_app_history/15_demonstration_type_tag_assignment.sql` | high | fixed |

### sme/reference-static-constraint-tables.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "Where they are defined" | "Seed values: `sql/02_seeds_static/` (29 ...) and `sql/03_seeds_limiters/` (14 ...) — this repo owns the data" | stale-status | Prisma-owned; seeded by `migrate ddl`. `02_seeds_static/` has only `25_state_region.sql`; `03_seeds_limiters/` empty | high | fixed |
| "The data (seed files)" | "one `<NN>_<table>.sql` file per table" | removed/renamed-path | no per-table seed files exist | high | fixed |
| "Adding a new value" §1 | "Edit the seed file in `sql/02_seeds_static/<NN>_<table>.sql`" | removed/renamed-path | values come from upstream Prisma schema | medium | fixed |
| "Why text IDs" | "`'pending'`, `'approved'`" | file/table/column ref | canonical `application_status` ids are `Pre-Submission`/`Under Review`/`Approved`/`Denied`/`Withdrawn`/`On-hold` | low | fixed |

### sme/howto-review-pgm-dtl-tag-mapping.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| Rules §2 | "New tag names require an additional row in `sql/02_seeds_static/`" | removed/renamed-path | `tag_name` is Prisma-owned (seeded by `migrate ddl`) | medium | fixed |
| "Adding a new tag" §1 | "Add ... to `sql/02_seeds_static/<NN>_tag_name.sql`" | removed/renamed-path | no `*_tag_name.sql` exists; point at Prisma-owned seed | medium | fixed |

### sme/reference-source-target-map.adoc
- clean. (mermaid node id `app` has label `application` = the table, not a schema; no change.)

### sme/ — clean
howto-author-a-crosswalk-csv, howto-review-bn-jsonb-payload, howto-review-pending-approved-decisions, reference-drop-list, reference-history-strategy, reference-pending-approved-rules, reference-source-target-columns (wrapper of generated fragments; flag-only), explanation-comments-routing, explanation-data-shape-decisions.

---

## Book 6 — decks/ + docs root

### docs/README.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "Where we are today (2026-06-04)" + gantt `status 2026-06-04` | snapshot dated 2026-06-04 | stale-status/date | refresh to current (2026-06-09); align with spec status refresh | low | fixed |

### docs/toc.adoc
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| Developer How-to | missing `howto-dump-reference-data.adoc` | toc-completeness | add (maps to CLI `reference-data`) | medium | fixed |
| Developer How-to | missing `howto-snapshot-source-schema.adoc` | toc-completeness | add (maps to CLI `schema-snapshot`) | medium | fixed |

### docs/attributes.adoc — clean
### docs/decks/cutover-day.adoc — clean

---

## Book 7 — non-docs (in scope)

### README.md (repo root)
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| Layout block | `01_ddl/        DEMOS DDL (no FKs, no triggers initially)` | removed/renamed-path | replace with Prisma-fetched DDL + `01_ddl_supplements/` | high | fixed |
| Mermaid Inputs | `SQLDDL["sql/01_ddl/*"]` | removed/renamed-path | replace with Prisma artifact / `sql/01_ddl_supplements/*` | medium | fixed |
| Mermaid PG subgraph | `APP["app.*"]` | schema-name | `demos_app.*` | medium | fixed |
| Sources-of-truth table | `` `sql/01_ddl/*` \| Target DEMOS DDL `` | removed/renamed-path | reference `sql/01_ddl_supplements/*` | high | fixed |
| Sources-of-truth table | "`jsonb_schemas/*.schema.json` ... enforced via `30_constraints/`" | file/table/column ref | enforcement is in `sql/31_constraint_triggers/00_jsonb_validation.sql`; and no live-column trigger | medium | fixed |
| `## CLI` section | lists only status/cutover phases + rollback/resume | phase/CLI mismatch | add init, fetch-prisma, fetch-prisma-schema, ddl, seeds, crosswalks, id-maps, load-full, fk-candidates, schema-snapshot, reference-data | medium | fixed |

### runbooks/revalidate-jsonb.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| intro | "JSONB shape validation in `app.*` runs through a constraint trigger" | schema-name + stale-status | `demos_app.*`; and no live-column trigger is shipped (only `migration.bn_workbook_detail`) — premise needs rewrite | high | fixed |
| intro | "fires on new inserts and on UPDATEs" | stale-status | no live `demos_app.*` trigger | high | fixed |
| pre-conditions | "`migration` and `app` schemas exist" | schema-name | `demos_app` | high | fixed |
| columns table | `app.budget_neutrality_workbook`, `app.uipath_result`, `app.uipath_value` | schema-name | `demos_app.` (and these are not in-DB validated) | high | fixed |
| columns table | `token_list` -> `uipath_response` | file/table/column ref | registered schema is `uipath_token_list` | medium | fixed |
| procedure 1-2 | `'app.budget_neutrality_workbook'::regclass`, `FROM app.budget_neutrality_workbook` | schema-name | `demos_app.` (and trigger actually on `migration.bn_workbook_detail`) | high | fixed |
| "when to skip" | "lands in P5 / `31_constraint_triggers/`" | stale-status | no live-column trigger installed | medium | fixed |
| "when to skip" | `ALTER TABLE app.<t> DISABLE TRIGGER` | schema-name | `demos_app.` | medium | fixed |

> revalidate-jsonb.md needs a substantive rewrite (renders via
> `developer/howto-revalidate-jsonb.adoc`), not just a schema rename.

### runbooks/rollback.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "After flip" | "data is still correct in `app`" | schema-name | `demos_app` | medium | fixed |

### reports/prisma/README_prisma_ddl.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "The current value..." | "(`000...0`) is a placeholder and will fail" | stale-status/date | `prisma_ddl.sha256` is now a real pin; update/remove | medium | fixed |

### reports/prisma/README_prisma_schema.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| "The current value..." | "(`000...0`) is a placeholder" | stale-status/date | `prisma_schema.sha256` is now a real pin; update/remove | medium | fixed |

### reports/narrative/pending_approved_decisions.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| contact row | `mdcd_demo_cntct` "Collapse on `cntct_email`" | file/table/column ref | no `cntct_email` column (wide per-role `*_email_adr` model); redefine collapse key | medium | fixed |

### reports/narrative/ownership-remediation-plan.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| header | "Status: DRAFT for review (no code changed yet)" | stale-status/date | rename + shadow-DDL deletion shipped; mark historical/done | low | fixed |

### reports/narrative/drop_list.md
| line | current text | class | proposed fix | sev | status |
|---|---|---|---|---|---|
| DROP_VIEW rows | "reconstructed in app schema" | schema-name | "DEMOS (`demos_app`) schema" (same wording in `pgloader/drop_list.txt`) | low | fixed |

### non-docs — clean
runbooks/cutover.md, runbooks/comms/* (freeze_begin, freeze_extended, flip_complete, rollback), reports/narrative/history_strategy.md, reports/narrative/notes.md, reports/narrative/bn_source_enumeration.md, reports/narrative/p1_demonstration_mapping_worksheet.md.

---

## Summary

| Book | high | medium | low | flagged (gen) |
|---|---|---|---|---|
| shared/ | 2 | 1 | 2 | 0 |
| spec/ | 5 | 3 | 4 | 0 |
| operator/ | 1* | 1 | 3 | 1 |
| developer/ | 6 | 7 | 3 | 1 |
| sme/ | 3 | 2 | 1 | 0 |
| decks+root | 0 | 2 | 1 | 0 |
| non-docs | 7 | 8 | 3 | 0 |

\* operator/index high item is resolved by the shared/ fix.

### Cross-cutting themes
1. **`app` -> `demos_app`** incomplete rename: mermaid node labels + glossary term (shared, spec §2, dev fk-strategy + prisma-ddl, README.md, runbooks).
2. **JSONB validation relocated**: `00_jsonb_validation.sql` ships no live-column trigger; spec §16, dev jsonb-registry + promote-jsonb + data-dictionary, runbooks/revalidate-jsonb all still claim live-column triggers.
3. **Prisma seed ownership**: static-constraint/limiter/tag seeds are Prisma-owned, not repo-authored (sme static-constraint + pgm-dtl pages).
4. **SQL population drift**: spec §16 lists populated dirs (05_id_maps, 10_stg, 22_app_history, 99_parity) as gitkeep-only.
5. **New CLI surface** (fetch-prisma-schema, schema-snapshot, reference-data) missing from README.md, toc.adoc, reference-makefile, spec §8 phases listing.
6. **Removed `sql/01_ddl/`** still cited as current in README.md + spec §8/§14.

### Fix order (propagation-first)
1. shared/ → 2. spec/ (with status refresh) → 3. operator/ → 4. developer/ → 5. sme/ → 6. decks+root → 7. non-docs.
Run `cd docs && mise exec -- make html` after each book; tick the status column here.

---

## Reconciliation (2026-06-09)

The comb is complete. All books were fixed propagation-first and
`cd docs && mise exec -- make all` (HTML for every book + the Reveal.js
deck) builds clean with `failure-level=WARN` (no warnings, no errors).

**Every row above is now `fixed`**, with these deliberate exceptions:

- **Preserved (historical / design):**
  - spec/canonical-spec.adoc §15 Week-1 day-by-day `event.event_data` /
    `application.validation_data` drafts — kept as the historical Week-1
    narrative; the §16 disposition note (now corrected) supersedes them.
  - spec/canonical-spec.adoc §9.H `30_pgm_detail_consolidated.sql` /
    `stg.demonstration_type_tag_assignment` — kept as forward-looking
    workstream design (the `20_app` tag transform is unstarted). Its
    user-facing propagations in developer/ and sme/ tag pages were
    corrected.
  - reports/narrative/notes.md — append-only surprise log; left untouched as a
    point-in-time record (not in the narrative-refresh scope).

- **Flag-only generated pages (regenerated by `make all`, never
  hand-edited):**
  - operator/reference-cli.adoc — regenerated from `migrate --help`;
    drift resolved automatically.
  - docs/shared/generated/schema-*.adoc — regenerated by
    `make schema-diagrams`.
  - reports/source_target_columns_{coverage,table,sections}.adoc —
    regenerated by `make column-map`. (The hand-authored transform
    *vocabulary* in developer/reference-source-target-columns.adoc,
    including the stale `event_data` and `30_pgm_detail_consolidated.sql`
    references, was fixed in place.)

**Additional stale items found during the fix pass** (beyond the
original inventory) and corrected: the JSONB trigger-location claims in
shared/schema-overview.adoc, glossary.adoc (registry term), spec §2/§10
artifact-O text and the Week-2 status paragraph, and the operator
parity-report JSONB-shape description — all now point at the
migration-private `migration.bn_workbook_detail` trigger in
`sql/01_ddl_supplements/10_bn_workbook_detail.sql` rather than the
comments-only `sql/31_constraint_triggers/00_jsonb_validation.sql`.
