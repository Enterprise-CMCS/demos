#!/usr/bin/bash
set -e

echo "🚀 Deploying emailer Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

QUEUE_NAME="emailer-queue"
LAMBDA_NAME="emailer"
ALLOW_LIST_PARAM_NAME="/demos/nonprod/email/allowlist"

# Build Lambda package
cd /workspaces/demos/lambdas/emailer

npm ci --silent
npx tsc --outDir build

npx esbuild build/index.js \
  --bundle \
  --platform=node \
  --format=cjs \
  --target=node24 \
  --sourcemap \
  --outfile=dist/index.js
rm -f lambda.zip
zip -jqr lambda.zip dist/index.js

cd - > /dev/null

# Ensure allow list SSM parameter exists
$AWS_CMD ssm put-parameter \
    --name $ALLOW_LIST_PARAM_NAME \
    --type String \
    --overwrite \
    --value '["email@example.com","unit@test.com"]' \
    > /dev/null

# Delete existing Lambda if exists
$AWS_CMD lambda delete-function --function-name $LAMBDA_NAME 2>/dev/null || true

# Create Lambda function
$AWS_CMD lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs24.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb:///workspaces/demos/lambdas/emailer/lambda.zip \
    --timeout 60 \
    --environment "Variables={
      AWS_REGION=$AWS_REGION,
      AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,
      EMAIL_HOST=mailpit,
      EMAIL_PORT=1025,
      EMAIL_FROM=no-reply@local.demos,
      ALLOW_LIST_PARAM_NAME=$ALLOW_LIST_PARAM_NAME,
            DISABLE_EMAIL_ALLOWLIST=false,
      LOG_LEVEL=info
    }" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for emailer Lambda to be active..."
for i in {1..15}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name $LAMBDA_NAME \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")

    if [ "$STATUS" = "Active" ]; then
        echo "✅ emailer Lambda function created"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ emailer Lambda function failed to initialize in 30 seconds"
        exit 1
    fi
    sleep 2
done

# Get queue ARN
QUEUE_URL=$($AWS_CMD sqs get-queue-url --queue-name $QUEUE_NAME --output text --query 'QueueUrl')
QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $QUEUE_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

echo "📬 Connecting emailer Lambda to emailer SQS queue..."

# Delete existing event source mappings
EXISTING_MAPPINGS=$($AWS_CMD lambda list-event-source-mappings \
    --function-name $LAMBDA_NAME \
    --query 'EventSourceMappings[].UUID' \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_MAPPINGS" ]; then
    for UUID in $EXISTING_MAPPINGS; do
        $AWS_CMD lambda delete-event-source-mapping --uuid $UUID >/dev/null 2>&1 || true
    done
fi

# Create event source mapping (SQS -> Lambda)
$AWS_CMD lambda create-event-source-mapping \
    --function-name $LAMBDA_NAME \
    --event-source-arn $QUEUE_ARN \
    --batch-size 1 \
    --enabled \
    > /dev/null

echo "✅ emailer Lambda connected to emailer SQS queue"
echo "   Queue ARN: $QUEUE_ARN"
