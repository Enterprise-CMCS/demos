#!/usr/bin/bash
set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
QUEUE_NAME="emailer-queue"
EMAIL_MODE="${LOCAL_EMAIL_MODE:-mailpit}"

case "$EMAIL_MODE" in
    mailpit)
        EMAIL_RECIPIENT="${LOCAL_EMAIL:-mailpit-test@example.test}"
        ;;
    relay)
        if [[ -z "${LOCAL_EMAIL:-}" ]]; then
            echo "❌ LOCAL_EMAIL must be set when LOCAL_EMAIL_MODE=relay"
            exit 1
        fi

        if [[ ! "$LOCAL_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            echo "❌ LOCAL_EMAIL must be a valid email address"
            exit 1
        fi

        EMAIL_RECIPIENT="$LOCAL_EMAIL"
        ;;
    *)
        echo "❌ Unsupported LOCAL_EMAIL_MODE: $EMAIL_MODE. Expected mailpit or relay."
        exit 1
        ;;
esac

QUEUE_URL=$($AWS_CMD sqs get-queue-url --queue-name $QUEUE_NAME --output text --query 'QueueUrl')

$AWS_CMD sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body '{
      "to": "'"$EMAIL_RECIPIENT"'",
      "subject": "CMS DEMOS: Test Email",
      "text": "This is a test email confirming that the DEMOS email and SQS system is working.\n\nThank you,\nDEMOS Notifications"
    }' >/dev/null

echo "✅ Sent test email message to $QUEUE_NAME"
echo "   Recipient: $EMAIL_RECIPIENT"
if [[ "$EMAIL_MODE" = "mailpit" ]]; then
    echo "   View captured email: http://localhost:8025"
fi
echo "Tail logs with:"
echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION logs tail /aws/lambda/emailer --since 5m --follow"
