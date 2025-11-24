#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LOCALSTACK_ENDPOINT="http://localstack:4566"
REGION="us-east-1"

# Function to show usage
usage() {
    echo -e "Usage: $0 <file_id> [-i]"
    echo ""
    echo "Parameters:"
    echo "  file_id  - Unique identifier for the file (used as S3 key)"
    echo "  -i       - Mark file as infected (optional)"
    exit 1
}

# Check if file_id is provided
if [ $# -lt 1 ]; then
    usage
fi

FILE_ID="$1"

# Check for -i flag
if [ "$2" = "-i" ]; then
    SCAN_RESULT_STATUS="THREATS_FOUND"
    THREATS_JSON=',\"threats\":[{\"name\":\"Trojan.Generic\"},{\"name\":\"Malware.Eicar.Test\"}]'
else
    SCAN_RESULT_STATUS="NO_THREATS_FOUND"
    THREATS_JSON=',\"threats\":null'
fi

echo -e "🔄 Processing file: $FILE_ID with Status: $SCAN_RESULT_STATUS"

GUARD_DUTY_PAYLOAD=$(cat << EOF | base64 -w 0
{
  "Records": [
    {
      "body": "{\"detail-type\":\"GuardDuty Malware Protection Object Scan Result\",\"detail\":{\"scanStatus\":\"COMPLETED\",\"s3ObjectDetails\":{\"bucketName\":\"upload-bucket\",\"objectKey\":\"$FILE_ID\"},\"scanResultDetails\":{\"scanResultStatus\":\"$SCAN_RESULT_STATUS\"$THREATS_JSON}}}"
    }
  ]
}
EOF
)

# Invoke Lambda function
echo -e "🚀 Invoking Lambda function"

RESPONSE=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda invoke \
  --function-name fileprocess \
  --payload "$GUARD_DUTY_PAYLOAD" \
  --region $REGION \
  /dev/stdout)

echo -e "Lambda Response:"
echo "$RESPONSE"
echo ""

# Check for Lambda errors
if echo "$RESPONSE" | grep -q '"errorType"'; then
    echo -e "❌ Lambda function failed!"
    echo -e "Check Lambda logs with: aws --endpoint-url=$LOCALSTACK_ENDPOINT logs tail /aws/lambda/fileprocess --follow"
    exit 1
fi

echo -e "✅ Lambda invocation completed successfully"
