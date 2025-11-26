#!/usr/bin/bash
set -e

echo "📬 Setting up SQS Queues..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

# ============================================================================
# FileProcess Queue (for S3 upload events transformed to GuardDuty format)
# ============================================================================
echo "Creating FileProcess queue with 5 second delay..."

FILEPROCESS_DLQ_URL=$($AWS_CMD sqs create-queue \
    --queue-name fileprocess-dlq \
    --attributes '{"MessageRetentionPeriod":"1209600"}' \
    --output text --query 'QueueUrl')

FILEPROCESS_DLQ_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $FILEPROCESS_DLQ_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

FILEPROCESS_REDRIVE_POLICY="{\"deadLetterTargetArn\":\"$FILEPROCESS_DLQ_ARN\",\"maxReceiveCount\":\"5\"}"

# 5 second delay simulates GuardDuty scan time
FILEPROCESS_QUEUE_URL=$($AWS_CMD sqs create-queue \
    --queue-name fileprocess-queue \
    --attributes "{\"RedrivePolicy\":\"$(echo $FILEPROCESS_REDRIVE_POLICY | sed 's/"/\\"/g')\",\"MessageRetentionPeriod\":\"1209600\",\"DelaySeconds\":\"5\"}" \
    --output text --query 'QueueUrl')

FILEPROCESS_QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $FILEPROCESS_QUEUE_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

# Allow EventBridge to send messages to this queue
FILEPROCESS_QUEUE_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "SQS:SendMessage",
      "Resource": "$FILEPROCESS_QUEUE_ARN"
    }
  ]
}
EOF
)

$AWS_CMD sqs set-queue-attributes \
    --queue-url $FILEPROCESS_QUEUE_URL \
    --attributes "{\"Policy\":\"$(echo $FILEPROCESS_QUEUE_POLICY | sed 's/"/\\"/g')\"}"

echo "✅ FileProcess queue created (5 second delay)"
echo "   Queue ARN: $FILEPROCESS_QUEUE_ARN"
echo "   DLQ ARN: $FILEPROCESS_DLQ_ARN"

# ============================================================================
# Infected File Expiration Queue (for manual S3 lifecycle simulation)
# ============================================================================
echo "Creating Infected File Expiration queue..."

INFECTED_DLQ_URL=$($AWS_CMD sqs create-queue \
    --queue-name infected-file-expiration-dlq \
    --attributes '{"MessageRetentionPeriod":"1209600"}' \
    --output text --query 'QueueUrl')

INFECTED_DLQ_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $INFECTED_DLQ_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

INFECTED_REDRIVE_POLICY="{\"deadLetterTargetArn\":\"$INFECTED_DLQ_ARN\",\"maxReceiveCount\":\"5\"}"

INFECTED_QUEUE_URL=$($AWS_CMD sqs create-queue \
    --queue-name infected-file-expiration-queue \
    --attributes "{\"RedrivePolicy\":\"$(echo $INFECTED_REDRIVE_POLICY | sed 's/"/\\"/g')\",\"MessageRetentionPeriod\":\"1209600\"}" \
    --output text --query 'QueueUrl')

INFECTED_QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $INFECTED_QUEUE_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

# Note: No queue policy needed since we manually send messages via CLI/scripts
# In production, S3 sends directly and needs appropriate permissions

echo "✅ Infected File Expiration queue created"
echo "   Queue ARN: $INFECTED_QUEUE_ARN"
echo "   DLQ ARN: $INFECTED_DLQ_ARN"
echo "   Note: Messages sent manually via delete-infected-file.sh script"

echo ""
echo "✅ All SQS queues setup complete"