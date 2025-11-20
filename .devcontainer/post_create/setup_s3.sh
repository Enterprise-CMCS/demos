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

# Helper function to create S3 bucket and configure CORS
create_bucket_with_cors() {
    local bucket=$1
    
    if $AWS_CMD s3 ls s3://$bucket 2>/dev/null; then
        echo "⚠️  $bucket already exists"
    else
        $AWS_CMD s3 mb s3://$bucket 2>/dev/null && echo "✅ Created $bucket"
    fi
    
    $AWS_CMD s3api put-bucket-cors \
        --bucket $bucket \
        --cors-configuration "$CORS_CONFIG" \
        && echo "✅ Configured CORS for $bucket"
}

# Create buckets with CORS
create_bucket_with_cors "upload-bucket"
create_bucket_with_cors "clean-bucket"
create_bucket_with_cors "deleted-bucket"

echo "✅ S3 buckets ready with CORS configured"
