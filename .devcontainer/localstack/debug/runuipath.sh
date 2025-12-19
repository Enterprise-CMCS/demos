#!/usr/bin/bash
set -e

# Example of how to send a SQS message to trigger the UiPath lambda.
# MUST ADD test_uipath.pdf file.
# but you can either run this like a bash script or copy pasta.

local QUEUE_URL
  QUEUE_URL=$(aws --endpoint-url=http://localstack:4566 \
    --region us-east-1 \
    sqs get-queue-url \
    --queue-name uipath-queue \
    --query QueueUrl \
    --output text)

  aws --endpoint-url=http://localstack:4566 \
    --region us-east-1 \
    sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body '{"s3Key":"test_uipath.pdf","s3Bucket":"uipath-documents"}'
