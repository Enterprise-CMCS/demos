#!/usr/bin/bash
set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
QUEUE_NAME="emailer-queue"

if [[ -z "${LOCAL_EMAIL:-}" ]]; then
    echo "❌ LOCAL_EMAIL must be set before sending a local email"
    exit 1
fi

if [[ ! "$LOCAL_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo "❌ LOCAL_EMAIL must be a valid email address"
    exit 1
fi

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
        "recipients": {
          "to": ["'"$LOCAL_EMAIL"'"]
        },
        "demonstration": {
          "id": "local-demonstration-1",
          "name": "LocalStack Demonstration",
          "stateId": "MD"
        },
        "deliverable": {
          "id": "local-deliverable-1",
          "name": "LocalStack Deliverable",
          "deliverableTypeId": "Close Out Report",
          "dueDate": "2026-07-10T12:00:00.000Z",
          "statusId": "Upcoming"
        }
      }
    }' >/dev/null

echo "✅ Sent deliverable-created realtime email message to $QUEUE_NAME"
echo "Tail logs with:"
echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION logs tail /aws/lambda/emailer --since 5m --follow"
