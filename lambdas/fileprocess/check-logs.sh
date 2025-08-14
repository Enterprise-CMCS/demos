#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCALSTACK_ENDPOINT="http://localstack:4566"
REGION="us-east-1"
LAMBDA_FUNCTION_NAME="fileprocess"
LOG_GROUP_NAME="/aws/lambda/$LAMBDA_FUNCTION_NAME"

# Function to show usage
usage() {
    echo -e "${YELLOW}Usage: $0 [lines] [stream]${NC}"
    echo ""
    echo "Parameters:"
    echo "  lines  - Number of recent log lines to show (default: 50)"
    echo "  stream - Specific log stream to check (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0           # Show last 50 lines from latest stream"
    echo "  $0 100       # Show last 100 lines from latest stream"
    echo "  $0 20 all    # Show last 20 lines from all streams"
    exit 1
}

# Parse parameters
LINES=${1:-50}
STREAM_MODE=${2:-latest}

echo -e "${BLUE}🔍 Checking Lambda logs for function: $LAMBDA_FUNCTION_NAME${NC}"
echo -e "${BLUE}📋 Lines to show: $LINES${NC}"
echo -e "${BLUE}🎯 Stream mode: $STREAM_MODE${NC}"
echo ""

# Check if log group exists
if ! aws --endpoint-url=$LOCALSTACK_ENDPOINT logs describe-log-groups \
     --log-group-name-prefix "$LOG_GROUP_NAME" \
     --region $REGION \
     --query "logGroups[?logGroupName=='$LOG_GROUP_NAME']" \
     --output text >/dev/null 2>&1; then
    echo -e "${RED}❌ Log group '$LOG_GROUP_NAME' not found${NC}"
    echo -e "${YELLOW}💡 This might mean:${NC}"
    echo "   - The Lambda function hasn't been invoked yet"
    echo "   - The function name is incorrect"
    echo "   - LocalStack logging is not enabled"
    exit 1
fi

echo -e "${GREEN}✅ Found log group: $LOG_GROUP_NAME${NC}"
echo ""

# Get log streams - fix the parsing issue
echo -e "${YELLOW}📋 Available log streams:${NC}"
LOG_STREAMS=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT logs describe-log-streams \
    --log-group-name "$LOG_GROUP_NAME" \
    --order-by LastEventTime \
    --descending \
    --region $REGION \
    --query 'logStreams[].logStreamName' \
    --output text)

if [ -z "$LOG_STREAMS" ]; then
    echo -e "${RED}❌ No log streams found${NC}"
    echo -e "${YELLOW}💡 The Lambda function may not have been invoked yet${NC}"
    exit 1
fi

# Show available streams (fix formatting)
echo "$LOG_STREAMS" | tr '\t' '\n' | head -5 | nl -v0 -s": "
echo ""

