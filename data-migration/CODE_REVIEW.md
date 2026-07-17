# Code Review: demos-data-migration

**Date:** 2026-06-21
**Scope:** all of `migration/` (cli, lib, prisma_schema, secrets, duck, 19 phase modules), every `.sql` file under `sql/` and `scripts/`, `pgloader/*.load` + `casts.load` + `drop_list.txt`, `tests/` (332 tests: 291 passed / 41 DB-gated skips), `pyproject.toml`, `Makefile`, `.github/workflows/ci.yml`, and the README's "Conventions" claims.
**Method:** full read of every code file in scope; SQL column references cross-checked against `reports/schema_snapshot/columns.csv`; the parity `Composed.as_string()` path and the gate graph were exercised against the installed psycopg/code; the suite was run locally with coverage (291 passed, 68% total). The SQL apply-twice harnesses and integration tiers skip locally (no `PG_TEST_DSN`/`MYSQL_URL`) but **run in CI**, which provisions a `postgres:16` service and sets `PG_TEST_DSN` plus `--cov-fail-under=69`.

## Verdict, up front

This is a strong, mature codebase, and it has clearly absorbed a prior, harsher review: the headline failures that review found are genuinely fixed and now have regression tests. Specifically — and I checked each one against the live tree, not the changelog:

- **"All SQL files are idempotent" is now substantially true.** The three `10_stg` filters that referenced fictional columns (`12_filter_aplctn`, `16_filter_cntct`, `99_filter_report`) have been rebuilt against the real schema snapshot and verified column-by-column; an apply-twice harness (`tests/sql/test_stg_idempotency.py`) now runs them against an ephemeral Postgres in CI.
- **The gate chain is now correct.** `run_build_stg` requires `delta` (`build.py:268`), and `tests/test_gate_graph.py` asserts `flip` transitively depends on `freeze` + `delta`. You cannot flip on a pre-freeze snapshot.
- **The "full load" really loads data.** `pgloader/schema.load:23` is `create tables ... ` with data, not `schema only`.
- **`fk-candidates` no longer crashes.** `psql_query`'s `params` defaults to `None` (`lib.py:467`), and `tests/sql/test_stg_idempotency.py::test_fk_candidate_scanner_runs` pushes the literal-`%` scanner SQL through real psycopg.
- **pgloader exit codes are no longer trusted.** `assert_pgloader_ok` (`lib.py:364`) parses the log and dies on any error count or missing summary; both load phases call it.
- **`flip` no longer probes a placeholder, and its retry tests assert attempt counts** (`test_flip.py:68,101`).

So the grilling has to be at a higher altitude than last time. The architecture (layered numbered SQL, `@phase` gate decorator, hash-pinned offline Prisma artifacts, credential redaction, `psycopg.sql.Identifier` discipline, the cross-instance prod-schema guard) holds up well. The remaining defects are real but mostly **Medium**: they cluster around (1) a small set of stale claims and tools that quietly produce wrong output, and (2) the test suite's *distribution* — the orchestration code that is the entire point of this repo is still the least-tested, and the strongest guarantees only exist when a database is present.

The single most important framing: **291 of your tests pass with no database at all, and they certify the pure functions; the tests that certify the migration actually works only run in CI.** That is a better posture than the prior review found (CI does provision Postgres), but it means a green local `make test` still tells you almost nothing about correctness of the thing being shipped.

---

## Critical

None outstanding. The five issues a prior review rated Critical (schema-only load, three fictional-column SQL files, the `psql_query` `%`-placeholder crash) are all fixed and regression-tested. I verified each against the current tree rather than trusting the inline `CODE_REVIEW` breadcrumbs.

---

## Python (`migration/`)

Well decomposed: one I/O wrapper module, a `@phase` decorator that both enforces and *registers* the gate graph (`lib.py:638`, enabling `test_gate_graph.py` to introspect it without execution), a dependency-free Prisma parser, and serious safety engineering (redaction on every log line incl. `@`-in-password, freeze-instant regex guard, http/https-only healthz, `MIGRATE_NONINTERACTIVE` refusing to auto-confirm, RDS `verify-full` with a cached CA bundle).

