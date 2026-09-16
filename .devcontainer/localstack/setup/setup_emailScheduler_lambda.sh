#!/usr/bin/bash
set -e

echo "🚀 Deploying emailScheduler Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
LAMBDA_NAME="emailScheduler"
RULE_NAME="emailScheduler-schedule"
# EventBridge Scheduler is mocked in LocalStack (no real target invocation), so this
# uses a classic EventBridge rate rule instead, which LocalStack actually fires.
# Defaults to the fastest valid rate so local runs can observe a real trigger quickly;
# override with EMAIL_SCHEDULER_RATE for a slower local cadence.
SCHEDULE_EXPRESSION="${EMAIL_SCHEDULER_RATE:-rate(1 minute)}"

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

# Remove the schedule before the function so LocalStack can't retain a target
# that points at an already-deleted Lambda.
$AWS_CMD events remove-targets --rule $RULE_NAME --ids "1" >/dev/null 2>&1 || true
$AWS_CMD events delete-rule --name $RULE_NAME --force 2>/dev/null || true

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

LAMBDA_ARN=$($AWS_CMD lambda get-function \
    --function-name $LAMBDA_NAME \
    --query 'Configuration.FunctionArn' \
    --output text)

echo "⏰ Scheduling emailScheduler Lambda ($SCHEDULE_EXPRESSION)..."

# Create the EventBridge rule that invokes emailScheduler on a schedule
$AWS_CMD events put-rule \
    --name $RULE_NAME \
    --schedule-expression "$SCHEDULE_EXPRESSION" \
    --state ENABLED >/dev/null

# Let the rule invoke the Lambda
$AWS_CMD lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id "$RULE_NAME-invoke" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:$AWS_REGION:000000000000:rule/$RULE_NAME" \
    >/dev/null 2>&1 || true

$AWS_CMD events put-targets \
    --rule $RULE_NAME \
    --targets "[{\"Id\": \"1\", \"Arn\": \"$LAMBDA_ARN\"}]" >/dev/null

echo "✅ emailScheduler Lambda scheduled via EventBridge"
echo "   Rule: $RULE_NAME ($SCHEDULE_EXPRESSION)"
echo "   Sends notifications to: emailer-queue (EMAILER_QUEUE_URL in index.ts)"

cd /workspaces/demos/lambdas/emailScheduler
rm lambda.zip
