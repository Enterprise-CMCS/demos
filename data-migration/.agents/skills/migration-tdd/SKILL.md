---
name: migration-tdd
version: 1.1.0
description: |
  Use when implementing or fixing migration phase logic, SQL transforms,
  gate behavior, or parity checks in this repo. Applies TDD to the
  specific failure patterns this codebase has: silent exits on failure,
  gate bypasses, data quietly dropped, and exit-0-on-RED bugs.
  Required before writing any phase module change, SQL file, or fix commit.
---

# Migration TDD

Test-driven development for the demos-data-migration pipeline. The
codebase has a recurring pattern of **silent failures**: code that
should `die()` returns instead, gates that should block fire green,
and data that should be rejected gets quietly dropped. TDD catches
these before they ship.

## When to use

- Adding or changing any `migration/phases/*.py` logic
- Writing or modifying SQL in `sql/`
- Fixing a bug (write the regression test first)
- Adding a new parity check or gate condition
- Changing `migration/lib.py` helpers that phases depend on

## The cycle

1. **Write a failing test** that asserts the *correct* behavior (not
   the current broken behavior). For silent-failure bugs, the test
   must assert a non-zero exit or a `die()` call, not just "no crash."
2. **Run it, watch it fail** for the right reason.
3. **Write minimal code** to pass.
4. **Run it, watch it pass.**
5. **Refactor** without changing behavior.

## Take-home from the code review (read before you pick a test)

The Tests section of `CODE_REVIEW.md` measured this suite and found a
consistent, dangerous shape. Internalize these before deciding *what*
to test, not just how:

- **Coverage correlates inversely with operational danger.** The
  best-tested modules (`flip` 98%, `parity` 97%, `prisma_schema`/`fk_candidates`
  95%) are the safe, pure ones. The cutover's first three live writes —
  `freeze` (31%), `preflight` (10%), `load_full` (17%) — are the
  *least* tested files in the repo. When you touch any low-coverage
  orchestration module, the highest-value test you can write almost
  certainly does not exist yet.
- **A green local `make test` certifies the pure functions, not the
  migration.** 291 of ~332 tests pass with no database; the harnesses
  that prove the migration actually works only run with `PG_TEST_DSN`
  (locally on demand, always in CI). If you changed phase or SQL logic
  and only ran `make test`, you have tested almost nothing about the
  thing being shipped. Run the SQL tier.
- **Two open High findings are latent precisely because no test
  catches them:** H1 (`build_app` `TRUNCATE ... CASCADE` can cascade
  through re-added FKs into seeded lookups) and H2 (`parity` RED still
  exits 0). A finding stays "latent" instead of "caught" exactly until
  someone writes the regression test. That conversion is worth more
  than any additional coverage on the already-95% modules.

### The highest-value tests still missing (write these first if relevant)

1. **`build_app` truncate-CASCADE safety** — apply demos_app FKs,
   seed a lookup, re-run `run_build_app`, assert the seeded rows
   survive. Catches H1. Needs `PG_TEST_DSN`.
2. **`parity` RED exit code** — assert RED (and PENDING without
   `accept_pending`) exits non-zero. Catches H2. Pure/mockable.
3. **`freeze` write behavior** — monkeypatch `confirm`, assert the
   `_delta_log` insert and `freeze_instant.txt` content.
4. **`preflight` failure paths** — assert each check flips `ok` and
   `die`s; add MySQL reachability (CODE_REVIEW M1) when it lands.
5. **`history` post-trigger tripwire** — once S3 lands, assert
   re-running with a `log_changes_*` trigger present raises.

## What to test for (this codebase specifically)

### Silent exits on failure

The most common bug pattern here: a phase detects a problem, logs it,
and returns instead of calling `die()`. Tests must assert the process
exits non-zero, not just that a message was logged.

`run_parity(accept_pending=False)` loads its own `Env` and takes no
`env` argument. It currently *logs* `"parity gate not green"` and
returns on RED (`parity.py:585`) instead of dying — assert the exit,
not the log line.

```python
def test_parity_red_exits_nonzero(monkeypatch):
    """CODE_REVIEW H2: parity reports RED but exits 0."""
    # BAD: assert "not green" in caplog.text  <- passes while the bug ships
    # GOOD: assert the process actually exits non-zero on RED
    _stub_red_report(monkeypatch)            # force overall == "RED"
    with pytest.raises(SystemExit) as exc_info:
        run_parity(accept_pending=False)
    assert exc_info.value.code != 0
```

