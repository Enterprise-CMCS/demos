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
UPLOAD_BUCKET="upload-bucket"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🔍 Finding all files in ${UPLOAD_BUCKET}...${NC}"

# Get all files from upload-bucket
FILES=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls s3://$UPLOAD_BUCKET --recursive | awk '{print $4}')

# Check if any files were found
if [ -z "$FILES" ]; then
    echo -e "${YELLOW}⚠️  No files found in ${UPLOAD_BUCKET}${NC}"
    exit 0
fi

# Count total files
TOTAL=$(echo "$FILES" | wc -l)
CURRENT=0

echo -e "${GREEN}📦 Found $TOTAL file(s) to process${NC}"
echo ""

# Process each file
while IFS= read -r file; do
    CURRENT=$((CURRENT + 1))
    echo -e "${BLUE}[$CURRENT/$TOTAL] Processing: $file${NC}"
    
    # Call process-file.sh with the file ID
    "$SCRIPT_DIR/process-file.sh" "$file"
    
    echo ""
done <<< "$FILES"

echo -e "${GREEN}✅ All files processed successfully!${NC}"
