#!/usr/bin/bash
set -e

# Example helper to enqueue a test email for the local emailer lambda.

LOCALSTACK_ENDPOINT="http://localstack:4566"
QUEUE_NAME="emailer-queue"

QUEUE_URL=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT \
  --region us-east-1 \
  sqs get-queue-url \
  --queue-name $QUEUE_NAME \
  --query QueueUrl \
  --output text)

aws --endpoint-url=$LOCALSTACK_ENDPOINT \
  --region us-east-1 \
  sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{
  "to":"log-only@email.com",
  "subject":"LocalStack emailer test",
  "text":"This is a local SQS-triggered emailer test message.",
  "html":"<p>This is a <strong>local</strong> SQS-triggered emailer test message.</p>"
  }'

echo "✅ Sent test message to $QUEUE_NAME"
