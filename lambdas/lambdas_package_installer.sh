#!/usr/bin/env bash

set -e

BASE_DIR="/workspaces/demos/lambdas"
MAX_RETRIES=3

run_npm_ci() {
  local dir="$1"
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    echo "Attempt $attempt: npm ci in $dir"

    if (cd "$dir" && npm ci); then
      echo "✅ Success in $dir"
      return 0
    fi

    echo "⚠️ npm ci failed in $dir"
    attempt=$((attempt + 1))

    if [ $attempt -le $MAX_RETRIES ]; then
      echo "Retrying in 2 seconds..."
      sleep 2
    fi
  done

  echo "❌ Failed after $MAX_RETRIES attempts in $dir"
  return 1
}

for dir in "$BASE_DIR"/*; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "-----------------------------------"
    echo "Processing $dir"
    echo "-----------------------------------"
    run_npm_ci "$dir"
  fi
done

echo "All installs attempted."
