#!/usr/bin/bash
set -e

echo "🚀 Deploying UiPath Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"

AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

QUEUE_NAME="uipath-queue"
LAMBDA_NAME="uipath"

UIPATH_SECRET_ID=${UIPATH_SECRET_ID:-"uipath-credentials"}
UIPATH_PROJECT_ID=${UIPATH_PROJECT_ID:-"00000000-0000-0000-0000-000000000000"} # pragma: allowlist secret

UIPATH_EXTRACTOR_GUID=${UIPATH_EXTRACTOR_GUID:-""}
UIPATH_CLIENT_ID=${UIPATH_CLIENT_ID:-""}
UIPATH_DOCUMENT_BUCKET=${UIPATH_DOCUMENT_BUCKET:-"uipath-documents"}
DATABASE_SECRET_ARN=${DATABASE_SECRET_ARN:-"database-secret"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

# Build Lambda package
cd /workspaces/demos/lambdas/UIPath

npm ci --silent
npx esbuild index.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  --sourcemap \
  --external:@aws-sdk/* \
  --external:pg \
  --external:pino \
  --external:axios \
  --external:form-data \
  --external:axios-oauth-client \
  --external:dotenv \
  --outfile=index.js

zip -qr uipath.zip index.js node_modules/ package.json package-lock.json ak-behavioral-health-demo-pa.pdf

# Clean up build artifacts
rm index.js index.js.map

cd - > /dev/null

# Delete existing Lambda if exists
$AWS_CMD lambda delete-function --function-name $LAMBDA_NAME 2>/dev/null || true

# Create Lambda function
$AWS_CMD lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb:///workspaces/demos/lambdas/UIPath/uipath.zip \
    --timeout 900 \
    --environment "Variables={
        AWS_REGION=$AWS_REGION,
        AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,
        UIPATH_SECRET_ID=$UIPATH_SECRET_ID,
        UIPATH_CLIENT_ID=$UIPATH_CLIENT_ID,
        UIPATH_PROJECT_ID=$UIPATH_PROJECT_ID,
        UIPATH_EXTRACTOR_GUID=$UIPATH_EXTRACTOR_GUID,
        UIPATH_DOCUMENT_BUCKET=$UIPATH_DOCUMENT_BUCKET,
        DATABASE_SECRET_ARN=$DATABASE_SECRET_ARN,
        LOG_LEVEL=$LOG_LEVEL
    }" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for UiPath Lambda to be active..."
for i in {1..15}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name $LAMBDA_NAME \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")

    if [ "$STATUS" = "Active" ]; then
        echo "✅ UiPath Lambda function created"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ UiPath Lambda function failed to initialize in 30 seconds"
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

echo "📬 Connecting UiPath Lambda to UiPath SQS queue..."

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

echo "✅ UiPath Lambda connected to UiPath SQS queue"
echo "   Queue ARN: $QUEUE_ARN"
