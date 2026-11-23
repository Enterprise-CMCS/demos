# Deployment utilities

## Data-fix lint

Run the linter from `deployment`:

```sh
npx tsx demosctl/index.ts data-fix:lint all
```

The default scan checks flat files in `server/src/data_fixes/` and SQL files in each immediate fix subdirectory. Put a forward fix and its reversal in the same `server/src/data_fixes/<name_of_data_fix>/` folder; their header references remain file names, not paths. To lint one fix folder, pass it as the optional directory argument, for example `npx tsx demosctl/index.ts data-fix:lint all ../server/src/data_fixes/my_fix`.

## Data-fix PostgreSQL integration test

Run the opt-in live suite from the repository root:

```sh
bash .devcontainer/run-data-fix-integration.sh
```

The launcher runs the existing devcontainer app image with a disposable PostgreSQL 17 service in a uniquely named Compose project. It migrates and refreshes only that database, runs the live Vitest suite, and removes that project and its temporary dependency volumes on success or failure. It does not start or connect to the persistent `db` service, publish a database port, or use AWS/RDS. Ordinary `npm test` discovery remains database-free.

Before installing dependencies or running migrations, the app verifies `DEVCONTAINER=true`, `CURRENT_ENV=local`, `IS_TEST_MIGRATION=true`, and the complete per-run disposable database target. Missing or unexpected settings stop the run with guidance and without opening a database connection.

The data-fix runner's timeout defaults are defined in `demosctl/commands/dataFix.ts`: `DATA_FIX_BODY_TIMEOUT_MS` limits the complete multi-statement SQL body, `DATA_FIX_STATEMENT_TIMEOUT_MS` limits each statement, `DATA_FIX_LOCK_TIMEOUT_MS` bounds each lock wait, and `DATA_FIX_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS` limits idle time in an open transaction. They apply in both dry-run and apply modes. A dry run rolls back transactional row changes, history, and ledger writes, but PostgreSQL sequences are not transactional and may still advance.