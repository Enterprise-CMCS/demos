#!/usr/bin/bash
set -e

echo "Make sure you add a legitimate file and pass in a legit key!";
# Example of how to send a SQS message to trigger the UiPath lambda.
# MUST ADD test_uipath.pdf file.
# but you can either run this like a bash script or copy pasta.

# reset this to empty to trigger actual AWS
local QUEUE_URL
LOCALSTACK_ENDPOINT="http://localstack:4566" # pragma: allowlist secret
AWS_ACCESS_KEY_ID="test" # pragma: allowlist secret
AWS_SECRET_ACCESS_KEY="test" # pragma: allowlist secret
AWS_DEFAULT_REGION="us-east-1" # pragma: allowlist secret


QUEUE_URL=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT \
  --region us-east-1 \
  sqs get-queue-url \
  --queue-name uipath-queue \
  --query QueueUrl \
  --output text)

aws --endpoint-url=$LOCALSTACK_ENDPOINT \
  --region us-east-1 \
  sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{
  "s3Key":"42779850-6fd5-4fb9-98dd-f3b9ab8d04ad/050643d5-f9e0-4e0f-b274-881ea09daf23f",
  "s3Bucket":"clean-bucket"
  }' # pragma: allowlist secret


uipath_local() {


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
    --message-body '{"s3FileName": "alaska_doc.pdf","s3Bucket":"uipath-documents"}' # pragma: allowlist secret
}
