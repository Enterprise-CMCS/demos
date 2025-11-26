#!/usr/bin/bash
# filepath: /workspaces/demos/lambdas/deleteinfectedfile/delete-all-infected-files.sh
set -e

export LOCALSTACK_ENDPOINT="http://localstack:4566"
export AWS_REGION="us-east-1"

AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

BUCKET_NAME="infected-bucket"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🗂️  Fetching all objects from $BUCKET_NAME..."
echo ""

# Get all object keys from the bucket
OBJECT_KEYS=$($AWS_CMD s3api list-objects-v2 \
    --bucket $BUCKET_NAME \
    --query 'Contents[].Key' \
    --output text 2>/dev/null || echo "")

# Check if bucket is empty
if [ -z "$OBJECT_KEYS" ]; then
    echo "⚠️  No objects found in $BUCKET_NAME"
    exit 0
fi

# Count total objects
TOTAL_OBJECTS=$(echo "$OBJECT_KEYS" | wc -w)
echo "✅ Found $TOTAL_OBJECTS object(s) in $BUCKET_NAME"
echo ""

CURRENT=0
SUCCESS=0
FAILED=0

# Process each object
for KEY in $OBJECT_KEYS; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL_OBJECTS] Processing: $KEY"
    
    # Run the delete script for this key
    if bash "$SCRIPT_DIR/delete-infected-file.sh" "$KEY" 2>/dev/null; then
        SUCCESS=$((SUCCESS + 1))
        echo "  ✅ Successfully processed"
    else
        FAILED=$((FAILED + 1))
        echo "  ❌ Failed to process"
    fi
    
    echo ""
    
    # Small delay to avoid overwhelming the system
    sleep 1
done

echo "========================================"
echo "📊 Summary:"
echo "   Total:   $TOTAL_OBJECTS"
echo "   Success: $SUCCESS"
echo "   Failed:  $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Some deletions failed"
    exit 1
else
    echo "✅ All files processed successfully!"
fi