The difference between "RED status is computed correctly" and "RED
*exits* non-zero" is the whole bug: `test_parity.py` already asserts
the first (the status rollup) and still misses H2 because it never
asserts the second.

### Gate bypasses

Gates are file-based (`state/*.ok`). A phase that runs cleanly but
does nothing useful can still mark its gate green. Test that gates are
only marked when the phase actually did work.

```python
def test_build_app_marks_gate_only_with_files(tmp_state_dir):
    """CODE_REVIEW M5: empty dir phases can be silent no-ops."""
    # If sql/20_app is empty, build_app should NOT mark the gate
    ...
```

### Data quietly dropped

Override CSVs, crosswalks, and filter logic that encounters malformed
input must reject, not degrade silently. `_load_override_csv(conn,
table, csv_path)` treats a *missing* file as a legitimate no-op but a
*present-but-malformed* file dies via `copy_csv_into_table`'s
`header_expect` check (commit `34865fc`, CODE_REVIEW M2 — now fixed,
keep it regression-tested).

```python
def test_malformed_override_csv_raises(pg_db, tmp_path):
    """Commit 34865fc: die on malformed override CSV, not silent skip."""
    bad_csv = tmp_path / "keep_ids.csv"
    bad_csv.write_text("\ufeffwrong_header\n123\n")  # BOM + wrong header
    with pytest.raises(SystemExit):
        build._load_override_csv(pg_db, "_keep_ids", bad_csv)
```

### SQL idempotency

Every SQL file must apply cleanly twice. The `tests/sql/` harnesses
exercise this against a live Postgres. Write the apply-twice test
before writing or changing SQL.

```python
def test_my_new_sql_is_idempotent(pg_db):
    """Apply the SQL file twice; the second pass must not error."""
    sql_text = (SQL_DIR / "20_app" / "my_new_file.sql").read_text()
    pg_db.execute(sql_text)        # first apply
    pg_db.execute(sql_text)        # second apply -- must not raise
```

## Where tests live

| Test type | Location | Needs DB? |
|-----------|----------|-----------|
| Pure Python logic | `tests/test_*.py` | No |
| SQL idempotency | `tests/sql/test_*.py` | Yes (`PG_TEST_DSN`) |
| Integration (live engines) | `tests/integration/` | Yes (compose-up) |

DB-gated tests skip without `PG_TEST_DSN`. Use `make test-db-up` (Docker,
includes `pg_jsonschema`) or the `live-pg-tester` skill (local Postgres,
no pg_jsonschema) to run them locally.

## Verify it worked

```sh
make test          # pure Python tests + coverage (no DB needed)
make test-db-up    # start the Docker Postgres with pg_jsonschema
PG_TEST_DSN="postgresql://supabase_admin:postgres@127.0.0.1:55432/harness" \ # pragma: allowlist secret
  uv run pytest tests/sql/ -v  # SQL harness tests
make test-db-down  # stop the Docker Postgres
```

Coverage floor in CI is 69%. Local `make test` should stay green and
above that line for the pure-Python tier.

## What not to do

- **Don't test only the happy path.** This codebase's bugs are in the
  error paths: malformed input, missing files, wrong exit codes.
- **Don't conflate status assertions with exit-code assertions.**
  Asserting `report.overall == "RED"` proves the *computation*, not the
  *consequence*. The H2 bug survives a fully-passing `test_parity.py`
  because every test checks the status and none checks the exit. If the
  correct behavior is "die," assert `pytest.raises(SystemExit)`.
- **Don't write tests that assert log messages instead of exit codes.**
  A logged error with exit 0 is the bug, not the fix.
- **Don't mistake "covered" for "verified" on rerun-safety claims.**
  `constraints` rerun is now partly tested (`_readd_captured_fks`
  drop-before-add, empty-list noop), but the load-bearing claim — a
  second `run_constraints` ends with zero invalid FKs — still needs a
  DB-backed test. A docstring asserting re-runnability is not a test.
- **Don't skip the apply-twice test for SQL changes.** Re-runnable SQL
  is a hard requirement for cutover-day rollback.
- **Don't trust `make test` alone for phase logic.** It runs no
  database tests, so a green run certifies the pure functions and says
  almost nothing about the migration. If you changed a phase or SQL,
  run the SQL tier too.
