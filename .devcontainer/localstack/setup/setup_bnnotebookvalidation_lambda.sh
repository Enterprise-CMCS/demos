#!/usr/bin/bash
set -e

echo "🚀 Setting up BN Notebook Validation queue and Lambda..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

LAMBDA_NAME="bnnotebookvalidation"
QUEUE_NAME="bn-notebook-validation-queue"
DLQ_NAME="bn-notebook-validation-dlq"
GRAPHQL_ENDPOINT=${GRAPHQL_ENDPOINT:-"http://app:3000/api/graphql"}
GRAPHQL_AUTH_TOKEN=${GRAPHQL_AUTH_TOKEN:-""}

DATABASE_SECRET_ARN=${DATABASE_SECRET_ARN:-"database-secret"}
DB_SCHEMA=${DB_SCHEMA:-"demos_app"}
BYPASS_SSL=${BYPASS_SSL:-"true"}
UPLOAD_BUCKET=${UPLOAD_BUCKET:-"upload-bucket"}
CLEAN_BUCKET=${CLEAN_BUCKET:-"clean-bucket"}
INFECTED_BUCKET=${INFECTED_BUCKET:-"infected-bucket"}

BN_LAMBDA_ENV=$(cat <<EOF
{
  "Variables": {
    "AWS_REGION": "$AWS_REGION",
    "AWS_ENDPOINT_URL": "$LOCALSTACK_ENDPOINT",
    "GRAPHQL_ENDPOINT": "$GRAPHQL_ENDPOINT",
    "GRAPHQL_AUTH_TOKEN": "$GRAPHQL_AUTH_TOKEN"
  }
}
EOF
)

delete_queue_if_exists() {
  local queue_name="$1"
  local queue_url
  queue_url=$($AWS_CMD sqs get-queue-url --queue-name "$queue_name" --output text --query 'QueueUrl' 2>/dev/null || true)
  if [ -n "$queue_url" ]; then
    $AWS_CMD sqs delete-queue --queue-url "$queue_url" >/dev/null
    sleep 1
  fi
}

echo "📬 Creating BN notebook validation queue..."
delete_queue_if_exists "$QUEUE_NAME"
delete_queue_if_exists "$DLQ_NAME"

DLQ_URL=$($AWS_CMD sqs create-queue \
  --queue-name "$DLQ_NAME" \
  --attributes '{"MessageRetentionPeriod":"1209600"}' \
  --output text --query 'QueueUrl')

DLQ_ARN=$($AWS_CMD sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --output text --query 'Attributes.QueueArn')

REDRIVE_POLICY="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"5\"}"

QUEUE_URL=$($AWS_CMD sqs create-queue \
  --queue-name "$QUEUE_NAME" \
  --attributes "{\"RedrivePolicy\":\"$(echo "$REDRIVE_POLICY" | sed 's/"/\\"/g')\",\"MessageRetentionPeriod\":\"1209600\"}" \
  --output text --query 'QueueUrl')

QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-names QueueArn \
  --output text --query "Attributes.QueueArn")

echo "✅ BN notebook validation queue created"
echo "   Queue ARN: $QUEUE_ARN"
echo "   DLQ ARN: $DLQ_ARN"

echo "📦 Building BN notebook validation Lambda package..."
cd /workspaces/demos/lambdas/fileprocess
npm ci --silent

cd /workspaces/demos/lambdas/bnnotebookvalidation
/workspaces/demos/lambdas/fileprocess/node_modules/.bin/esbuild index.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  --sourcemap \
  --outfile=index.js

zip -qr bnnotebookvalidation.zip index.js
rm -f index.js index.js.map
cd - > /dev/null

$AWS_CMD lambda delete-function --function-name "$LAMBDA_NAME" 2>/dev/null || true

$AWS_CMD lambda create-function \
  --function-name "$LAMBDA_NAME" \
  --runtime nodejs18.x \
  --role arn:aws:iam::000000000000:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb:///workspaces/demos/lambdas/bnnotebookvalidation/bnnotebookvalidation.zip \
  --timeout 30 \
  --environment "$BN_LAMBDA_ENV" >/dev/null

echo "⏳ Waiting for BN notebook validation Lambda to be active..."
for i in {1..15}; do
  STATUS=$($AWS_CMD lambda get-function \
    --function-name "$LAMBDA_NAME" \
    --query 'Configuration.State' \
    --output text 2>/dev/null || echo "Pending")

  if [ "$STATUS" = "Active" ]; then
    echo "✅ BN notebook validation Lambda function created"
    break
  elif [ "$STATUS" = "Failed" ]; then
    echo "❌ BN notebook validation Lambda failed to initialize in 30 seconds"
    exit 1
  fi
  sleep 2
done

EXISTING_MAPPINGS=$($AWS_CMD lambda list-event-source-mappings \
  --function-name "$LAMBDA_NAME" \
  --query 'EventSourceMappings[].UUID' \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_MAPPINGS" ]; then
  for UUID in $EXISTING_MAPPINGS; do
    $AWS_CMD lambda delete-event-source-mapping --uuid "$UUID" >/dev/null 2>&1 || true
  done
fi

$AWS_CMD lambda create-event-source-mapping \
  --function-name "$LAMBDA_NAME" \
  --event-source-arn "$QUEUE_ARN" \
  --batch-size 1 \
  --enabled \
  > /dev/null

echo "✅ Connected BN notebook validation Lambda to queue"

echo "🔧 Updating fileprocess Lambda env for BN flow..."
FILEPROCESS_ENV=$(cat <<EOF
{
  "Variables": {
    "AWS_REGION": "$AWS_REGION",
    "AWS_ENDPOINT_URL": "$LOCALSTACK_ENDPOINT",
    "DATABASE_SECRET_ARN": "$DATABASE_SECRET_ARN",
    "DB_SCHEMA": "$DB_SCHEMA",
    "BYPASS_SSL": "$BYPASS_SSL",
    "UPLOAD_BUCKET": "$UPLOAD_BUCKET",
    "CLEAN_BUCKET": "$CLEAN_BUCKET",
    "INFECTED_BUCKET": "$INFECTED_BUCKET",
    "BN_NOTEBOOK_VALIDATION_QUEUE_URL": "$QUEUE_URL",
    "GRAPHQL_ENDPOINT": "$GRAPHQL_ENDPOINT",
    "GRAPHQL_AUTH_TOKEN": "$GRAPHQL_AUTH_TOKEN"
  }
}
EOF
)

$AWS_CMD lambda update-function-configuration \
  --function-name fileprocess \
  --environment "$FILEPROCESS_ENV" >/dev/null

echo "✅ FileProcess Lambda updated with BN queue + GraphQL endpoint"
echo "   BN queue URL: $QUEUE_URL"
echo "   GraphQL endpoint: $GRAPHQL_ENDPOINT"
