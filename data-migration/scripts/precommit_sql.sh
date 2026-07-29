#!/usr/bin/env sh
# Per-file SQL hygiene for staged data-migration SQL, driven by the repo-root
# .pre-commit-config.yaml.
#
# WHY THIS WRAPPER EXISTS
#
# pre-commit installs a single hook per stage at the git top level, so
# data-migration cannot own its own installed hooks without displacing the
# repo-wide ones (gitleaks, detect-secrets). Its checks therefore have to be
# invoked from the root config -- but they cannot simply run there:
#
#   * sqlfluff honours `templater = raw` only from a .sqlfluff in the *current*
#     directory. Run from the repo root it silently falls back to the jinja
#     templater, which parses this SQL under different rules.
#   * sql_fmt.py and check_sql_frontmatter.py resolve their in-scope set
#     relative to data-migration.
#
# So: re-anchor pre-commit's repo-root-relative arguments to absolute paths,
# then switch to data-migration before running anything.
#
# Checks are per-file by design. A full-tree `make sql-check` is red on
# pre-existing files, and gating every commit on that backlog would block work
# unrelated to it; gating only the files a commit touches pays the debt down as
# those files are edited. `make sql-check` remains the full-tree gate.
set -eu

DM_DIR=$(unset CDPATH; cd -- "$(dirname -- "$0")/.." && pwd)
REPO_ROOT=$(unset CDPATH; cd -- "$DM_DIR/.." && pwd)

# Rotate the positional list: shift each argument off the front and append it
# back, absolute, only if it is a data-migration path. Using the positional
# parameters rather than a string keeps filenames with spaces intact.
argc=$#
i=0
while [ "$i" -lt "$argc" ]; do
  arg=$1
  shift
  case "$arg" in
    data-migration/*) set -- "$@" "$REPO_ROOT/$arg" ;;
    /*) set -- "$@" "$arg" ;;
  esac
  i=$((i + 1))
done

[ "$#" -gt 0 ] || exit 0

cd "$DM_DIR"

# Run all three even if an earlier one fails, so a developer sees every problem
# in one pass instead of rediscovering them one commit at a time.
rc=0
uv run python scripts/sql_fmt.py --check "$@" || rc=1
uv run sqlfluff lint "$@" || rc=1
uv run python scripts/check_sql_frontmatter.py "$@" || rc=1
exit "$rc"
