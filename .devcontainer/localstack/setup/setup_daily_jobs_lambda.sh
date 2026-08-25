#!/usr/bin/env bash
set -euo pipefail

echo "Deploying daily-jobs Lambda function..."

localstack_endpoint="http://localstack:4566"
aws_region="us-east-1"
aws_cmd=(aws --endpoint-url="$localstack_endpoint" --region "$aws_region")
lambda_name="daily-jobs"

queue_url=$(
  "${aws_cmd[@]}" sqs get-queue-url \
    --queue-name emailer-queue \
    --output text \
    --query QueueUrl
)

cd /workspaces/demos/lambdas/dailyJobs
npm ci --silent
npx tsc --skipLibCheck --outDir build
npx esbuild build/index.js \
  --bundle \
  --platform=node \
  --target=node24 \
  --sourcemap \
  --outfile=dist/index.cjs
rm -f lambda.zip
zip -jqr lambda.zip dist/index.cjs dist/index.cjs.map

"${aws_cmd[@]}" lambda delete-function --function-name "$lambda_name" 2>/dev/null || true

"${aws_cmd[@]}" lambda create-function \
  --function-name "$lambda_name" \
  --runtime nodejs24.x \
  --role arn:aws:iam::000000000000:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb:///workspaces/demos/lambdas/dailyJobs/lambda.zip \
  --timeout 300 \
  --memory-size 1024 \
  --environment "Variables={
    AWS_REGION=$aws_region,
    AWS_ENDPOINT_URL=$localstack_endpoint,
    DATABASE_SECRET_ARN=database-secret,
    DB_SCHEMA=demos_app,
    DB_SSL_MODE=disable,
    EMAILER_QUEUE_URL=$queue_url,
    NODE_OPTIONS=--enable-source-maps
  }" >/dev/null

echo "Waiting for daily-jobs Lambda to be active..."
for attempt in {1..15}; do
  status=$(
    "${aws_cmd[@]}" lambda get-function \
      --function-name "$lambda_name" \
      --query Configuration.State \
      --output text 2>/dev/null || echo "Pending"
  )

  if [[ "$status" == "Active" ]]; then
    echo "daily-jobs Lambda function created"
    break
  fi
  if [[ "$status" == "Failed" ]]; then
    echo "daily-jobs Lambda failed to initialize" >&2
    exit 1
  fi
  if [[ "$attempt" == 15 ]]; then
    echo "Timed out waiting for daily-jobs Lambda" >&2
    exit 1
  fi
  sleep 2
done

rm -f /workspaces/demos/lambdas/dailyJobs/lambda.zip

echo "Invoke the current Eastern date with:"
echo "  /workspaces/demos/scripts/run_daily_jobs.sh --local"
