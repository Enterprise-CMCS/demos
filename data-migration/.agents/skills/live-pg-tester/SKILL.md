---
name: live-pg-tester
version: 1.1.0
description: |
  Spin up a throwaway local Postgres cluster for DB-gated tests that skip
  without PG_TEST_DSN. Use when SQL/integration tests print "skipping" and you
  want to run them locally instead of leaving them skipped.
---

# Live PG tester

Requires Homebrew Postgres (`brew install postgresql@16`). The tool checks
prerequisites at runtime.

## CLI tool

```sh
bin/pg-test-harness start                                # spin up, print DSN
bin/pg-test-harness run -- uv run pytest tests/sql/ -v   # start, run, tear down
bin/pg-test-harness stop                                 # tear down
bin/pg-test-harness status                               # check if running
```

`run` starts the cluster if needed, sets `PG_TEST_DSN`, runs the command, and
tears down only if it started the cluster. See `bin/pg-test-harness` for
implementation.

## Gotchas

- No `pg_jsonschema` or other third-party extensions. Use the project's Docker
  setup (`make test-db-up`) for those tests.
- Don't target a real/shared database; the DSN points only at the disposable
  local cluster on port 54329.
- Don't put `PGDATA` under iCloud dirs (`~/Documents`, `~/Desktop`); `/tmp`
  avoids hidden-flag issues. See the `unhide-icloud-files` skill.
