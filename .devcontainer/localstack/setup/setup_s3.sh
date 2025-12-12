#!/usr/bin/bash
set -e

####################################
# CONFIGURATION
####################################

SCAN_RESULT_STATUS="NO_THREATS_FOUND"
# SCAN_RESULT_STATUS="THREATS_FOUND"

####################################

echo "📦 Setting up S3 Buckets..."
echo "🔬 Scan result mode: $SCAN_RESULT_STATUS"

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

BUCKETS=("upload-bucket" "clean-bucket" "deleted-bucket" "infected-bucket" "uipath-documents")

# Delete all existing buckets first
echo "🗑️  Removing existing buckets..."
for bucket in "${BUCKETS[@]}"; do
    if $AWS_CMD s3 ls s3://$bucket 2>/dev/null; then
        echo "  Deleting $bucket..."
        $AWS_CMD s3 rm s3://$bucket --recursive 2>/dev/null || true
        $AWS_CMD s3 rb s3://$bucket --force 2>/dev/null && echo "  ✅ Deleted $bucket"
    fi
done

# Helper function to create S3 bucket and configure CORS
create_bucket_with_cors() {
    local bucket=$1
    $AWS_CMD s3 mb s3://$bucket 2>/dev/null && echo "✅ Created $bucket"
    $AWS_CMD s3api put-bucket-cors \
        --bucket $bucket \
        --cors-configuration "$CORS_CONFIG" \
        && echo "✅ Configured CORS for $bucket"
}

# Create buckets with CORS
echo "📦 Creating fresh buckets..."
for bucket in "${BUCKETS[@]}"; do
    create_bucket_with_cors "$bucket"
done



# Enable versioning on clean-bucket, infected-bucket, and deleted-bucket
echo "🔄 Enabling versioning on clean-bucket, infected-bucket, and deleted-bucket..."

$AWS_CMD s3api put-bucket-versioning \
    --bucket clean-bucket \
    --versioning-configuration Status=Enabled

$AWS_CMD s3api put-bucket-versioning \
    --bucket deleted-bucket \
    --versioning-configuration Status=Enabled

$AWS_CMD s3api put-bucket-versioning \
    --bucket infected-bucket \
    --versioning-configuration Status=Enabled
echo "✅ Versioning enabled on clean-bucket, infected-bucket, and deleted-bucket."



####################################
# Configure EventBridge for upload-bucket
####################################
echo "📬 Setting up EventBridge for upload-bucket..."

# Enable EventBridge notifications on upload-bucket
$AWS_CMD s3api put-bucket-notification-configuration \
    --bucket upload-bucket \
    --notification-configuration '{
      "EventBridgeConfiguration": {}
    }'

echo "✅ EventBridge enabled on upload-bucket"

# Delete existing rules if they exist
$AWS_CMD events delete-rule --name s3-upload-to-guardduty --force 2>/dev/null || true

# Create EventBridge rule to capture S3 upload events
$AWS_CMD events put-rule \
    --name s3-upload-to-guardduty \
    --event-pattern '{
      "source": ["aws.s3"],
      "detail-type": ["Object Created"],
      "detail": {
        "bucket": {
          "name": ["upload-bucket"]
        }
      }
    }' >/dev/null

echo "✅ EventBridge rule created for uploads"



####################################
# Get Queue ARN for FileProcess Lambda
####################################

# Queue for fileprocess Lambda (handles uploads/scans)
FILEPROCESS_QUEUE_URL=$($AWS_CMD sqs get-queue-url \
    --queue-name fileprocess-queue \
    --output text --query 'QueueUrl')

FILEPROCESS_QUEUE_ARN=$($AWS_CMD sqs get-queue-attributes \
    --queue-url $FILEPROCESS_QUEUE_URL \
    --attribute-names QueueArn \
    --output text --query 'Attributes.QueueArn')

echo "📬 fileprocess-queue ARN: $FILEPROCESS_QUEUE_ARN"

# Build the GuardDuty scan result based on SCAN_RESULT_STATUS
if [ "$SCAN_RESULT_STATUS" = "THREATS_FOUND" ]; then
    GUARDDUTY_TEMPLATE="{\\\"detail-type\\\":\\\"GuardDuty Malware Protection Object Scan Result\\\",\\\"detail\\\":{\\\"scanStatus\\\":\\\"COMPLETED\\\",\\\"s3ObjectDetails\\\":{\\\"bucketName\\\":\\\"<bucket>\\\",\\\"objectKey\\\":\\\"<key>\\\"},\\\"scanResultDetails\\\":{\\\"scanResultStatus\\\":\\\"THREATS_FOUND\\\",\\\"threats\\\":[{\\\"name\\\":\\\"Test.Malware.EICAR\\\",\\\"severity\\\":\\\"HIGH\\\"},{\\\"name\\\":\\\"Test.Trojan.Generic\\\",\\\"severity\\\":\\\"MEDIUM\\\"}]}}}"
else
    GUARDDUTY_TEMPLATE="{\\\"detail-type\\\":\\\"GuardDuty Malware Protection Object Scan Result\\\",\\\"detail\\\":{\\\"scanStatus\\\":\\\"COMPLETED\\\",\\\"s3ObjectDetails\\\":{\\\"bucketName\\\":\\\"<bucket>\\\",\\\"objectKey\\\":\\\"<key>\\\"},\\\"scanResultDetails\\\":{\\\"scanResultStatus\\\":\\\"NO_THREATS_FOUND\\\"}}}"
fi

# Add SQS target with input transformation (transforms S3 event to GuardDuty format)
$AWS_CMD events put-targets \
    --rule s3-upload-to-guardduty \
    --targets "[
      {
        \"Id\": \"1\",
        \"Arn\": \"$FILEPROCESS_QUEUE_ARN\",
        \"InputTransformer\": {
          \"InputPathsMap\": {
            \"bucket\": \"$.detail.bucket.name\",
            \"key\": \"$.detail.object.key\"
          },
          \"InputTemplate\": \"$GUARDDUTY_TEMPLATE\"
        }
      }
    ]" >/dev/null

echo "✅ EventBridge target configured (S3 upload → EventBridge to emulate GuardDuty result → fileprocess-queue)"

####################################
# Configure S3 notification for infected-bucket
####################################
echo "⚠️  Note: LocalStack doesn't support lifecycle expiration notifications"
echo "   Use the delete-infected-file.sh script to manually trigger expiration events"
echo ""
echo "✅ S3 buckets ready:"
echo "   - upload-bucket: EventBridge → transforms to GuardDuty ($SCAN_RESULT_STATUS) → fileprocess-queue → fileprocess Lambda"
echo "   - infected-bucket: Manual expiration simulation → infected-file-expiration-queue → deleteinfectedfile Lambda"
echo "   - clean-bucket: Storage for clean files"
echo "   - deleted-bucket: Storage for deleted files"
echo "   - uipath-documents: Storage for UiPath document understanding flows"
echo ""
echo "💡 To simulate lifecycle expiration in LocalStack:"
echo "   .devcontainer/localstack/debug/delete-infected-file.sh <object-key>"
