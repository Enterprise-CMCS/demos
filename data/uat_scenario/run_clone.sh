#!/usr/bin/env bash

set -euo pipefail

# This is the top-level clone entry point. It exports one demonstration slice from the
# source database, remaps synthetic IDs, imports into the target database, and can then
# copy the related S3 objects between source and target storage environments.
usage() {
  cat >&2 <<'EOF'
Usage: run_clone.sh <source_demonstration_id> [options]

Options:
  --source-schema NAME   Source database schema. Required unless SOURCE_DB_SCHEMA is set
  --target-schema NAME   Target database schema. Required unless TARGET_DB_SCHEMA is set
  --copy-s3              After DB import, copy document objects using s3_path_mapping.csv
  --source-real-aws      Pass through to the S3 copy step for real AWS source access
  --target-real-aws      Pass through to the S3 copy step for real AWS target access
  --real-aws             Pass through to the S3 copy step for real AWS on both sides
  --help                 Show this help

Environment:
  SOURCE_DATABASE_URL    Source database connection string for export
  TARGET_DATABASE_URL    Target database connection string for import
EOF
}

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found on PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but was not found on PATH." >&2
  exit 1
fi

# Keep source and target configuration separate so cloning can happen across different
# databases even when their schema names differ.
source_demonstration_id=""
source_schema="${SOURCE_DB_SCHEMA:-}"
target_schema="${TARGET_DB_SCHEMA:-}"
copy_s3="false"
s3_args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-schema)
      source_schema="$2"
      shift 2
      ;;
    --target-schema)
      target_schema="$2"
      shift 2
      ;;
    --copy-s3)
      copy_s3="true"
      shift
      ;;
    --source-real-aws|--target-real-aws|--real-aws)
      s3_args+=("$1")
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -n "$source_demonstration_id" ]]; then
        echo "Unexpected extra argument: $1" >&2
        usage
        exit 1
      fi
      source_demonstration_id="$1"
      shift
      ;;
  esac
done

if [[ -z "$source_demonstration_id" ]]; then
  usage
  exit 1
fi

source_database_url="${SOURCE_DATABASE_URL:-}"
target_database_url="${TARGET_DATABASE_URL:-}"

if [[ -z "$source_database_url" ]]; then
  echo "SOURCE_DATABASE_URL must be set before running this script." >&2
  exit 1
fi

if [[ -z "$target_database_url" ]]; then
  echo "TARGET_DATABASE_URL must be set before running this script." >&2
  exit 1
fi

if [[ -z "$source_schema" ]]; then
  echo "SOURCE_DB_SCHEMA must be set or provided with --source-schema." >&2
  exit 1
fi

if [[ -z "$target_schema" ]]; then
  echo "TARGET_DB_SCHEMA must be set or provided with --target-schema." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"

cd "$script_dir"

# Step 1: export the source demonstration and its related rows into output/*.csv.
echo "Exporting source demonstration $source_demonstration_id from source database"
psql "$source_database_url" \
  -v demonstration_id="$source_demonstration_id" \
  -v db_schema="$source_schema" \
  -f export.sql

# Step 2: replace synthetic UUIDs consistently across the exported files and produce
# the manifests needed by later database and S3 steps.
echo "Remapping synthetic UUIDs in output/*.csv"
python3 remap_ids.py --source output --target output --manifest output/uuid_remap.json --s3-mapping output/s3_path_mapping.csv

# Step 3: import the remapped slice into the target database, applying the target-side
# ownership and reference-data rules defined in import.sql.
echo "Importing remapped CSVs into target database"
psql "$target_database_url" \
  -v db_schema="$target_schema" \
  -f import.sql

if [[ "$copy_s3" == "true" ]]; then
  # Step 4: replay the document S3 object copy using the generated key mapping. Any
  # real-AWS flags are simply forwarded to the lower-level S3 copy helper.
  echo "Copying document objects from source S3 to target S3"
  "$script_dir/copy_s3_paths_localstack.sh" --mapping-file output/s3_path_mapping.csv "${s3_args[@]}"
fi

echo "Done. UUID map written to output/uuid_remap.json and s3 mapping written to output/s3_path_mapping.csv"