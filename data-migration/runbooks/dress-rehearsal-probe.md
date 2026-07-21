# Dress-rehearsal probe run

Tier-1 **script-shakedown** rehearsal: the first end-to-end pass of the
pipeline against a **static MySQL snapshot/replica** into a **fresh local
target**, run to surface mechanical breakages and convert parity risks
(W5/W6) into a concrete fix list. This is *not* the timed, zero-intervention
Tier-2 rehearsal and *not* a real cutover (no `flip`/`smoke`/`decom`).

Capture each phase's timing and result in `reports/rehearsals/rehearsal_<ts>.md` and
mirror surprises into `reports/narrative/notes.md`.

## Why a static source

The source DB cannot be frozen before the rehearsals. Parity runs live
`SELECT`s against MySQL and compares to Postgres, so a *moving* source would
make exact-count checks ambiguous. Pointing `MYSQL_URL` at a static
snapshot/replica makes parity deterministic and makes the `freeze` confirmation
honest (a static source genuinely is not changing).

## The chain is forced

`build_stg` calls `require_gate("delta")`, and `delta` requires `freeze`, which
requires `preflight`. There is **no build-only shortcut** to parity -- the full
cutover chain must run. `freeze` only *records* the instant (it does not pause
writes); with a static source, confirming it is honest.

## Pre-conditions

- [ ] `MYSQL_URL` points at the **static snapshot/replica**, NOT live PROD.
- [ ] `REFERENCE_PG_URL` left blank for a local target (prod-schema guard
      then skips with a WARN).
- [ ] `MIGRATE_NONINTERACTIVE` is **unset** (else `freeze` refuses to prompt).
- [ ] Prisma artifact cached: `uv run migrate fetch-prisma --verify-only`.
- [ ] Docker available for `make spin_up`.

## Procedure

All phases run via `make <phase>` (wraps `uv run migrate <phase>`).

### Step 0 -- stand up a fresh target

```sh
make spin_up        # disposable supabase/postgres at PG_* from .env
make clean-state    # clear state/*.ok gates
```

### Step 1 -- schema (source-independent)

```sh
make init           # roles, schemas, extensions
make ddl            # apply pinned Prisma artifact -> demos_app; capture FKs
```

Expected last line of each: `gate '<phase>' satisfied`.

### Step 2 -- load + transform (against the static snapshot)

```sh
make load_full      # pgloader full pull -> mysql_raw
make load_fidelity  # row-count parity vs source (non-gating)
make seeds          # static seed/lookup tables
make crosswalks     # fail-closed completeness checks
make id_maps        # deterministic id maps
make crosswalk_audit # validate crosswalks vs the snapshot (non-gating)
```

### Step 3 -- cutover chain to parity

```sh
make preflight                       # PG checks; prod-schema guard WARN-skips
printf 'y\n' | make freeze           # records freeze_instant + _delta_log row
make delta                           # re-pull curated anchors, mark gate
make build                           # build_stg -> build_app, emits filter report
make constraints                     # re-add captured FKs
make parity ARGS=--accept-pending    # writes reports/runs/parity_*.md; gate on zero-RED
```

Expected parity last line on success:
`gate 'parity' satisfied` (overall PENDING, zero RED).

## Acceptance criteria

- Every phase reaches `gate '<phase>' satisfied`.
- `parity` overall is **PENDING with zero RED** (best case) -> the build path is
  proven end-to-end.
- A short RED list is the expected realistic outcome -> record it as the fix
  backlog; do **not** fix during the probe.

## W5 / W6 triage playbook

Two parity checks are the known RED risks; with a static source, a RED here is a
genuine migration finding, not noise.

- **check 8 -- state/territory coverage (W5).** A kept demonstration whose
  state code is a territory (FM/MH/PW/UM), NULL, or junk is dropped by the
  loader's `JOIN state_region` -> present in source, absent in target -> RED.
  Capture the offending state codes and kept-demo ids; decision (add territory
  to `state_region` vs filter) is a separate task.
- **check 11 -- active-user coverage (W6).** A still-active account dropped by
  the user filter with no `keep_ids` override -> RED. Capture the user ids.

On any RED: stop, record the concrete rows in the rehearsal log, and escalate
for a fix decision. Re-running after a fix starts from `make clean-state`.

## Teardown

```sh
make spin_down      # remove the local target container
```

## See also

- [Rehearsal command inventory](../docs/operator/reference-rehearsal-commands.adoc) -- per-command expected output, known REDs, recovery, and the diagnostic toolkit for this probe.
