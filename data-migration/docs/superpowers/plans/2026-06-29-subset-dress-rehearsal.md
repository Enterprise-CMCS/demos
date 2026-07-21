# Subset Data for Dress Rehearsals (Operational + REHEARSAL guard)

> **Status:** DEFERRED / not started. Saved 2026-06-29 for later pickup.
> Required per-repo skill before any phase/SQL change: `migration-tdd`.
> Approach chosen by operator: **Approach 1 (Operational + docs)**, optimizing
> for "all of the above" (faster SQL iteration, lower load memory/time, and a
> full-but-faster end-to-end rehearsal) via a trimmed real source.

## Goal

Make it safe and documented to run a **faster, smaller-data dress rehearsal**
by pointing the pipeline at a trimmed real source, without pretending a subset
run satisfies the full-data timed rehearsal #2. No sampler is built (the empty
`reports/generated/fk_candidates.csv` makes automated referential closure infeasible).

## Why this shape

- pgloader `LOAD DATABASE` loads **whole tables** (no row `WHERE`); the existing
  keep/drop allowlist filter (`howto-curate-filter.adoc`) only trims at
  `mysql_raw -> stg`, *after* the costly load. The only way to shrink the load
  is a smaller **source**, already supported via `.env` (`MYSQL_URL` /
  `MYSQL_DB`).
- So the deliverable is a how-to recipe for producing/pointing at a trimmed
  source, plus a thin `REHEARSAL` labeling guard so a subset run's GREEN parity
  is never mistaken for the real exit gate.

## Code changes (minimal)

1. **`migration/lib.py`** - add `rehearsal_label() -> str | None`: returns the
   stripped `REHEARSAL` env value when truthy (non-empty and not
   `0`/`false`/`no`), else `None`.

2. **`migration/cli.py`** - add an `@app.callback()` that, when
   `rehearsal_label()` is set, prints one prominent banner before any command:
   `REHEARSAL MODE (<label>): non-production / subset run. GREEN parity here
   does NOT satisfy the rehearsal #2 exit gate.`

3. **`migration/phases/parity.py`** - add `rehearsal: str | None = None` to
   `ParityReport`; set it from `rehearsal_label()` in `run_parity`; in
   `to_markdown()` emit a `Mode: REHEARSAL (<label>)` line + a warning banner
   near the top when set. **No gating change** - parity must still be GREEN;
   `--accept-pending` stays the only relaxation. Keeps the artifact
   self-documenting.

## Docs

4. **New `docs/operator/howto-rehearse-on-subset.adoc`** covering:
   - The constraint (whole-table loads; shrink the source, not the load).
   - A concrete recipe: keep all `*_rfrnc`/static lookup tables in full,
     restrict the demonstration anchor tables (`mdcd_demo`, `mdcd_pendg_demo`,
     `mdcd_demo_aplctn`, `mdcd_demo_amndmt`, `mdcd_demo_rnwl`, `mdcd_dlvrbl`,
     contacts, `users`, mirroring the filter anchors) to a chosen demo set via
     `mysqldump --where`, load into a throwaway MySQL (e.g. the
     `docker-compose.test.yml` `mysql` service on 13306), point `.env` at it.
   - `REHEARSAL=1` usage and `PGLOADER_DYNAMIC_SPACE_MB` heap tuning
     (cross-link `howto-troubleshoot-pgloader.adoc`).
   - Referential caveat: a too-narrow dump can make checks 5/6/8 RED/PENDING
     for the wrong reason - widen scope or accept PENDING with a note.
   - Bold warning: a subset rehearsal is a fast script shakedown, **not** a
     substitute for the full-data timed rehearsal #2.

5. **Wire nav**: add the how-to to `docs/operator/index.adoc` (How-to list) and
   `docs/toc.adoc`; add a "Related" cross-link from
   `explanation-rehearsal-strategy.adoc` and
   `tutorial-first-cutover-rehearsal.adoc`.

## Tests

6. **New `tests/test_rehearsal.py`**: `rehearsal_label()` parsing (set / unset /
   `0` / `false` / whitespace); `ParityReport.to_markdown()` includes the banner
   + `Mode:` line when rehearsal set and omits both when not.

## Verification

`uv run pytest`, `uv run ruff check`, `uv run ty check` on touched files; run
the docs nav/`docnav` check if present. Commit via conventional-commits, scoped
only to these files (leaving the pre-existing dirty SQL files and the separate
pgloader heap fix untouched).

## Context captured at spec time (2026-06-29)

- `reports/generated/fk_candidates.csv` is **header-only** (no reconstructed FK graph),
  ruling out an automated referential-closure sampler without first authoring a
  dependency manifest.
- Rejected alternatives: (2) real-source sampler driven by a hand-authored
  manifest - high effort/fragile; (3) offline synthetic rehearsal seeding
  `mysql_raw` and skipping pgloader - fast SQL iteration but not a true load
  rehearsal and needs full-schema source fixtures that do not exist yet.
- Related: the separately-implemented pgloader heap fix added
  `lib.pgloader_argv()` + `PGLOADER_DYNAMIC_SPACE_MB` (default 4096 MB), which
  this how-to references for tuning.
