#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCALSTACK_ENDPOINT="http://localstack:4566"
REGION="us-east-1"

# Function to generate UUID using available tools
generate_uuid() {
    if [ -f /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        # Fallback: create a pseudo-UUID using date and random
        echo "$(date +%s%N | cut -c1-8)-$(date +%s%N | cut -c9-12)-4$(date +%s%N | cut -c13-15)-$(printf '%x' $((0x8000 | RANDOM % 0x4000)))-$(date +%s%N | cut -c16-27)"
    fi
}

# Function to show usage
usage() {
    echo -e "${YELLOW}Usage: $0 <file_url> <file_id> [clean|infected]${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 'https://example.com/test.pdf' 'abc123-def456-ghi789' clean"
    echo "  $0 'https://example.com/malware.exe' 'xyz789-abc123-def456' infected"
    echo ""
    echo "Parameters:"
    echo "  file_url    - URL to download the file from"
    echo "  file_id     - Unique identifier for the file (used as S3 key)"
    echo "  status      - 'clean' or 'infected' (default: clean)"
    exit 1
}

# Check if required parameters are provided
if [ $# -lt 2 ]; then
    usage
fi

FILE_URL="$1"
FILE_ID="$2"
STATUS="${3:-clean}"

echo -e "${BLUE}🔄 Processing file: $FILE_ID${NC}"
echo -e "${BLUE}📥 URL: $FILE_URL${NC}"
echo -e "${BLUE}🏷️  Status: $STATUS${NC}"

cat > test-file.txt << EOF
This is a test file for the file processing demo.
Created on: $(date)

File contents:
- Line 1: Hello World
- Line 2: This is a sample text file
- Line 3: Used for testing file upload and processing
- Line 4: Contains safe, clean content

EOF

echo "✅ Created test-file.txt with sample content"

# Upload to S3 upload bucket
echo -e "${YELLOW}📋 Step 2: Uploading to S3 upload bucket${NC}"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 cp "test-file.txt" "s3://upload-bucket/$FILE_ID" --region $REGION

echo -e "${GREEN}✅ File uploaded to upload bucket${NC}"

# Determine scan result status based on input
if [ "$STATUS" = "clean" ]; then
    SCAN_RESULT_STATUS="NO_THREATS_FOUND"
    THREATS="null"
else
    SCAN_RESULT_STATUS="THREATS_FOUND"
    THREATS='[{\"name\":\"EICAR-Test-File\",\"severity\":\"HIGH\"}]'
fi

# Create GuardDuty test event
echo -e "${YELLOW}📋 Step 3: Creating GuardDuty event for $STATUS file${NC}"

# Generate UUIDs using our function
EVENT_ID=$(generate_uuid)
VERSION_ID=$(generate_uuid)

# Generate a simple hash for eTag
ETAG_HASH=$(echo -n "$FILE_ID" | sha256sum | cut -d' ' -f1 | cut -c1-32)

cat > "guardduty-event-$FILE_ID.json" << EOF
{
  "Records": [
    {
      "body": "{\"version\":\"0\",\"id\":\"$EVENT_ID\",\"detail-type\":\"GuardDuty Malware Protection Object Scan Result\",\"source\":\"aws.guardduty\",\"account\":\"529138841305\",\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"region\":\"us-east-1\",\"resources\":[\"arn:aws:guardduty:us-east-1:529138841305:malware-protection-plan/40cc4000cfc5a7bda3d6\"],\"detail\":{\"schemaVersion\":\"1.0\",\"scanStatus\":\"COMPLETED\",\"resourceType\":\"S3_OBJECT\",\"s3ObjectDetails\":{\"bucketName\":\"upload-bucket\",\"objectKey\":\"$FILE_ID\",\"eTag\":\"$ETAG_HASH\",\"versionId\":\"$VERSION_ID\",\"s3Throttled\":false},\"scanResultDetails\":{\"scanResultStatus\":\"$SCAN_RESULT_STATUS\",\"threats\":$THREATS}}}"
    }
  ]
}
EOF

echo -e "${GREEN}✅ GuardDuty event created${NC}"

# Invoke Lambda function
echo -e "${YELLOW}📋 Step 4: Invoking Lambda function${NC}"

aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda invoke \
  --function-name fileprocess \
  --payload "fileb://guardduty-event-$FILE_ID.json" \
  "response-$FILE_ID.json" \
  --region $REGION

echo -e "${BLUE}Lambda Response:${NC}"
cat "response-$FILE_ID.json"
echo ""

# Check results
echo -e "${YELLOW}📋 Step 5: Checking processing results${NC}"

echo -e "${BLUE}Upload bucket contents:${NC}"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://upload-bucket/ --region $REGION

echo -e "${BLUE}Clean bucket contents:${NC}"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://clean-bucket/ --region $REGION

if [ "$STATUS" = "clean" ]; then
    echo -e "${GREEN}✅ Clean file should be moved to clean bucket${NC}"
    
    if aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://clean-bucket/ --recursive --region $REGION | grep -q "$FILE_ID"; then
        echo -e "${GREEN}🎉 File successfully processed and moved to clean bucket!${NC}"
        
        echo -e "${YELLOW}📋 Downloading processed file for verification${NC}"
        CLEAN_FILE=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://clean-bucket/ --recursive --region $REGION | grep "$FILE_ID" | awk '{print $4}')
        if [ -n "$CLEAN_FILE" ]; then
            aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 cp "s3://clean-bucket/$CLEAN_FILE" "processed-$FILE_ID" --region $REGION
            echo -e "${BLUE}Processed file saved as: processed-$FILE_ID${NC}"
        fi
    else
        echo -e "${RED}❌ File was not found in clean bucket. Check Lambda logs for errors.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Infected file should remain in upload bucket and not be processed${NC}"
    
    # Verify infected file remains in upload bucket
    if aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://upload-bucket/ --region $REGION | grep -q "$FILE_ID"; then
        echo -e "${GREEN}✅ Infected file correctly remains in upload bucket${NC}"
        
        # Verify it was NOT moved to clean bucket
        if aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://clean-bucket/ --recursive --region $REGION | grep -q "$FILE_ID"; then
            echo -e "${RED}❌ ERROR: Infected file was incorrectly moved to clean bucket!${NC}"
        else
            echo -e "${GREEN}✅ Infected file correctly NOT moved to clean bucket${NC}"
        fi
    else
        echo -e "${RED}❌ ERROR: Infected file was removed from upload bucket when it should have remained${NC}"
    fi
fi

echo -e "${GREEN}🔚 File processing completed!${NC}"

# Show cleanup commands
echo -e "${YELLOW}💡 To clean up, you can run:${NC}"
echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 rm s3://upload-bucket/$FILE_ID --region $REGION"
if [ "$STATUS" = "clean" ]; then
    echo "aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 rm s3://clean-bucket/ --recursive --region $REGION"
fi
echo "rm response-$FILE_ID.json processed-$FILE_ID 2>/dev/null || true"