### High

**H1. `build_app` re-run after `constraints` can still cascade-truncate seeded reference tables.** `build.py:335` calls `truncate_schema_data(env, "demos_app", exclude_tables=seeded)`, and the excluded set is honored in the table-selection loop — but every emitted statement is `TRUNCATE TABLE %I.%I CASCADE` (`lib.py:581`). Once `constraints` has re-added and `VALIDATE`d the Prisma FKs, truncating a *data* table cascades through those FKs into the *excluded* Prisma-seeded lookups, defeating the guard the whole `prisma_seeded_tables.json` mechanism exists to provide. The `pre_sql="SET CONSTRAINTS ALL DEFERRED"` (`build.py:346`) does not save you: deferral affects FK *checking* at commit, not `TRUNCATE ... CASCADE`, which truncates the referencing rows immediately regardless. This is a genuine re-run hazard on the most re-run-prone phase. **Fix:** re-drop the captured FKs before truncating (symmetric with `init_pg._drop_fks`), or refuse to run `build_app` when validated demos_app FKs exist, or build the truncate list as the dependency-ordered closure and `TRUNCATE` them together without `CASCADE`.

> **UPDATE (2026-06-26): code RESOLVED; regression test still missing.** The recommended fix landed: `build.py:308 _drop_demos_app_fks` drops the captured Prisma FKs (via `init_pg._drop_fks(init_pg._capture_fks(env))`) before `truncate_schema_data`, called at `build.py:343` with the truncate at `:351`, so `CASCADE` has no re-added FK to follow. The line numbers above (`build.py:335`, `lib.py:581`) predate that change. The H1 *test* (apply demos_app FKs, seed a lookup, re-run `run_build_app`, assert the seeded rows survive) is **still absent** -- the fix is in code but uncaught by the suite, so keep it on the test backlog.

**H2. `parity` reports RED but the process exits 0; `make rebuild` declares success anyway.** `run_parity` on a RED overall logs `"parity gate not green"` and *returns* (`parity.py:398`) — it does not `die()` and does not set a non-zero exit. `make rebuild` (`Makefile:77`) chains `... constraints parity` and unconditionally prints `"Full rebuild complete."` (`:78`). Any CI job or operator script keying off exit status sees a green rebuild over a RED parity. PENDING-without-`--accept-pending` has the same exit-0 behavior. The gate file is correctly *not* written, so the next phase still blocks — but the success signaling is wrong. **Fix:** `die()` (or raise a non-zero exit) on RED, and on PENDING when `--accept-pending` was not passed.

> **UPDATE (2026-06-26): RESOLVED (code + test).** `run_parity` now `die()`s on any non-GREEN overall (`parity.py:1182`) and on PENDING unless `--accept-pending` was passed; only GREEN, or PENDING-with-`--accept-pending`, marks the gate. `tests/test_parity.py::test_run_parity_red_exits_nonzero` and `::test_run_parity_default_does_not_mark_pending_gate` assert the non-zero exit, and `::test_run_parity_accept_pending_marks_gate` asserts the accepted path. The `parity.py:398` reference above predates a large refactor (the function is now at `parity.py:1126`).

### Medium

- **M1. Preflight never touches MySQL.** `preflight.py` checks PG reachability, DB size, DuckDB scanners, the pgloader binary, the Prisma cache, and the prod-schema guard — but never opens `MYSQL_URL` and never stats `pgloader/delta.tmpl.load` / `delta_tables.tsv`. A wrong MySQL password or an unreachable source first surfaces at `delta` (P2), *after* the freeze banner is up and writes are paused. For a cutover-day pre-flight whose entire job is "catch it before the freeze," omitting the source DB is the wrong ordering. **Fix:** add a `SELECT 1` against `MYSQL_URL` and a presence check on the delta manifest to P0.

