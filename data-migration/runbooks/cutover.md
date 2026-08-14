# Cutover runbook

Production cutover playbook. Every step has a single command and an expected output snippet. If the snippet doesn't match, **HOLD** and call backup operator.

All commands are `uv run migrate <phase>`. The `./scripts/cutover.sh <phase>` shim is identical and provided for muscle memory; pick whichever you prefer.

## Pre-conditions

- [ ] Two timed dress rehearsals completed (Week 10).
- [ ] Stakeholder go-decision recorded.
- [ ] Backup operator on call.
- [ ] Comms templates ready (`runbooks/comms/`).
- [ ] State directory clean: `rm -f state/*.ok`
- [ ] Prisma migration set pinned and cached locally:
      ```sh
      uv run migrate fetch-prisma --verify-only
      ```
      The cutover should not depend on the GitHub API being reachable
      mid-flight; preflight (P0.5) will hard-fail if the concatenated
      artifact identified by `reports/prisma_ddl.sha256` is not present in
      `state/prisma_ddl/`. The artifact is composed by listing
      `$PRISMA_MIGRATIONS_PATH` in `$PRISMA_REPO@$PRISMA_REPO_REF` via the
      GitHub Contents API and concatenating each Prisma `migration.sql`
      chronologically.

## Phase-by-phase

### P0 Pre-flight (T-2h)

```sh
uv run migrate preflight
```

Expected last line: `[YYYY-MM-DDTHH:MM:SSZ] gate 'preflight' satisfied`

### P1 Freeze (T-0)

DBA pauses writes; old app set to read-only banner.

```sh
uv run migrate freeze
```

Expected: prompts for confirmation; on `y`, prints `freeze instant: <UTC ISO>`.

Send `runbooks/comms/freeze_begin.md`.

### P2 Final delta (T+0 -> T+30m)

```sh
uv run migrate delta
```

Expected last line: `gate 'delta' satisfied`. Logs in `reports/runs/pgloader_delta_*.log`.

**Gate 2:** the pgloader delta load completes with zero table-level errors (`assert_pgloader_ok` parses the log for fatal markers / non-zero error counts). Row-count drift between MySQL and `mysql_raw` is verified separately by `migrate load-fidelity` (non-gating); a non-clean delta retry once, persistent failure -> rollback.

### P3 Build stg + demos_app (T+30m -> T+1h30m)

```sh
uv run migrate build
```

Expected: gates `build_stg` and `build_app` satisfied. The `demos_app` build runs through one psycopg connection wrapped in `conn.transaction()`, prefixed with `SET CONSTRAINTS ALL DEFERRED`, so any failure in 20_app/21_app_associative/23_app_derived rolls the whole stage back. `build_stg` keeps autocommit-per-file semantics; the granular `build_stg`/`build_app` gates let `migrate resume` pick up at whichever half failed.

### P5 Constraints + triggers + indexes (T+1h30m -> T+2h)

```sh
uv run migrate constraints
```

Expected: gate `constraints` satisfied. **Hard fail** if `state/fk_violations.csv` is non-empty.

This phase reads the FK definitions captured by `migrate ddl` from
`state/prisma_fks.json`, re-creates each as `NOT VALID` (preserving the
original Prisma name + clause from `pg_get_constraintdef`), then runs
`VALIDATE CONSTRAINT` per FK. Constraint triggers, app triggers,
indexes, and sequence resets follow.

### Apply DEMOS post-Prisma DB objects (operator) — after P5, before flip

The DEMOS application owns a set of database objects that are **not** part
of the Prisma migrations and therefore are **not** applied by this
pipeline: the `log_changes_*` history-capture triggers, application
functions, utility views, role grants, and `pg_cron` schedules. They live
in the DEMOS repo under `server/src/sql/` and are applied by
`server/src/refreshDbObjects.ts`.

Because the staging clone is managed by the data-migration operator, the
operator runs this step from a DEMOS `server/` checkout pointed at the
migration target, **after** P5 and **before** flip (so the app has its
functions/views/grants). The `demos_app.*_history` tables ship empty; the
`log_changes_*` capture triggers installed here populate them from cutover
forward (this repo does not backfill history -- see
`reports/narrative/history_strategy.md`):

```sh
# from the DEMOS server/ checkout, DATABASE_URL pointed at the migration target
npx tsx src/refreshDbObjects.ts
```

Expected: `utility_views.sql`, `permissions.sql`, `history_triggers.sql`,
`functions.sql`, and (non-test) `cron_schedules.sql` all execute cleanly.

> Ownership: this repo never authors these objects. If a future change
> needs one, it belongs in the DEMOS repo, not here. See
> `reports/narrative/ownership-remediation-plan.md`.

### P6 Parity (T+2h30m -> T+3h)

```sh
uv run migrate parity
```

Expected: report at `reports/runs/parity_*.md` with `**OVERALL STATUS: GREEN**`. Gate `parity` is marked only on GREEN.

For dress rehearsals (NOT production cutover), `uv run migrate parity --accept-pending` will mark the gate even when checks report `PENDING`; the run logs a `WARN` naming every pending check. Do not pass `--accept-pending` on cutover day.

### Manual go/no-go

Operator + backup + SME read parity report aloud. Unanimous **go** required.

### P7 Flip (T+3h -> T+3h15m)

PMDA (legacy) and DEMOS (new) are separate apps on separate URLs; the
dev team owns the URL/redirect work outside this repo. This phase
verifies DEMOS is live at its own healthz endpoint and records that
PMDA has been placed in read-only mode.

```sh
uv run migrate flip
```

Expected: operator confirms PMDA read-only banner is up; DEMOS healthz
returns 200 within 5 attempts; gate `flip` satisfied.

### P8 Smoke (T+3h15m -> T+4h)

```sh
uv run migrate smoke
```

This is a manual checklist v0: the command prints each item, the operator
walks through the new app and reports `y` for each. There is no automated
test suite behind this gate today (a future iteration may add one). Backup
operator should observe and co-sign.

Expected: all checklist items pass; gate `smoke` satisfied. Send `runbooks/comms/flip_complete.md` with parity report attached.

### P9 Hypercare (T+4h -> Day 4)

- Single ticket channel.
- Daily 15-min standup with SME.
- No schema changes.
- Fix-forward branches only; ship as versioned patches after standup.

### P10 Decom (Day 7+)

```sh
uv run migrate decom
```

Then capture final MySQL backup; schedule teardown; author post-mortem.

## Status check anytime

```sh
uv run migrate status
```

Renders the gate table via `rich.table` showing which phases have completed.

## Rollback

See `runbooks/rollback.md`.
