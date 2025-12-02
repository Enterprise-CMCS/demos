#!/usr/bin/bash
# filepath: /workspaces/demos/.devcontainer/localstack/debug/delete-infected-file.sh
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <object-key>"
    echo "Example: $0 user-id/file-id"
    exit 1
fi

OBJECT_KEY=$1

export LOCALSTACK_ENDPOINT="http://localstack:4566"
export AWS_REGION="us-east-1"

AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

echo "🗑️  Simulating lifecycle expiration for: $OBJECT_KEY"
echo ""

# Get queue URL
QUEUE_URL=$($AWS_CMD sqs get-queue-url --queue-name infected-file-expiration-queue --output text --query 'QueueUrl')

# Delete the object from S3 (creates delete marker due to versioning)
echo "1️⃣ Deleting object from S3 (creates delete marker)..."
$AWS_CMD s3api delete-object \
    --bucket infected-bucket \
    --key "$OBJECT_KEY"

# Create S3 notification event for delete marker creation (versioned bucket)
# This is what S3 sends directly to SQS in production
S3_EVENT=$(cat <<EOF
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
      "eventName": "LifecycleExpiration:DeleteMarkerCreated",
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "lifecycle-expiration-delete-marker",
        "bucket": {
          "name": "infected-bucket",
          "arn": "arn:aws:s3:::infected-bucket"
        },
        "object": {
          "key": "$OBJECT_KEY"
        }
      }
    }
  ]
}
EOF
)

echo "2️⃣ Sending S3 lifecycle delete marker created event to SQS..."
$AWS_CMD sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body "$S3_EVENT" >/dev/null

echo ""
echo "✅ Lifecycle expiration delete marker simulated!"
echo ""
echo "📬 Your Lambda will receive an SQS event with body:"
echo "$S3_EVENT" | jq .
echo ""
echo "🔍 Check Lambda logs:"
echo "   aws --endpoint-url=http://localstack:4566 logs tail /aws/lambda/deleteinfectedfile --since 1m --follow"
