# Load migrated demos_app into the DEMOS devcontainer

Load the **transformed `demos_app` data** into the sister `../demos`
devcontainer Postgres so DEMOS can be exercised against real migrated data.

Approach **C1**: build the full pipeline in a **scratch** Postgres, then ship
**only** `demos_app` (data) onto a devcontainer schema created canonically by
the local app's `prisma migrate deploy`. The scratch build's
`mysql_raw`/`stg`/`migration` schemas never reach the devcontainer, and the
devcontainer never needs `pg_jsonschema` (it is migration-internal only; no
live `demos_app.*` column uses it).

Success criterion: the app boots and GraphQL returns migrated rows.

## Why this is safe

`demos_app` is **pure Prisma** (all migration supplements live in the
`migration` schema), built from the same `migration.sql` files that
`prisma migrate deploy` applies. A scratch build and a devcontainer
`migrate deploy` therefore produce an identical `demos_app` schema; we only
move the data rows. `make migrate-local-verify` fails closed if the local
`../demos` migration set drifts from the pinned Prisma manifest.

## Pre-conditions

- [ ] `MYSQL_URL` points at the source snapshot; `PG_URL` points at your
      **scratch** target (the local 5433 target, which has `pg_jsonschema`).
- [ ] The DEMOS devcontainer is up (its `db` service publishes host `5432`).
      The target defaults to the devcontainer's published local settings
      (user/password/host/port/db via the `DEVCONTAINER_PG_*` vars, host
      `localhost`, port `5432`, db `demos`); override the whole DSN with
      `DEVCONTAINER_PG_URL`. See `../demos/.devcontainer/docker-compose.yml`.
- [ ] `../demos/server` dependencies installed (`npm ci`) so `npx prisma` and
      `npm run dbrefresh` work; `psql`, `pg_dump`, `pg_restore` on `PATH`.
- [ ] Pinned Prisma manifest present:
      `uv run migrate fetch-prisma --refresh` (writes
      `reports/prisma_ddl.manifest.json`). Re-run whenever you re-pin.
- [ ] Local `../demos` is checked out at the **same commit** as the pin
      (verified automatically in step 1).

## One-shot

```sh
make migrate-local
# pass flags via ARGS, e.g. reuse an existing scratch build:
make migrate-local ARGS="--no-build"
# build on a stock scratch Postgres (no pg_jsonschema):
make migrate-local ARGS="--skip-jsonschema"
```

`make migrate-local` runs `scripts/migrate_local.py`, which executes:

1. **verify-prisma-local** - fail closed if `../demos` drifts from the pin.
2. **scratch build** - `init ddl load-full seeds crosswalks id-maps build
   constraints` against `PG_URL` (add `--parity` to also run
   `parity --accept-pending`).
3. **prisma migrate deploy** - build the devcontainer `demos_app` schema
   (`DATABASE_URL=<devcontainer>?schema=demos_app`); populates
   `_prisma_migrations` correctly.
4. **truncate** - clear every devcontainer `demos_app` table except
   `_prisma_migrations`.
5. **pg_dump** - `-Fc --data-only --schema=demos_app` from scratch
   (excluding `_prisma_migrations`).
6. **pg_restore** - `--data-only --disable-triggers` into the devcontainer
   (runs before `dbrefresh`, so migrated rows do not fire history triggers;
   `--disable-triggers` also bypasses FK checks during COPY - the data was
   already validated by the scratch `constraints` phase).
7. **dbrefresh** - `npm run dbrefresh` with `IS_TEST_MIGRATION=true`, adding
   `utility_views` / `permissions` / `history_triggers` / `functions`
   (skips `cron_schedules`, a pg_cron limitation).
8. **smoke** - assert `demos_app.demonstration` is non-empty.

Useful flags: `--no-build` (reuse scratch), `--no-schema` (schema already
deployed), `--no-dbrefresh`, `--scratch-dsn`, `--devcontainer-dsn`,
`--demos-local`.

## Verify manually

```sh
# $DEVCONTAINER_PG_URL is the devcontainer DSN (see Pre-conditions).
psql "$DEVCONTAINER_PG_URL" \
  -c "SELECT count(*) FROM demos_app.demonstration;" \
  -c "SELECT count(*) FROM demos_app.\"user\";"
```

Then start the app in the devcontainer and run a GraphQL query (port 4000):

```graphql
query { demonstrations { id name state { id } } }
```

## Logging in (dev-only auth note)

DEMOS's `server/src/auth/decodeToken.ts` verifies the `id_token` cookie
against the **real Cognito JWKS** (RS256, fixed issuer/audience) - there is no
built-in local bypass. To actually use the UI/GraphQL locally, either:

- **Real token**: paste a valid Cognito `id_token` (from a logged-in session)
  as the `id_token` cookie; its `email` claim should match a migrated user.
- **Dev shim (uncommitted)**: temporarily gate `decodeToken` behind an env
  flag (e.g. `LOCAL_AUTH_BYPASS=true`) that trusts a locally minted token and
  returns its claims. `buildContextFromClaims` resolves/provisions the user
  from the `email`/`role` claims, so a migrated user's email logs you in as
  that user. **Never commit this shim** to the DEMOS repo.

Example minimal claims payload (email must exist among migrated users):

```json
{ "email": "someone@example.com", "sub": "dev", "custom:roles": "cms-admin",
  "given_name": "Dev", "family_name": "User", "auth_time": 1700000000 }
```

## Re-running

`make migrate-local` is idempotent: step 4 truncates and step 6 reloads. To
refresh only the data after schema is already in place, use
`ARGS="--no-schema"`; to reuse an existing scratch build, add `--no-build`.

## Out of scope

- No production auth wiring (dev-login note only).
- No devcontainer image change (`demos_app` needs no `pg_jsonschema`).
- Full parity stays in the dedicated supabase-image environment (`make
  test-db-up`); the devcontainer load is about feeding real data to the app.