- **M2. Malformed override CSV is silently dropped, not rejected.** `build._load_override_csv` (`build.py:120`) logs one line and `return 0` when `keep_ids.csv`/`drop_ids.csv` has an unexpected header (a BOM, a renamed column, an extra field). A present-but-unparseable force-keep file means the SME's "do not delete these demonstrations" decisions vanish from the migration with only a log line. A file that exists but cannot be used should `die`, not degrade to "no overrides." (The downstream `_assert_overrides_exist` is good, but it only validates rows that *were* loaded.)

- **M3. `freeze` interpolates the instant into SQL via f-string, against the repo's own stated policy.** `freeze.py:37` builds `INSERT ... VALUES ('{instant}'::timestamptz)` with an f-string. It is safe *today* because `instant` comes from `ts()` (machine-generated, regex-shaped), but `psql_query`'s own docstring (`lib.py:469`) says "values MUST go through `params`," and `load_delta` bothers to regex-guard the same value before interpolating it. This is the one place a value is concatenated into SQL with no guard at all; it should use a parameter or reuse `_validate_freeze_instant`.

- **M4. `_delta_log` AFTER LOAD overwrites the freeze instant instead of asserting it.** `pgloader/delta.tmpl.load:53` does `UPDATE ... SET delta_applied_at = now(), freeze_instant = '{{FREEZE_INSTANT}}'` on the max-id row. If `freeze` already wrote that row (it does), the delta *overwrites* the authoritative freeze instant with the template value rather than verifying they match; and if the row is somehow absent, the `WHERE id = (SELECT max(id) ...)` matches nothing and the delta silently leaves no audit trail. Rendered value equals the stored value in the happy path, so this is latent, but the audit record is being rewritten by the wrong actor. **Fix:** drop `freeze_instant` from the SET list (let `freeze` own it), or make the update assert equality and fail loudly otherwise.

