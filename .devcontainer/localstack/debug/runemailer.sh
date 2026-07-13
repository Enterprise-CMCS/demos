#!/usr/bin/bash
set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
QUEUE_NAME="emailer-queue"

QUEUE_URL=$($AWS_CMD sqs get-queue-url --queue-name $QUEUE_NAME --output text --query 'QueueUrl')

$AWS_CMD sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body '{
      "emailType": "Deliverable Created",
      "entityType": "deliverable",
      "entityId": "local-deliverable-1",
      "triggeredBy": {
        "type": "realtime",
        "id": "localstack-debug"
      },
      "triggeredAt": "2026-07-10T00:00:00.000Z",
      "idempotencyKey": "Deliverable Created:deliverable:local-deliverable-1",
      "payload": {
        "to": "not-allowed@example.com",
        "id": "local-deliverable-1",
        "name": "LocalStack Deliverable",
        "deliverableType": "Close Out Report",
        "dueDate": "2026-07-10T12:00:00.000Z",
        "status": "Upcoming"
      }
    }' >/dev/null

echo "✅ Sent deliverable-created realtime email message to $QUEUE_NAME"
echo "Tail logs with:"
echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION logs tail /aws/lambda/emailer --since 5m --follow"
