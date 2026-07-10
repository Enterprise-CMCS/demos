#!/usr/bin/env bash
# Thin shim for muscle memory: ./scripts/cutover.sh <phase>  ==  uv run migrate <phase>
# All argv (including --help, --version, --accept-pending, etc.) is forwarded
# verbatim; no flag is consumed here.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
exec uv run migrate "$@"
