#!/usr/bin/bash
set -e

echo "🚀 Deploying emailer Lambda function..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
QUEUE_NAME="emailer-queue"
LAMBDA_NAME="emailer"
POINT_AND_CLICK_AGREEMENT_KEY="references/agreements/point-click-agreement.pdf"
ALLOW_LIST_PARAM_NAME="/demos/nonprod/email/allowlist"
EMAIL_MODE="${LOCAL_EMAIL_MODE:-mailpit}"

case "$EMAIL_MODE" in
    mailpit)
        EMAIL_HOST="mailpit"
        EMAIL_PORT="1025"
        EMAIL_FROM="${LOCAL_EMAIL_FROM:-demos-local-no-reply@example.test}"
        DISABLE_EMAIL_ALLOWLIST="true"
        ALLOW_LIST_VALUE="[]"
        RECIPIENT_SUMMARY="all recipients captured by Mailpit"
        ;;
    relay)
        EMAIL_HOST="${LOCAL_EMAIL_HOST:-smtp.cloud.internal.cms.gov}"
        EMAIL_PORT="${LOCAL_EMAIL_PORT:-587}"
        EMAIL_FROM="${LOCAL_EMAIL_FROM:-DEMOS-local-no-reply@cms.hhs.gov}"
        DISABLE_EMAIL_ALLOWLIST="false"

        if [[ -z "${LOCAL_EMAIL:-}" ]]; then
            echo "❌ LOCAL_EMAIL must be set when LOCAL_EMAIL_MODE=relay"
            exit 1
        fi

        if [[ ! "$LOCAL_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            echo "❌ LOCAL_EMAIL must be a valid email address"
            exit 1
        fi

        ALLOW_LIST_VALUE="[\"$LOCAL_EMAIL\"]"
        RECIPIENT_SUMMARY="$LOCAL_EMAIL"
        ;;
    *)
        echo "❌ Unsupported LOCAL_EMAIL_MODE: $EMAIL_MODE. Expected mailpit or relay."
        exit 1
        ;;
esac

# Build Lambda package
cd /workspaces/demos/lambdas/emailer

npm ci --silent
npx tsc --skipLibCheck --outDir build

npx esbuild build/index.js \
  --bundle \
  --platform=node \
  --target=node24 \
  --sourcemap \
  --outfile=dist/index.cjs
rm -f lambda.zip
zip -jqr lambda.zip dist/index.cjs dist/index.cjs.map ../../deployment/cert.pem

cd - > /dev/null

$AWS_CMD s3api put-object \
    --bucket clean-bucket \
    --key "$POINT_AND_CLICK_AGREEMENT_KEY" \
    --body /workspaces/demos/lambdas/emailer/point-click-agreement.pdf \
    --content-type application/pdf >/dev/null

# Mailpit captures every local recipient. Relay mode restricts delivery to LOCAL_EMAIL.
$AWS_CMD ssm put-parameter \
    --name "$ALLOW_LIST_PARAM_NAME" \
    --type String \
    --value "$ALLOW_LIST_VALUE" \
    --overwrite >/dev/null

# Resolve the queue before replacing its Lambda mapping.
QUEUE_URL=$($AWS_CMD sqs get-queue-url --queue-name "$QUEUE_NAME" --output text --query 'QueueUrl')
QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url "$QUEUE_URL" \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

# Delete the mapping before the function. LocalStack can retain a mapping briefly
# after its function is deleted, which prevents the replacement mapping.
EXISTING_MAPPINGS=$($AWS_CMD lambda list-event-source-mappings \
    --event-source-arn "$QUEUE_ARN" \
    --query 'EventSourceMappings[].UUID' \
    --output text)

for UUID in $EXISTING_MAPPINGS; do
    $AWS_CMD lambda delete-event-source-mapping --uuid "$UUID" >/dev/null
    for i in {1..15}; do
        if ! $AWS_CMD lambda get-event-source-mapping --uuid "$UUID" >/dev/null 2>&1; then
            break
        fi
        if [ "$i" = 15 ]; then
            echo "❌ Timed out deleting emailer event source mapping $UUID"
            exit 1
        fi
        sleep 1
    done
done

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
    --memory-size 1024 \
    --environment "Variables={
        AWS_REGION=$AWS_REGION,
        AWS_ENDPOINT_URL=$LOCALSTACK_ENDPOINT,
        DATABASE_SECRET_ARN=database-secret,
        DB_SCHEMA=demos_app,
        DB_SSL_MODE=disable,
        CLEAN_BUCKET=clean-bucket,
        ALLOW_LIST_PARAM_NAME=$ALLOW_LIST_PARAM_NAME,
        DISABLE_EMAIL_ALLOWLIST=$DISABLE_EMAIL_ALLOWLIST,
        EMAIL_FROM=$EMAIL_FROM,
        EMAIL_HOST=$EMAIL_HOST,
        EMAIL_PORT=$EMAIL_PORT,
        NODE_EXTRA_CA_CERTS=/var/task/cert.pem,
        NODE_OPTIONS=--enable-source-maps
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

echo "📬 Connecting emailer Lambda to emailer SQS queue..."

# Create event source mapping (SQS -> Lambda)
$AWS_CMD lambda create-event-source-mapping \
    --function-name $LAMBDA_NAME \
    --event-source-arn $QUEUE_ARN \
    --batch-size 1 \
    --enabled \
    > /dev/null

echo "✅ emailer Lambda connected to emailer SQS queue"
echo "   Queue ARN: $QUEUE_ARN"
echo "   Email mode: $EMAIL_MODE"
echo "   SMTP server: $EMAIL_HOST:$EMAIL_PORT"
echo "   Recipients: $RECIPIENT_SUMMARY"

cd /workspaces/demos/lambdas/emailer
rm lambda.zip
