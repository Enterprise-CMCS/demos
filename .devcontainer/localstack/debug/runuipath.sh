#!/usr/bin/bash
set -e


# Set the QUUEUE_URL variable
QUEUE_URL=$(aws --endpoint-url=http://localstack:4566 --region us-east-1 sqs get-queue-url --queue-name uipath-queue --query 'QueueUrl' --output text)

# Send SQS message to trigger UiPath processor
aws --endpoint-url=http://localstack:4566 --region us-east-1 sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{"s3Key":"test_uipath.pdf","s3Bucket":"uipath-documents"}'
