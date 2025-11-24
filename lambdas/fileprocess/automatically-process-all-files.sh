#!/bin/bash
# filepath: /workspaces/demos/lambdas/fileprocess/automatically-process-all-files.sh
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse infection percentage argument (default to 0 if not provided)
INFECTION_PERCENTAGE=${1:-0}

echo -e "${BLUE}👀 Starting automatic file processor (interval: 10s, infection rate: ${INFECTION_PERCENTAGE}%)${NC}"
echo "Press Ctrl+C to stop"
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${TIMESTAMP}] Running process-all-files.sh...${NC}"
    
    "$SCRIPT_DIR/process-all-files.sh" "$INFECTION_PERCENTAGE"
    
    echo ""
    echo -e "${BLUE}⏳ Waiting 10 seconds...${NC}"
    sleep 10
done