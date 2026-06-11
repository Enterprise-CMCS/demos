#!/usr/bin/env bash

set -euo pipefail

# Require the mapping file explicitly so the caller is clear about which generated
# clone output is being replayed.
mapping_file="${MAPPING_FILE:-}"
source_bucket="${SOURCE_BUCKET:-}"
target_bucket="${TARGET_BUCKET:-}"
source_endpoint="${SOURCE_AWS_ENDPOINT:-}"
target_endpoint="${TARGET_AWS_ENDPOINT:-}"
source_region="${SOURCE_AWS_REGION:-}"
target_region="${TARGET_AWS_REGION:-}"
source_profile="${SOURCE_AWS_PROFILE:-}"
target_profile="${TARGET_AWS_PROFILE:-}"
use_source_endpoint=""
use_target_endpoint=""
dry_run="false"
temp_dir=""

usage() {
  cat >&2 <<'EOF'
Usage: copy_s3_paths_localstack.sh [options]

Options:
  --mapping-file PATH   CSV mapping file to read. Required unless MAPPING_FILE is set
  --source-bucket NAME  Source bucket containing the old keys. Required unless SOURCE_BUCKET is set
  --target-bucket NAME  Target bucket for the remapped keys. Required unless TARGET_BUCKET is set
  --source-region NAME  Source AWS region. Required unless SOURCE_AWS_REGION is set
  --target-region NAME  Target AWS region. Required unless TARGET_AWS_REGION is set
  --source-profile NAME Source AWS CLI profile to use
  --target-profile NAME Target AWS CLI profile to use
  --source-endpoint URL Source AWS endpoint URL, such as LocalStack. Required unless --source-real-aws is used or SOURCE_AWS_ENDPOINT is set
  --target-endpoint URL Target AWS endpoint URL, such as LocalStack. Required unless --target-real-aws is used or TARGET_AWS_ENDPOINT is set
  --source-real-aws     Do not pass an endpoint URL for source operations
  --target-real-aws     Do not pass an endpoint URL for target operations
  --real-aws            Do not pass endpoint URLs for source or target operations
  --temp-dir PATH       Temp directory for object transfer files. Default: mktemp -d
  --dry-run             Print aws s3 cp commands without executing them
  --help                Show this help
EOF
}

# Build one AWS CLI argument array per side so source and target can use different
# regions, credentials, and endpoint behavior.
build_aws_cmd() {
  local region="$1"
  local profile="$2"
  local endpoint="$3"
  local use_endpoint="$4"
  local -n result_ref="$5"

  result_ref=(aws --region "$region")

  if [[ -n "$profile" ]]; then
    result_ref+=(--profile "$profile")
  fi

  if [[ "$use_endpoint" == "true" ]]; then
    result_ref+=(--endpoint-url="$endpoint")
  fi
}

# Echo the resolved source/target settings before any copy occurs so cross-environment
# mistakes are obvious in the logs.
print_aws_context() {
  local label="$1"
  local bucket="$2"
  local region="$3"
  local profile="$4"
  local endpoint="$5"
  local use_endpoint="$6"

  if [[ "$use_endpoint" == "true" ]]; then
    echo "$label endpoint: $endpoint"
  else
    echo "$label endpoint: standard AWS resolution"
  fi
  echo "$label bucket: $bucket"
  echo "$label region: $region"
  if [[ -n "$profile" ]]; then
    echo "$label profile: $profile"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mapping-file)
      mapping_file="$2"
      shift 2
      ;;
    --source-bucket)
      source_bucket="$2"
      shift 2
      ;;
    --target-bucket)
      target_bucket="$2"
      shift 2
      ;;
    --source-region)
      source_region="$2"
      shift 2
      ;;
    --target-region)
      target_region="$2"
      shift 2
      ;;
    --source-profile)
      source_profile="$2"
      shift 2
      ;;
    --target-profile)
      target_profile="$2"
      shift 2
      ;;
    --source-endpoint)
      source_endpoint="$2"
      use_source_endpoint="true"
      shift 2
      ;;
    --target-endpoint)
      target_endpoint="$2"
      use_target_endpoint="true"
      shift 2
      ;;
    --source-real-aws)
      use_source_endpoint="false"
      shift
      ;;
    --target-real-aws)
      use_target_endpoint="false"
      shift
      ;;
    --temp-dir)
      temp_dir="$2"
      shift 2
      ;;
    --real-aws)
      use_source_endpoint="false"
      use_target_endpoint="false"
      shift
      ;;
    --dry-run)
      dry_run="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$mapping_file" ]]; then
  echo "MAPPING_FILE must be set or provided with --mapping-file." >&2
  exit 1
fi