- **M5. Gated directory phases can be silent no-ops.** `apply_dir` defaults to "missing/empty dir is fine," and `@phase`/`mark_gate` fire on any clean return. `sql/20_app`, `21_app_associative`, `23_app_derived`, `30_constraints` are scaffolds today, so `migrate build` can truncate `demos_app` data tables, apply zero files, and still mark the gate green. This is intentional for early scaffolding, but the cutover-critical dirs should pass `expect_files=True` (as `run_init` and `run_ddl`'s supplements already do) once they are populated, so an empty `20_app` can never mark `build_app` done. *(Note: `22_app_history` was removed entirely -- history is now DEMOS-owned and not migrated.)*

### Low

- `fk_candidates.run_generate_fk_candidates` (`fk_candidates.py:521-541`): the "stale overrides WARNING" at `:573` is dead code. Both branches of the override loop call `del overrides[key]` (`:537` and `:541`), so `overrides` is always empty by the time the warning checks it. Track unmatched overrides in a separate list, or only delete in the matched branch.
- `cli.py:230-238` (`resume`): runs `parity.run_parity` with `accept_pending=False`. If parity is PENDING (the expected dress-rehearsal state, given checks 1/2/4 are PENDING by design), the gate is not marked and the next iteration's `flip` dies with `"gate 'parity' not satisfied; run prior phase first"` even though parity just ran. `resume` has no way to pass `--accept-pending`; for rehearsals it is unusable past parity.
- `lib.Env.load` (`:193-197`): reports only `MYSQL_URL` specially; any other missing/invalid field surfaces as a raw pydantic message. Minor, but the targeted-error treatment is asymmetric.
- `pyproject.toml:14`: `jsonschema>=4.21` is declared and imported nowhere (JSONB validation is in-database via `pg_jsonschema`). Dead dependency.
- `prisma_schema.py`: line-oriented parsing of `@relation(...)` is lenient about multi-line relation blocks. Fine as a cross-validation input, but a silently-dropped relation weakens the very cross-check it feeds; worth a debug log when a model line looks like a relation it could not parse.

---

## SQL (`sql/`, `scripts/`, `pgloader/`)

Execution model (confirmed in `lib.apply_dir` / `psql_file`): each `.sql` file runs as one multi-statement string on an **autocommit** connection — one implicit transaction per file, so per-file atomicity holds. `build_app` is the exception: it batches `20_app`/`21`/`23` inside one explicit transaction via `psql_files`. The numbered-layer structure with per-file header contracts is genuinely good and made this review fast.

### Per-directory idempotency verdict

| Directory | Verdict | Notes |
|---|---|---|
| `00_init` | Truly idempotent | DO-guarded roles, `IF NOT EXISTS`, `OR REPLACE` throughout; `_delta_log` is `CREATE IF NOT EXISTS` |
| `01_ddl_supplements` | Idempotent | JSONB registry + BN detail; re-applied via `OR REPLACE` |
| `02_seeds_static` | Idempotent **with caveat** | `25_state_region.sql:46` uses `ON CONFLICT DO UPDATE` — contradicts the README "never upsert" claim (S1) |
| `04_crosswalks` | Idempotent **with caveat** | `DROP TABLE ... ; CREATE TABLE; INSERT` is rerun-safe but is drop-recreate, not truncate-insert; completeness checks now fail-closed on empty (good) |
| `05_id_maps` | Truly idempotent | append-only `ON CONFLICT DO NOTHING`; UUID stability is the point |
| `10_stg` | Idempotent (verified) | `CREATE OR REPLACE VIEW`; 12/16/99 rebuilt against real columns; force-keep now `EXISTS`-guarded against source (H5 of prior review fixed) |
| `20_app` / `21` / `23` | Empty scaffolds | see Python M5 |
| `22_app_history` | *Removed* | History is DEMOS-owned; the P4 backfill phase, `sql/22_app_history/`, and the `history` gate were all removed. |
| `99_parity` | Truly idempotent | `CREATE OR REPLACE VIEW` |
| `scripts/generate_fk_candidates.sql` | Idempotent (read-only) | but output is systematically wrong (S2) |
| `pgloader/` | Idempotent **with caveat** | full + delta share CAST and EXCLUDING blocks now; delta `_delta_log` overwrite (Python M4) |

### High

**S1 (was the headline "never upsert" claim).** README "Conventions" (`README.md:231`) states: *"All SQL files are idempotent: truncate-then-insert, never upsert."* That is false as a blanket statement: `25_state_region.sql:46` and the crosswalk loaders use `ON CONFLICT DO UPDATE` / drop-recreate, and `init_pg.load_jsonb_schemas` upserts the registry. These are all **defensible** idempotency strategies — but the claim that none of them are used is what is wrong, and a reviewer or new contributor trusting it will mis-model the data flow (e.g. assume deleting a seed row from the CSV propagates on rerun; it does not for the `DO UPDATE` cases). **Fix:** soften the README to "idempotent via truncate-insert, drop-recreate, or keyed upsert as documented per file," and name the deliberate upserts.

### Medium

- **S2. `scripts/generate_fk_candidates.sql` emits a `to_column` that is almost always wrong, and a confidence that can describe a different target than the `to_table`.** Two distinct bugs in one query:
  1. `to_column` is the literal `'id'` or `'cd'` (`:60-63`), but legacy PKs are `<table>_id` (e.g. `mdcd_demo_id`), not bare `id` — only `users` has a bare `id`. So nearly every candidate names a target column that does not exist; anything resolving the CSV mechanically against the schema finds zero valid FKs. The `pks` CTE already computes the real PK and is then unused for this purpose. **Fix:** emit the matched target table's actual PK from `pks`.
  2. `to_table` is `COALESCE(t_exact, t_mdcd, t_pendg, t_rfrnc)` (`:55-58`) but `confidence` is a `CASE` that tests `t_exact, t_pendg, t_rfrnc, t_mdcd` *in that order* (`:64-70`). For a column like `demo_id` where both `t_mdcd` (→ `mdcd_demo`) and `t_pendg` match, COALESCE picks `mdcd_demo` while the CASE returns `HIGH` off the `t_pendg` branch — the row's table and its confidence label can refer to two different candidates. **Fix:** derive both from one precedence order. Also the `cols` CTE scans every `mysql_raw` column including `crosswalk_*` and `_delta_log` artifacts; filter to base tables.

  This is non-fatal because the human-curated `fk_overrides.yaml` and Prisma back-translation overlay the scanner, and parity check 5 only gates on HIGH/MED *post-merge* edges — but the SQL layer's raw output is misleading to anyone reading the CSV.

- **S3. *(Resolved -- history backfill removed.)*~~History backfill is destructively idempotent with no post-cutover tripwire.~~** The `22_app_history/` directory and the `migrate history` phase were removed entirely: history is DEMOS-owned, the tables ship empty, and the DEMOS capture triggers fill them post-cutover. This finding is moot.

- **S4. `migration.crosswalk()` is not the "single crosswalk contract" it claims.** `00_init/03_helper_fns.sql:55` hardcodes the parameter as `p_legacy_cd int` and the lookup as `WHERE legacy_int_cd = $1`, but `04_crosswalks/20_state.sql:16` defines `crosswalk_state` with `legacy_cd text` (a 2-letter ANSI code). So `migration.crosswalk('state', ...)` cannot be called the same way as the integer-coded crosswalks; the advertised uniform contract has at least one member that does not fit. Either special-case the text-keyed crosswalks or document that `state` uses a different accessor.

### Low

- *(Resolved with S3 -- `22_app_history` removed.)*~~`22_app_history/10_demonstration.sql:42`: "deterministic revision_id via `ORDER BY id`" relies on `SERIAL` assignment following `INSERT ... SELECT` output order, which Postgres does not guarantee under parallel plans. With `RESTART IDENTITY` the values restart at 1 deterministically *per value*, but the id↔row pairing is not guaranteed. Use `row_number() OVER (ORDER BY id)` if the mapping must be reproducible.~~
- `pgloader/schema.load:23` `include drop`: re-running the full load issues `DROP TABLE ... CASCADE` across `mysql_raw`, which would also drop any `stg._valid_*` views built on top until the next `build_stg`. Expected for a "full reload," but worth a header note.
- `10_stg/*` anti-joins use `NOT IN (SELECT ...)`; they are NULL-safe only because the keys are non-null PKs. `NOT EXISTS` (already used for `bad_parent`) would be self-evidently safe and consistent.

---

## Tests (`tests/`)

**Run results (local):** 291 passed, 41 skipped, 68% coverage. The 41 skips are *all* DB- or MySQL-gated (`tests/sql/*`, `tests/integration/*`) and **execute in CI** against the `postgres:16` service with `PG_TEST_DSN` set and `--cov-fail-under=69`. CI also runs ruff, ty, and Prisma drift detection. This is a materially healthier setup than a coverage-threshold-free, DB-free suite.

The suite has grown since the prior review (278→291 passing, 26→41 DB-gated skips) on the back of new SQL apply-twice harnesses — `test_crosswalk_load`, `test_crosswalk_checks`, `test_rbac_derived`, `test_budget_neutrality`, `test_system_role_check`, and the deeper-layer `test_app_layers_idempotency` now exercise the populated `04_crosswalks` / `20_app` SQL against ephemeral Postgres, not just the stg layer. Total coverage held flat at 68% because the new lines under test grew in step with the harnesses covering them. *(The `22_app_history` SQL harness was removed when the history phase was deleted.)*

### Do they follow TDD standards?

**Partially, and better than before — but the distribution is still inverted.** The strongest signals of test-*driven* (vs. test-*after*) development are now present where the prior review demanded them:

- A **gate-graph test** (`test_gate_graph.py`) asserts the dependency DAG and that `build_stg` dies before any DB I/O without `delta`.
- An **apply-twice SQL harness** (`tests/sql/`) runs the real stg/crosswalk/force-keep/BN SQL twice against ephemeral Postgres and asserts no error + stable state.
- A **real-SQL-through-psycopg test** runs the literal-`%` scanner SQL through the actual `psql_query` path (kills the old C1 class of bug).
- A **pgloader-log gate test** (`test_pgloader_log.py`) feeds error-summary logs and asserts the load phases refuse the gate.
- **Assertion-rich** flip/parity/fk tests (attempt counts, status rollups, conflict tagging).

What's still test-*after* shaped is the coverage map. The pure/parsing modules are lavished with tests; the dangerous orchestration is thin:

| Module | Coverage | Read |
|---|---|---|
| `flip.py` | 98% | A — retries, scheme guard, unset-URL die, gate marking all asserted |
| `parity.py` | 97% | A — status rollup + every check's RED/PENDING path covered |
| `fk_candidates.py` | 95% | A− — parser + merge thorough; the stale-override dead code (Low) is untested, hence undetected |
| `prisma_schema.py` | 95% | A — best file in the suite |
| `duck.py` | 91% | B+ |
| `fetch_prisma*` | 82–91% | B+ |
| `lib.py` | 79% | B — but the `truncate_schema_data` CASCADE clause (Python H1) is not exercised with FKs present |
| `load_delta.py` | 66% | C — TSV header-missing / short-row / comment-as-header paths untested |
| `cli.py` | 60% | C — wiring + `resume` PENDING behavior (Low) untested |
| `schema_snapshot.py` | 55% | C |
| `constraints.py` | 49% | C — **up from prior review:** `_readd_captured_fks` drop-before-add + empty-list noop now asserted (`test_constraints.py`); the VALIDATE loop and DB-side rerun remain unit-untested |
| `prod_schema_guard.py` | 47% | C− — `summarize_guard` (pure) is tested; the DuckDB dual-attach is integration-only |
| `decom.py` / `smoke.py` / `rollback.py` | 23–56% | D — break-glass + manual-gate phases barely touched |
| `init_pg.py` | 28% | D− — FK capture/drop, seeded-table capture, the DROP/reapply orchestration: nearly untested |
| `reference_data.py` | 28% | D− — identifier-safety + SQL-shape helpers unit-tested; the `dump`/load orchestration is not |
| `freeze.py` | 31% | F — the single most consequential write of the cutover (the freeze instant + `_delta_log` row) is untested |
| `load_fidelity.py` | 31% | F — render path lightly covered; comparison orchestration is integration-only |
| `load_full.py` | 17% | F — render path lightly covered; the assert-pgloader-ok gating path not |
| `preflight.py` | 10% | F — the phase whose entire job is catching problems early is the least-tested module in the repo |

### Specific problems

- **The truncate-CASCADE hazard (Python H1) is still invisible to the suite.** `build.py` is 25% covered; `test_build.py` exercises only the seeded-table capture, and no test applies FKs and then re-runs `build_app` to observe whether an excluded seeded table survives. This is exactly the kind of behavioral regression a focused harness would catch, and its absence is why H1 can sit latent behind a green suite.
- **`constraints` rerun is now partly tested (improvement).** `test_constraints.py::test_readd_captured_fks_drops_before_add` and `::test_readd_captured_fks_empty_list_is_noop` now simulate an already-present constraint and assert the drop-then-add path, plus the round-trip / malformed / quoting cases. What is still missing is a DB-backed rerun that proves zero invalid FKs after a second `run_constraints` and exercises the VALIDATE loop; coverage sits at 49%.
- **`freeze`/`preflight`/`load_full` are the cutover's first three live actions and remain three of the least-tested files.** Coverage correlates inversely with operational danger here. A `freeze` test (monkeypatch `confirm`, assert the `_delta_log` insert and the `freeze_instant.txt` write) and a `preflight` test (assert each check's failure path flips `ok` and `die`s) are cheap and high-value.
- ~~**`parity` RED still has no exit-code test.**~~ *(RESOLVED 2026-06-26.)* `test_parity.py` now asserts the *consequence* as well as the rollup: `test_run_parity_red_exits_nonzero` and `test_run_parity_default_does_not_mark_pending_gate` assert a non-zero process exit on RED and on PENDING-without-`--accept-pending`, and `test_run_parity_accept_pending_marks_gate` asserts the accepted path. Python H2 is caught.
- **`fk_candidates` still mocks `psql_query` in `test_fk_candidates.py`** — but this is now acceptable, because the real-SQL path is covered separately by `test_stg_idempotency.py::test_fk_candidate_scanner_runs`. Worth a comment cross-referencing the two so nobody "fixes" it by deleting the harness.
- **Hygiene is good.** `conftest.py` is clean (autouse env-cache reset, `tmp_state_dir`, DB-skip fixture), tests are deterministic and offline by default, names and docstrings are informative. The priorities, not the craft, are the issue.

