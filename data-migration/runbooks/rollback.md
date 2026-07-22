# Rollback runbook

Triggers and the action for each.

## Triggers

| Trigger | Where | Action |
|---|---|---|
| Gate 0 red | P0 | Cancel cutover; reschedule. |
| Gate 2 red | P2 | Re-run `uv run migrate delta` once. Persistent failure -> rollback. |
| Constraint violations | P5 | Triage; if fixable < 30 min, fix-forward; otherwise rollback. |
| Parity red | P6 | Rollback. |
| Manual no-go | After P6 | Rollback. |
| Smoke red | P8 | Rollback. |
| Sev-1 in hypercare | P9 | Decision: fix-forward vs rollback. Rollback only if data integrity is at risk. |

## Steps

```sh
uv run migrate rollback
```

The command prompts for confirmation (must type `rollback`) then walks through:

1. PMDA restored to read-write mode (manual; coordinate with DBA). PMDA and DEMOS are separate apps on separate URLs, so there is no DNS or load-balancer swap to revert.
2. DEMOS placed in read-only with banner: "Migration paused; service restored."
3. Send rollback comms (use `runbooks/comms/rollback.md`).
4. Triage in post-mortem channel.

`flip` and `smoke` gates are cleared so a future re-attempt starts clean. `freeze`, `delta`, `build`, `constraints`, `parity` remain valid (data is still correct in `demos_app`; we just aren't serving from it).

## After rollback

- Convene a post-mortem within 24 hours.
- Identify the single failure that triggered rollback.
- Fix forward in the repo; re-run two dress rehearsals before re-attempting cutover.
