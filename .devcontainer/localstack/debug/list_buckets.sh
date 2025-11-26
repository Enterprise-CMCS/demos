#!/usr/bin/bash
# filepath: /workspaces/demos/.devcontainer/list_buckets.sh
set -e

export LOCALSTACK_ENDPOINT="http://localstack:4566"
export AWS_REGION="us-east-1"

AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

echo "📦 Listing S3 Bucket Contents..."
echo ""

BUCKETS=("upload-bucket" "clean-bucket" "infected-bucket" "deleted-bucket")

for bucket in "${BUCKETS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 $bucket"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    OBJECTS=$($AWS_CMD s3 ls s3://$bucket --recursive 2>/dev/null || echo "")
    
    if [ -z "$OBJECTS" ]; then
        echo "❌ Bucket is empty or does not exist"
    else
        echo "$OBJECTS"
        OBJECT_COUNT=$(echo "$OBJECTS" | wc -l)
        echo ""
        echo "Total objects: $OBJECT_COUNT"
    fi
    echo ""
done

echo "💡 To see more details with file sizes:"
echo "   aws --endpoint-url=http://localstack:4566 s3 ls s3://upload-bucket --recursive --human-readable --summarize"