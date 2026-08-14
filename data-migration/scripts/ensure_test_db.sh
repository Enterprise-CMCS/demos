#!/usr/bin/env sh
# Resolve a working PG_TEST_DSN for the SQL harness by REUSING an already-running
# Postgres before spinning up a new container. Prints ONLY the DSN on stdout;
# every diagnostic goes to stderr, so callers can capture it cleanly:
#
#   PG_TEST_DSN="$(sh scripts/ensure_test_db.sh)" uv run pytest tests/sql/ -v
#
# Resolution order:
#   1. $PG_TEST_DSN already set       -> validate + reuse verbatim
#   2. demos-test-pg running (:55432) -> reuse (supabase_admin / postgres)
#   3. demos-dev-pg  running (:PG_PORT)-> reuse (supabase_admin / PG_PASSWORD)
#   4. nothing reusable               -> make test-db-up, then reuse demos-test-pg
#
# The SQL harnesses `DROP SCHEMA demos_app/migration/stg CASCADE`, so this always
# targets a dedicated throwaway "harness" database -- NEVER demos_migration. It
# connects as the supabase_admin superuser (needed for 00_init roles and the
# non-trusted pg_jsonschema extension) and never stops a container it reused.
set -eu

ROOT_DIR=$(unset CDPATH; cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env"

SUPERUSER=supabase_admin
HARNESS_DB=harness
TEST_CONTAINER=demos-test-pg
TEST_PORT=55432
TEST_PASS=postgres
DEV_CONTAINER=demos-dev-pg

log() { printf '%s\n' "$*" >&2; }
die() { log "ensure_test_db: $*"; exit 1; }

# Value of KEY from the environment, else the first `KEY=` line in .env.
env_or_dotenv() {
  key=$1
  eval "val=\${$key:-}"
  if [ -z "${val:-}" ] && [ -f "$ENV_FILE" ]; then
    val=$(sed -n "s/^$key=//p" "$ENV_FILE" | head -n1 | tr -d '\r')
  fi
  printf '%s' "$val"
}

command -v docker >/dev/null 2>&1 || die "docker not found; start Docker and retry"

PG_DB=$(env_or_dotenv PG_DB); PG_DB=${PG_DB:-demos_migration}

container_running() { docker ps --format '{{.Names}}' | grep -qx "$1"; }

# Refuse any DSN whose database is the active dev DB: the harness is destructive.
guard_db() {
  case "$1" in
    "$PG_DB" | demos_migration)
      die "refusing destructive harness against db '$1'; use the throwaway '$HARNESS_DB' db"
      ;;
  esac
}

# Create the throwaway harness db on a container (idempotent), as the superuser
# over its local socket so no host psql/TCP round-trip is needed.
ensure_harness_db() {
  docker exec -e PGPASSWORD="$2" -i "$1" \
    psql -v ON_ERROR_STOP=1 -U "$SUPERUSER" -d postgres -v db="$HARNESS_DB" >&2 <<'SQL'
SELECT format('CREATE DATABASE %I', :'db')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db')\gexec
SQL
}

# Confirm the host-TCP DSN actually connects (catches a stale container password
# vs .env). Runs inside the project env so psycopg is importable.
probe_dsn() {
  if ! ( cd "$ROOT_DIR" && PG_TEST_DSN_PROBE="$1" uv run python - >&2 ) <<'PY'
import os, sys, psycopg
try:
    psycopg.connect(os.environ["PG_TEST_DSN_PROBE"], connect_timeout=5).close()
except Exception as e:
    print(f"  probe failed: {type(e).__name__}: {str(e).splitlines()[0]}", file=sys.stderr)
    sys.exit(1)
PY
  then
    die "resolved DSN is not reachable over TCP: $1"
  fi
}

emit() {
  guard_db "$HARNESS_DB"
  dsn="postgresql://$SUPERUSER:$2@127.0.0.1:$1/$HARNESS_DB"
  probe_dsn "$dsn"
  printf '%s\n' "$dsn"
}

# 1. Respect an explicitly-set DSN.
if [ -n "${PG_TEST_DSN:-}" ]; then
  log "PG_TEST_DSN already set; validating and reusing it"
  rest=${PG_TEST_DSN%%\?*}
  guard_db "${rest##*/}"
  probe_dsn "$PG_TEST_DSN"
  printf '%s\n' "$PG_TEST_DSN"
  exit 0
fi

# 2. Reuse the running test container.
if container_running "$TEST_CONTAINER"; then
  log "reusing running $TEST_CONTAINER on :$TEST_PORT (leaving it running)"
  ensure_harness_db "$TEST_CONTAINER" "$TEST_PASS"
  emit "$TEST_PORT" "$TEST_PASS"
  exit 0
fi

# 3. Reuse the running dev container.
if container_running "$DEV_CONTAINER"; then
  dev_port=$(env_or_dotenv PG_PORT);     dev_port=${dev_port:-5433}
  dev_pass=$(env_or_dotenv PG_PASSWORD); dev_pass=${dev_pass:-postgres}
  log "reusing running $DEV_CONTAINER on :$dev_port (leaving it running)"
  ensure_harness_db "$DEV_CONTAINER" "$dev_pass"
  emit "$dev_port" "$dev_pass"
  exit 0
fi

# 4. Nothing reusable: spin up a fresh test container (single source of truth).
log "no reusable Postgres found; running 'make test-db-up'"
make -C "$ROOT_DIR" test-db-up >&2
i=0
until docker exec "$TEST_CONTAINER" pg_isready -U "$SUPERUSER" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && die "$TEST_CONTAINER did not become ready in 60s"
  sleep 1
done
ensure_harness_db "$TEST_CONTAINER" "$TEST_PASS"
emit "$TEST_PORT" "$TEST_PASS"