### The five most valuable tests to add next

1. **`build_app` truncate-CASCADE safety:** apply demos_app FKs, populate a seeded lookup, re-run `run_build_app`, assert the seeded rows survive. The *code* fix for H1 has landed (`build.py:308 _drop_demos_app_fks` before truncate), but this regression test is **still missing** — now the top gap.
2. ~~**`parity` RED exit code.**~~ *(DONE 2026-06-26.)* `test_run_parity_red_exits_nonzero` + `test_run_parity_default_does_not_mark_pending_gate` assert the non-zero exit on RED and PENDING-without-accept; `test_run_parity_accept_pending_marks_gate` covers the accepted path. Python H2 is caught.
3. **`freeze` write behavior:** assert the `_delta_log` insert and `freeze_instant.txt` content. Covers the cutover's most consequential write.
4. **`preflight` failure paths:** assert each check (PG reachability, DB size, scanners, pgloader binary, prod-schema guard) flips `ok` and `die`s — and, per M1, add MySQL reachability once it exists.
5. ~~**`history` post-trigger tripwire (once S3 lands):** assert re-running with a `log_changes_*` trigger present raises.~~ *(Moot -- history phase removed; history is DEMOS-owned.)*

---

## What the code does well

- Credential redaction on every log line, including `@`-in-password; `psycopg.sql.Identifier`/`Composed` discipline for all DDL and the dynamic orphan/FK SQL; freeze-instant regex guard; http/https-only healthz; `MIGRATE_NONINTERACTIVE` refusing to auto-confirm operator gates.
- Hash-pinned, cached, offline-capable Prisma DDL **and** declarative `.prisma` model artifacts, with drift detection in CI; deterministic, diff-friendly CSV outputs; timestamped parity + guard reports with sign-off blocks.
- The `@phase` decorator that simultaneously enforces gates and *registers* the dependency graph for introspection — that one design choice is what makes the gate-graph test possible without running anything.
- The cross-*instance* prod-schema guard (DuckDB dual-attach diffing live target vs. reference before the irreversible `DROP SCHEMA`) is a thoughtful answer to the single most dangerous moment in the run, and it correctly refuses to guard a prod rebuild blind.
- Shared `cast_block`/`excluding_block` so full and delta loads cannot drift on type coercion or exclusions — a class of silent cutover-day corruption, designed out.
- `assert_pgloader_ok` parsing the log rather than trusting pgloader's always-zero exit.

## Recommended fix order

1. **Before the next rehearsal is trusted:** ~~Python H1 + H2.~~ *(Both code-fixed 2026-06-26.)* H2 is fully resolved (code + tests). H1's code fix landed (`build.py:308 _drop_demos_app_fks` before the CASCADE truncate); the only residual is its regression test (item 1 above). Neither is a rehearsal blocker any longer.
2. **Before cutover day:** Python M1 (preflight must touch MySQL), M2 (reject malformed override CSV), M4 (delta `_delta_log` overwrite), S2 (fk-candidate `to_column`/confidence correctness if anyone consumes the CSV mechanically). *(SQL S3 -- history tripwire -- is moot: the history phase was removed.)*
3. **Truth-in-advertising:** S1 (README "never upsert"), S4 (`crosswalk()` contract), M3 (freeze f-string), and the Low items.
4. **Make it stay fixed:** the five tests above, especially the `build_app`/`constraints` rerun harnesses — they convert the two open High findings from "latent" to "caught," which is worth more than any additional coverage on the already-95% modules.