if [[ -z "$source_bucket" ]]; then
  echo "SOURCE_BUCKET must be set or provided with --source-bucket." >&2
  exit 1
fi

if [[ -z "$target_bucket" ]]; then
  echo "TARGET_BUCKET must be set or provided with --target-bucket." >&2
  exit 1
fi

if [[ -z "$source_region" ]]; then
  echo "SOURCE_AWS_REGION must be set or provided with --source-region." >&2
  exit 1
fi

if [[ -z "$target_region" ]]; then
  echo "TARGET_AWS_REGION must be set or provided with --target-region." >&2
  exit 1
fi

if [[ -z "$use_source_endpoint" ]]; then
  if [[ -n "$source_endpoint" ]]; then
    use_source_endpoint="true"
  else
    echo "SOURCE_AWS_ENDPOINT must be set or provided with --source-endpoint unless --source-real-aws is used." >&2
    exit 1
  fi
fi

if [[ -z "$use_target_endpoint" ]]; then
  if [[ -n "$target_endpoint" ]]; then
    use_target_endpoint="true"
  else
    echo "TARGET_AWS_ENDPOINT must be set or provided with --target-endpoint unless --target-real-aws is used." >&2
    exit 1
  fi
fi

if [[ ! -f "$mapping_file" ]]; then
  echo "Mapping file not found: $mapping_file" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required but was not found on PATH." >&2
  exit 1
fi

build_aws_cmd "$source_region" "$source_profile" "$source_endpoint" "$use_source_endpoint" source_aws_cmd
build_aws_cmd "$target_region" "$target_profile" "$target_endpoint" "$use_target_endpoint" target_aws_cmd

# Objects are copied through a temporary local file because source and target may be
# completely different AWS environments with different credentials or endpoints.
if [[ -z "$temp_dir" ]]; then
  temp_dir="$(mktemp -d)"
  cleanup_temp_dir="true"
else
  mkdir -p "$temp_dir"
  cleanup_temp_dir="false"
fi

cleanup() {
  if [[ "${cleanup_temp_dir:-false}" == "true" && -n "$temp_dir" ]]; then
    rm -rf "$temp_dir"
  fi
}

trap cleanup EXIT

print_aws_context "Source" "$source_bucket" "$source_region" "$source_profile" "$source_endpoint" "$use_source_endpoint"
print_aws_context "Target" "$target_bucket" "$target_region" "$target_profile" "$target_endpoint" "$use_target_endpoint"
if [[ "$dry_run" == "true" ]]; then
  echo "Dry run: commands will be printed but not executed"
fi
echo "Reading mappings from: $mapping_file"
echo "Using temp dir: $temp_dir"

copy_count=0
skip_count=0

while IFS=, read -r old_s3_path new_s3_path; do
  # The mapping CSV may be written with CRLF line endings, so strip any trailing
  # carriage return before using the keys in S3 commands.
  old_s3_path="${old_s3_path%$'\r'}"
  new_s3_path="${new_s3_path%$'\r'}"

  if [[ "$old_s3_path" == "old_s3_path" ]]; then
    continue
  fi

  # Skip malformed or placeholder rows rather than issuing partial copy commands.
  if [[ -z "$old_s3_path" || -z "$new_s3_path" ]]; then
    echo "Skipping incomplete mapping: old='$old_s3_path' new='$new_s3_path'" >&2
    skip_count=$((skip_count + 1))
    continue
  fi

  if [[ "$old_s3_path" == "tmp" || "$new_s3_path" == "tmp" ]]; then
    echo "Skipping placeholder tmp path: $old_s3_path -> $new_s3_path"
    skip_count=$((skip_count + 1))
    continue
  fi

  # Download from the source environment first, then upload into the target environment.
  # In dry-run mode these commands are only printed for review.
  temp_object_path="$temp_dir/object_$copy_count"
  download_args=("${source_aws_cmd[@]}" s3 cp "s3://$source_bucket/$old_s3_path" "$temp_object_path")
  upload_args=("${target_aws_cmd[@]}" s3 cp "$temp_object_path" "s3://$target_bucket/$new_s3_path")

  printf 'Download:'
  printf ' %q' "${download_args[@]}"
  printf '\n'
  printf 'Upload:'
  printf ' %q' "${upload_args[@]}"
  printf '\n'

  if [[ "$dry_run" == "false" ]]; then
    "${download_args[@]}"
    "${upload_args[@]}"
    rm -f "$temp_object_path"
  fi

  copy_count=$((copy_count + 1))
done < "$mapping_file"

if [[ "$dry_run" == "true" ]]; then
  echo "Prepared $copy_count copy commands; skipped $skip_count rows."
else
  echo "Completed $copy_count copies; skipped $skip_count rows."
fi