#!/usr/bin/bash
set -e

echo "📦 Setting up S3 Buckets..."

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

BUCKETS=("upload-bucket" "clean-bucket" "deleted-bucket" "infected-bucket")

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

echo "✅ S3 buckets ready with CORS configured"
