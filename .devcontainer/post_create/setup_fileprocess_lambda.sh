#!/usr/bin/bash
set -e

echo "🚀 Deploying Lambda function..."

AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

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
  --outfile=index.js

# Include the CA cert in the zip
zip -qr fileprocess.zip index.js node_modules/ package.json package-lock.json ca-cert.pem

# Return to original directory
cd - > /dev/null

# Delete existing Lambda
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
        UPLOAD_BUCKET=upload-bucket,
        CLEAN_BUCKET=clean-bucket,
        DB_SCHEMA=demos_app,
        BYPASS_SSL=true
    }" >/dev/null

# Wait for Lambda to be active
echo "⏳ Waiting for Lambda to be active..."
for i in {1..30}; do
    STATUS=$($AWS_CMD lambda get-function \
        --function-name fileprocess \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")
    
    if [ "$STATUS" = "Active" ]; then
        echo "✅ Lambda function deployed successfully"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ Lambda function failed to initialize"
        exit 1
    fi
    sleep 2
done