if [ "$STREAM_MODE" = "all" ]; then
    echo -e "${YELLOW}📋 Showing logs from all streams (last $LINES lines):${NC}"
    echo "=================================================="
    
    # Get logs from all streams, sorted by time
    aws --endpoint-url=$LOCALSTACK_ENDPOINT logs filter-log-events \
        --log-group-name "$LOG_GROUP_NAME" \
        --region $REGION \
        --query "events[*].[timestamp,message]" \
        --output text 2>/dev/null | \
        sort -n | \
        tail -n "$LINES" | \
        while IFS=$'\t' read -r timestamp message; do
            # Convert timestamp to readable format
            if [ -n "$timestamp" ] && [ "$timestamp" != "None" ]; then
                READABLE_TIME=$(date -d "@$((timestamp/1000))" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$(date)")
                echo "[$READABLE_TIME] $message"
            else
                echo "$message"
            fi
        done
else
    # Get the latest log stream (fix parsing)
    LATEST_STREAM=$(echo "$LOG_STREAMS" | tr '\t' '\n' | head -1)
    
    if [ -z "$LATEST_STREAM" ]; then
        echo -e "${RED}❌ Could not determine latest stream${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📋 Showing logs from latest stream:${NC}"
    echo -e "${BLUE}Stream: $LATEST_STREAM${NC}"
    echo "=================================================="
    
    # Get logs from the latest stream
    if ! aws --endpoint-url=$LOCALSTACK_ENDPOINT logs get-log-events \
        --log-group-name "$LOG_GROUP_NAME" \
        --log-stream-name "$LATEST_STREAM" \
        --region $REGION \
        --query "events[*].message" \
        --output text 2>/dev/null | \
        tail -n "$LINES"; then
        
        echo -e "${YELLOW}⚠️  Could not retrieve logs from stream. Trying alternative method...${NC}"
        
        # Try using filter-log-events for this specific stream
        aws --endpoint-url=$LOCALSTACK_ENDPOINT logs filter-log-events \
            --log-group-name "$LOG_GROUP_NAME" \
            --log-stream-names "$LATEST_STREAM" \
            --region $REGION \
            --query "events[*].[timestamp,message]" \
            --output text 2>/dev/null | \
            tail -n "$LINES" | \
            while IFS=$'\t' read -r timestamp message; do
                if [ -n "$timestamp" ] && [ "$timestamp" != "None" ]; then
                    READABLE_TIME=$(date -d "@$((timestamp/1000))" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$(date)")
                    echo "[$READABLE_TIME] $message"
                else
                    echo "$message"
                fi
            done
    fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}📊 Log Summary:${NC}"

# Show log group info (fix numeric comparison)
LOG_INFO=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT logs describe-log-groups \
    --log-group-name-prefix "$LOG_GROUP_NAME" \
    --region $REGION \
    --query "logGroups[0].[storedBytes,retentionInDays]" \
    --output text 2>/dev/null)

if [ -n "$LOG_INFO" ]; then
    STORED_BYTES=$(echo "$LOG_INFO" | cut -f1)
    RETENTION=$(echo "$LOG_INFO" | cut -f2)
    
    # Fix numeric comparison - check if it's a valid number
    if [ "$STORED_BYTES" != "None" ] && [ "$STORED_BYTES" != "null" ] && \
       [[ "$STORED_BYTES" =~ ^[0-9]+$ ]] && [ "$STORED_BYTES" -gt 0 ]; then
        STORED_KB=$((STORED_BYTES / 1024))
        echo -e "${BLUE}📦 Stored logs: ${STORED_KB}KB${NC}"
    fi
    
    if [ "$RETENTION" != "None" ] && [ "$RETENTION" != "null" ]; then
        echo -e "${BLUE}⏰ Retention: $RETENTION days${NC}"
    fi
fi

# Count total log streams (fix counting)
STREAM_COUNT=$(echo "$LOG_STREAMS" | tr '\t' '\n' | grep -v '^$' | wc -l)
echo -e "${BLUE}🔢 Total log streams: $STREAM_COUNT${NC}"

# Show most recent invocation time
RECENT_TIME=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT logs describe-log-streams \
    --log-group-name "$LOG_GROUP_NAME" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --region $REGION \
    --query 'logStreams[0].lastEventTime' \
    --output text 2>/dev/null)

if [ "$RECENT_TIME" != "None" ] && [ "$RECENT_TIME" != "null" ] && [ -n "$RECENT_TIME" ] && \
   [[ "$RECENT_TIME" =~ ^[0-9]+$ ]]; then
    READABLE_TIME=$(date -d "@$((RECENT_TIME/1000))" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
    echo -e "${BLUE}🕐 Last log event: $READABLE_TIME${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Usage tips:${NC}"
echo "  • Use './check-logs.sh 100' to see more lines"
echo "  • Use './check-logs.sh 20 all' to see logs from all streams"
echo "  • Logs are updated in real-time after Lambda invocations"
echo ""
echo -e "${YELLOW}🔧 Debugging tips:${NC}"
echo "  • If logs are empty, try invoking the Lambda first"
echo "  • Use 'docker logs demos_devcontainer-localstack-1' to see LocalStack logs"
echo "  • Check that your Lambda function has console.log statements"
