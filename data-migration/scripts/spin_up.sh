#!/usr/bin/env sh
# Spin up a local DEMOS migration target Postgres for `make init` / `make rebuild`.
#
# Reads PG_DB / PG_USER / PG_PASSWORD / PG_PORT from the environment, falling
# back to ROOT/.env. Starts a supabase/postgres container (it bundles the
# non-trusted pg_jsonschema extension that sql/00_init/02_extensions.sql needs),
# then -- as the image's built-in superuser -- bootstraps a least-privilege
# owner role (LOGIN CREATEDB CREATEROLE, NOT superuser), a database it owns, and
# the three required extensions. `make init` then runs as PG_USER with only the
# rights it legitimately needs (the pre-installed pg_jsonschema makes its
# CREATE EXTENSION IF NOT EXISTS a no-op).
set -eu

ROOT_DIR=$(unset CDPATH; cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env"

# Value of KEY from the environment, else the first `KEY=` line in .env.
env_or_dotenv() {
  key=$1
  eval "val=\${$key:-}"
  if [ -z "${val:-}" ] && [ -f "$ENV_FILE" ]; then
    val=$(sed -n "s/^$key=//p" "$ENV_FILE" | head -n1 | tr -d '\r')
  fi
  printf '%s' "$val"
}

PG_DB=$(env_or_dotenv PG_DB);             PG_DB=${PG_DB:-demos_migration}
PG_USER=$(env_or_dotenv PG_USER);         PG_USER=${PG_USER:-migration_owner}
PG_PASSWORD=$(env_or_dotenv PG_PASSWORD); PG_PASSWORD=${PG_PASSWORD:-postgres}
PG_PORT=$(env_or_dotenv PG_PORT);         PG_PORT=${PG_PORT:-5433}

CONTAINER=${PG_DEV_CONTAINER:-demos-dev-pg}
IMAGE=${PG_DEV_IMAGE:-supabase/postgres:15.8.1.060}
SUPERUSER=supabase_admin

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found; install Docker (or start the daemon) and retry" >&2
  exit 1
fi

# Reuse an existing container; otherwise create one. The supabase image's
# built-in superuser password is POSTGRES_PASSWORD, which we set to PG_PASSWORD.
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker start "$CONTAINER" >/dev/null
else
  docker run -d --name "$CONTAINER" \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -p "$PG_PORT:5432" "$IMAGE" >/dev/null
fi

# Wait until the server accepts connections (pg_isready ignores auth).
i=0
until docker exec "$CONTAINER" pg_isready -U "$SUPERUSER" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo "postgres did not become ready in 60s" >&2; exit 1; }
  sleep 1
done

# As the built-in superuser: create the least-privilege owner role and the
# database it owns (both idempotent via the WHERE NOT EXISTS guards). The
# image's superuser requires a password even on the local socket; it equals
# POSTGRES_PASSWORD, which we set to PG_PASSWORD.
docker exec -e PGPASSWORD="$PG_PASSWORD" -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$SUPERUSER" -d postgres \
  -v role="$PG_USER" -v pass="$PG_PASSWORD" -v db="$PG_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN CREATEDB CREATEROLE PASSWORD %L', :'role', :'pass')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role')\gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'role')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db')\gexec
SQL

# Pre-install the required extensions as the superuser: pg_jsonschema is not a
# "trusted" extension, so the non-superuser owner cannot CREATE it; doing it
# here makes sql/00_init/02_extensions.sql's IF NOT EXISTS a no-op.
docker exec -e PGPASSWORD="$PG_PASSWORD" -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$SUPERUSER" -d "$PG_DB" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;
SQL

echo "$CONTAINER ready on localhost:$PG_PORT (db $PG_DB, owner $PG_USER)"
echo "  connect as $PG_USER on localhost:$PG_PORT/$PG_DB (PG_URL already set in .env)"
echo "  next: make init   (or: make rebuild)"
