---
name: migration-debugging
version: 1.0.0
description: |
  Use when a migration phase produces wrong results silently, a gate
  fires green when it should not, parity reports RED but the process
  exits 0, pgloader completes but data is missing, or any situation
  where the pipeline "succeeds" but the output is wrong. Covers the
  systematic approach to root-causing silent-failure bugs specific to
  this codebase.
---

# Migration debugging

This codebase has a class of bugs that are harder to find than
crashes: the pipeline runs to completion, prints "complete," and
produces wrong data. Systematic debugging means reproducing the
failure, isolating the cause, and fixing the root, not the first
symptom.

## When to use

- A phase exits 0 but the data is wrong, missing, or extra
- Parity reports RED but `make rebuild` says "complete"
- pgloader finishes but tables are empty or partially loaded
- A gate is marked satisfied but the phase did no work
- Crosswalk or override data silently vanishes from the output
- SQL runs without error but produces unexpected results

## The method

### 1. Reproduce with the smallest possible input

Don't debug against the full dataset. Create a minimal fixture that
triggers the wrong behavior.

```python
# In tests/sql/ or tests/test_*.py
def test_repro_missing_demo_years(pg_db):
    """Reproduce: soft-deleted demo-years leak into BN oracle (commit 74e1a0e)."""
    # Insert one active, one soft-deleted record
    pg_db.execute("INSERT INTO ... VALUES (1, true), (2, false)")
    result = run_bn_oracle(pg_db)
    assert len(result) == 1  # only the active record
```

### 2. Check the exit code, not just the output

The signature bug pattern: `die()` is not called when it should be.
Verify what the process actually exits with.

```sh
# Run the phase and check the exit code explicitly
uv run migrate parity; echo "EXIT: $?"
# If parity is RED and EXIT is 0, that's the bug (CODE_REVIEW H2)
```

### 3. Check whether the gate file was written

Gates are file-based (`state/*.ok`). A phase can succeed (exit 0)
without writing its gate, or write its gate without doing work.

```sh
ls -la state/*.ok
# If a gate file exists for a phase that did nothing, that's the bug
# (CODE_REVIEW M5: silent no-op phases)
```

### 4. Trace the data path

For data correctness bugs, trace the row through every transformation:

1. **Source:** What does MySQL have? (`SELECT COUNT(*) FROM source_table`)
2. **After pgloader:** What landed in `mysql_raw`?
3. **After staging filters:** What survived `sql/10_stg`?
4. **After build:** What's in `demos_app`?
5. **After parity:** What does the check report?

The row count should change predictably at each step. A silent drop
between steps 2 and 3 means a filter is wrong. A silent drop between
3 and 4 means the build SQL is wrong.

### 5. Check for silent degradation patterns

These are the known patterns where this codebase fails silently:

| Pattern | Symptom | Example |
|---------|---------|---------|
| Returns instead of `die()` | Error logged, exit 0 | parity H2 |
| Empty dir marks gate | Phase "succeeds," no work done | M5 |
| Malformed input dropped | Override/crosswalk data vanishes | M2, 34865fc |
| External tool exit trusted | pgloader "succeeds," data missing | a7e87c9 |
| Overwrite instead of assert | Audit record rewritten by wrong actor | M4 |
| CASCADE truncates excluded tables | Seeded reference data wiped | H1 |

### 6. Use DuckDB for offline analysis

The repo has a DuckDB layer (`migration/phases/duck.py`) and Parquet
companions for offline analysis without a live database. Use it to
inspect intermediate data states.

```sh
uv run python -c "
import duckdb
con = duckdb.connect()
con.execute(\"INSTALL parquet; LOAD parquet;\")
print(con.execute('SELECT count(*) FROM read_parquet(\"reports/*.parquet\")').fetchall())
"
```

## Verify the fix

- Write a regression test that would have caught the original bug
- Run the full phase chain locally: `make rebuild`
- Check that `make parity` now exits non-zero on RED
- Run the SQL idempotency tier: `make test-db-up` + `pytest tests/sql/`

## What not to do

- **Don't fix the first symptom you see.** The exit-0 bug might be
  caused by a missing `die()` three functions deep. Trace the call
  chain.
- **Don't add a `die()` without understanding why the original code
  returned.** The return might have been intentional for a different
  code path.
- **Don't test only with the full dataset.** Minimize first; a
  3-row fixture that reproduces the bug is worth more than a
  10,000-row run that almost does.
- **Don't skip the parity check after a fix.** A fix in one phase
  can break a downstream parity assertion.
