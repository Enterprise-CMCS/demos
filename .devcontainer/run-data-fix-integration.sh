#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd -- "$SCRIPT_DIRECTORY/.." && pwd)"
export WORKSPACE_DIRECTORY="$(basename -- "$WORKSPACE_ROOT")"

RUN_ID="$(openssl rand -hex 8)"
PROJECT_NAME="data-fix-it-${RUN_ID}"
export DATA_FIX_TEST_DATABASE="data_fix_test_${RUN_ID}"
export DATA_FIX_TEST_USER="data_fix_user_${RUN_ID}"
export DATA_FIX_TEST_PASSWORD="$(openssl rand -hex 32)"

COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --project-directory "$SCRIPT_DIRECTORY"
  -f "$SCRIPT_DIRECTORY/docker-compose.yml"
  -f "$SCRIPT_DIRECTORY/data-fix-integration.compose.yml"
)

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  if ! python3 -c '
import subprocess
import sys

project, directory = sys.argv[1:]
command = [
    "docker", "compose", "--project-name", project, "--project-directory", directory,
    "-f", directory + "/docker-compose.yml", "-f", directory + "/data-fix-integration.compose.yml",
    "down", "--volumes", "--remove-orphans", "--rmi", "local", "--timeout", "5",
]
try:
    result = subprocess.run(command, check=False, timeout=30)
except subprocess.TimeoutExpired:
    print("Timed out removing the disposable data-fix Compose project.", file=sys.stderr)
    sys.exit(1)
sys.exit(result.returncode)
' "$PROJECT_NAME" "$SCRIPT_DIRECTORY"; then
    printf 'Failed to remove disposable Compose project %s.\n' "$PROJECT_NAME" >&2
    if [[ "$exit_code" -eq 0 ]]; then
      exit_code=1
    fi
  fi
  exit "$exit_code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

"${COMPOSE[@]}" run --build --rm app