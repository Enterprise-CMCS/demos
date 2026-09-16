#!/usr/bin/bash
set -e

echo "🚀 Deploying emailScheduler Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
LAMBDA_NAME="emailScheduler"

# Build Lambda package
cd /workspaces/demos/lambdas/emailScheduler

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

cd - > /dev/null

# Delete existing Lambda if exists
$AWS_CMD lambda delete-function --function-name $LAMBDA_NAME 2>/dev/null || true

# Create Lambda function
$AWS_CMD lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs24.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb:///workspaces/demos/lambdas/emailScheduler/lambda.zip \
    --timeout 60 \
    --memory-size 1024 \
    --environment "Variables={
        AWS_REGION=$AWS_REGION,
        AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,
        DATABASE_SECRET_ARN=database-secret,
        DB_SCHEMA=demos_app,
        DB_SSL_MODE=disable,
        NODE_OPTIONS=--enable-source-maps
    }" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for emailScheduler Lambda to be active..."
for i in {1..15}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name $LAMBDA_NAME \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")

    if [ "$STATUS" = "Active" ]; then
        echo "✅ emailScheduler Lambda function created"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ emailScheduler Lambda function failed to initialize in 30 seconds"
        exit 1
    fi
    sleep 2
done

echo "✅ emailScheduler Lambda function deployed"
echo "   Invoke it manually with debug/run-emailscheduler.sh (simulates an EventBridge event)"
echo "   Sends notifications to: emailer-queue (EMAILER_QUEUE_URL in index.ts)"

cd /workspaces/demos/lambdas/emailScheduler
rm lambda.zip
