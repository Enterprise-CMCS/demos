#!/usr/bin/env sh
# Provision the migrate-local scratch database inside the DEMOS devcontainer's
# own Postgres, so `make migrate-local` can run the full build there without a
# separate `make spin_up` container.
#
# Connects as the devcontainer superuser (ADMIN_DSN, typically
# postgres@localhost:5432/demos) and bootstraps, idempotently:
#   * a least-privilege owner role (LOGIN CREATEDB CREATEROLE),
#   * the app-facing roles demos_read/demos_write/demos_delete, then GRANTs
#     them TO the owner WITH ADMIN OPTION -- required because the devcontainer
#     pre-creates those roles as the superuser and, on PG16+, a CREATEROLE role
#     can only ALTER roles it has ADMIN OPTION on (the build's
#     sql/00_init/01_schemas.sql does `ALTER ROLE demos_read IN DATABASE ...`),
#   * the owned scratch database.
#
# pgcrypto/uuid-ossp are trusted extensions the build itself creates as the DB
# owner (sql/00_init/02_extensions.sql); pg_jsonschema is intentionally omitted
# (this is a SKIP_JSONSCHEMA build). Values are interpolated via psql's format()
# %I/%L and :"var" identifier quoting, never raw string concatenation.
set -eu

ADMIN_DSN=${ADMIN_DSN:?ADMIN_DSN required (devcontainer superuser DSN)}
SCRATCH_ROLE=${SCRATCH_ROLE:-migration_owner}
SCRATCH_PASS=${SCRATCH_PASS:-postgres}
SCRATCH_DB=${SCRATCH_DB:-demos_migration}

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found on PATH; install the Postgres client and retry" >&2
  exit 1
fi

psql "$ADMIN_DSN" -v ON_ERROR_STOP=1 \
  -v role="$SCRATCH_ROLE" -v pass="$SCRATCH_PASS" -v db="$SCRATCH_DB" <<'SQL'
-- Least-privilege build/owner role (idempotent).
SELECT format('CREATE ROLE %I LOGIN CREATEDB CREATEROLE PASSWORD %L', :'role', :'pass')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role')\gexec

-- Ensure the app-facing roles exist so the GRANT below can hand the owner role
-- ADMIN on them (they are pre-created by the devcontainer as the superuser).
SELECT format('CREATE ROLE %I', r.role)
  FROM (VALUES ('demos_read'), ('demos_write'), ('demos_delete')) AS r(role)
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.role)\gexec

GRANT demos_read, demos_write, demos_delete TO :"role" WITH ADMIN OPTION;

-- Owned scratch database (idempotent; CREATE DATABASE cannot run in a DO block).
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'role')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db')\gexec
SQL

echo "provisioned scratch db '$SCRATCH_DB' (owner $SCRATCH_ROLE) in the devcontainer Postgres"
