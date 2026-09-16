#!/usr/bin/bash
set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"
LAMBDA_NAME="emailScheduler"

# Mirrors the event shape EventBridge sends when the emailScheduler-schedule rule fires.
$AWS_CMD lambda invoke \
    --function-name "$LAMBDA_NAME" \
    --payload '{
      "version": "0",
      "detail-type": "Scheduled Event",
      "source": "aws.events",
      "account": "000000000000",
      "region": "'"$AWS_REGION"'",
      "resources": ["arn:aws:events:'"$AWS_REGION"':000000000000:rule/emailScheduler-schedule"],
      "detail": {}
    }' \
    --cli-binary-format raw-in-base64-out \
    /dev/stdout
