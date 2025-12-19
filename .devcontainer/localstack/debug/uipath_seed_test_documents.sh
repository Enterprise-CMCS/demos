#!/usr/bin/bash
set -e

# Seed UIPATH S3 bucket with a couple files.
BUCKET_NAME="uipath-documents"
LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

# Set file path here
FILE="../../../lambdas/UIPath/ak-behavioral-health-demo-pa.pdf"
FILE2="./test_uipath.pdf"

echo "📤 Uploading $FILE2 → $BUCKET_NAME"
$AWS_CMD s3 cp "$FILE2" "s3://$BUCKET_NAME/test_uipath.pdf"

echo "📤 Uploading $FILE → $BUCKET_NAME"

$AWS_CMD s3 cp "$FILE" "s3://$BUCKET_NAME/ak-behavioral-health-demo-pa.pdf"

echo "✅ Upload complete!"
