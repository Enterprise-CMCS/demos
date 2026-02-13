#!/usr/bin/bash
set -e

echo "🚀 Deploying FileProcess Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

QUEUE_NAME="fileprocess-queue"

# Build Lambda package
cd /workspaces/demos/lambdas/fileprocess

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
  --external:file-type \
  --outfile=index.js

zip -qr fileprocess.zip index.js node_modules/ package.json package-lock.json

# Clean up build artifacts
rm index.js index.js.map

cd - > /dev/null

# Delete existing Lambda if exists
$AWS_CMD lambda delete-function --function-name fileprocess 2>/dev/null || true

# Create Lambda function
$AWS_CMD lambda create-function \
    --function-name fileprocess \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb:///workspaces/demos/lambdas/fileprocess/fileprocess.zip \
    --timeout 30 \
    --environment "Variables={
        AWS_REGION=$AWS_REGION,
        AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,
        DATABASE_SECRET_ARN=database-secret,
        DB_SCHEMA=demos_app,
        BYPASS_SSL=true,
        UPLOAD_BUCKET=upload-bucket,
        CLEAN_BUCKET=clean-bucket,
        INFECTED_BUCKET=infected-bucket
    }" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for FileProcess Lambda to be active..."
for i in {1..15}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name fileprocess \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")
    
    if [ "$STATUS" = "Active" ]; then
        echo "✅ FileProcess Lambda function created"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ FileProcess Lambda function failed to initialize in 30 seconds"
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

echo "📬 Connecting FileProcess Lambda to FileProcess SQS queue..."

# Delete existing event source mappings
EXISTING_MAPPINGS=$($AWS_CMD lambda list-event-source-mappings \
    --function-name fileprocess \
    --query 'EventSourceMappings[].UUID' \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_MAPPINGS" ]; then
    for UUID in $EXISTING_MAPPINGS; do
        $AWS_CMD lambda delete-event-source-mapping --uuid $UUID >/dev/null 2>&1 || true
    done
fi

# Create event source mapping (SQS -> Lambda)
$AWS_CMD lambda create-event-source-mapping \
    --function-name fileprocess \
    --event-source-arn $QUEUE_ARN \
    --batch-size 1 \
    --enabled \
    > /dev/null

echo "✅ FileProcess Lambda connected to Fileprocess SQS queue"
echo "   Queue ARN: $QUEUE_ARN"
echo ""
echo "Flow: S3 upload → EventBridge (emulating GuardDuty) → SQS (with 5s delay) → Lambda"
