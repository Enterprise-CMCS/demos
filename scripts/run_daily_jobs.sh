#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  $0 --stage <stage>"
  echo "  $0 --local"
}

if [[ $# -eq 1 && "$1" == "--local" ]]; then
  function_name="daily-jobs"
  aws_args=(
    aws
    --endpoint-url="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
    --region="${AWS_REGION:-us-east-1}"
  )
elif [[ $# -eq 2 && "$1" == "--stage" ]]; then
  stage="$2"
  if [[ ! "$stage" =~ ^[A-Za-z0-9-]+$ ]]; then
    echo "Invalid stage: $stage" >&2
    exit 1
  fi
  function_name="demos-${stage}-daily-jobs"
  aws_args=(aws)
else
  usage >&2
  exit 1
fi

scheduled_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
payload=$(printf '{"source":"manual","scheduledAt":"%s"}' "$scheduled_at")
response_file=$(mktemp)
trap 'rm -f "$response_file"' EXIT

echo "Invoking $function_name for the current Eastern date..."
function_error=$(
  "${aws_args[@]}" lambda invoke \
    --function-name "$function_name" \
    --invocation-type RequestResponse \
    --cli-binary-format raw-in-base64-out \
    --payload "$payload" \
    --query FunctionError \
    --output text \
    "$response_file"
)

sed -n '1,200p' "$response_file"
echo

if [[ "$function_error" != "None" && "$function_error" != "null" ]]; then
  echo "Daily Jobs invocation failed: $function_error" >&2
  exit 1
fi
