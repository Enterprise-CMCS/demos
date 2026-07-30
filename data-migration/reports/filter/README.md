# Row-level filter reports

Per-run output of the allowlist filter defined in `sql/10_stg/0*_filter_*.sql`.

## Files

| File | Purpose |
| --- | --- |
| `keep_ids.csv` | Force-keep override. SME adds rows here for legitimate records the regexes misclassify. Columns: `entity, legacy_id, reason`. |
| `drop_ids.csv` | Force-drop override. SME adds rows here for long-tail junk no regex catches. Same column layout. |

Those two CSVs are the whole of this directory. The per-run report is **not**
written here: `emit_filter_report` in `migration/phases/build.py` writes
`reports/runs/filter_<stamp>.md`, one file per `stg` build, alongside the other
per-run artifacts. There is no `archive/` directory and nothing creates one; a
cutover run's report is preserved by the rehearsal/run capture under
`reports/rehearsals/` and `reports/runs/`, which are never pruned
automatically.

## Workflow

1. Run the `stg` build.
2. Open the latest `reports/runs/filter_<stamp>.md`.
3. For each section, decide whether the exclusion is correct.
4. Add legitimate rows to `keep_ids.csv`; add confirmed junk that wasn't caught to `drop_ids.csv`.
5. Re-run the `stg` build. The report is regenerated.
6. Sign the report's footer block before the rehearsal / cutover gate.

## Sign-off

The footer of every `filter_<stamp>.md` carries a reviewer / date block. A signed
report is the gate artifact for "row-level filter approved" at each rehearsal
and at T-24h on cutover day.

See `docs/operator/howto-curate-filter.adoc` for the full tuning loop.
