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

# Function to show usage
usage() {
    echo "Usage: $0 [infection_percentage]"
    echo ""
    echo "Parameters:"
    echo "  infection_percentage - Percentage chance (0-100) for files to be flagged as infected (default: 0)"
    echo ""
    echo "Examples:"
    echo "  $0           # Process all files as clean"
    echo "  $0 25        # 25% chance each file is infected"
    echo "  $0 100       # All files will be infected"
    exit 1
}

# Parse infection percentage argument
INFECTION_PERCENTAGE=${1:-0}

# Validate infection percentage
if ! [[ "$INFECTION_PERCENTAGE" =~ ^[0-9]+$ ]] || [ "$INFECTION_PERCENTAGE" -lt 0 ] || [ "$INFECTION_PERCENTAGE" -gt 100 ]; then
    echo -e "${RED}❌ Error: Infection percentage must be between 0 and 100${NC}"
    usage
fi

echo -e "${BLUE}🔍 Finding all files in ${UPLOAD_BUCKET}...${NC}"
echo -e "${YELLOW}🦠 Infection rate: ${INFECTION_PERCENTAGE}%${NC}"
echo ""

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
INFECTED_COUNT=0

echo -e "${GREEN}📦 Found $TOTAL file(s) to process${NC}"
echo ""

# Process each file
while IFS= read -r file; do
    CURRENT=$((CURRENT + 1))
    
    # Generate random number between 0-99
    RANDOM_NUM=$((RANDOM % 100))
    
    # Determine if file should be infected based on percentage
    if [ "$RANDOM_NUM" -lt "$INFECTION_PERCENTAGE" ]; then
        INFECTED_FLAG="-i"
        INFECTED_COUNT=$((INFECTED_COUNT + 1))
        echo -e "${RED}[$CURRENT/$TOTAL] Processing (INFECTED): $file${NC}"
    else
        INFECTED_FLAG=""
        echo -e "${BLUE}[$CURRENT/$TOTAL] Processing (CLEAN): $file${NC}"
    fi
    
    # Call process-file.sh with the file ID and infection flag if needed
    "$SCRIPT_DIR/process-file.sh" "$file" $INFECTED_FLAG
    
    echo ""
done <<< "$FILES"

echo -e "${GREEN}✅ All files processed successfully!${NC}"
echo -e "${BLUE}📊 Statistics:${NC}"
echo -e "   Total files: $TOTAL"
echo -e "   Clean files: $((TOTAL - INFECTED_COUNT))"
echo -e "   Infected files: ${RED}$INFECTED_COUNT${NC}"
