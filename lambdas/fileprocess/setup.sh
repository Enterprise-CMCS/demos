#!/bin/bash

set -e  # Exit on any error

# Function to show usage
usage() {
    echo -e "${YELLOW}Usage: $0 <database_password>${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 mySecurePassword123"
    echo ""
    echo "Parameters:"
    echo "  database_password - Password for the PostgreSQL database"
    exit 1
}

echo "🚀 Setting up LocalStack infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required parameters are provided
if [ $# -lt 1 ]; then
    usage
fi

DB_PASSWORD="$1"

# Configuration
LOCALSTACK_ENDPOINT="http://localstack:4566"
REGION="us-east-1"

echo -e "${YELLOW}📋 Step 1: Creating S3 Buckets${NC}"

# Create S3 buckets (skip if they already exist)
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 mb s3://upload-bucket --region $REGION 2>/dev/null || echo -e "${YELLOW}⚠️  upload-bucket already exists${NC}"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 mb s3://clean-bucket --region $REGION 2>/dev/null || echo -e "${YELLOW}⚠️  clean-bucket already exists${NC}"

echo -e "${GREEN}✅ S3 buckets ready${NC}"

echo -e "${YELLOW}📋 Step 2: Setting up Secrets Manager${NC}"

# Check if secret already exists
if aws --endpoint-url=$LOCALSTACK_ENDPOINT secretsmanager describe-secret \
   --secret-id database-secret --region $REGION >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  database-secret already exists, updating it${NC}"
    
    # Update existing secret
    aws --endpoint-url=$LOCALSTACK_ENDPOINT secretsmanager update-secret \
      --secret-id database-secret \
      --secret-string "{
        \"username\": \"postgres\",
        \"password\": \"$DB_PASSWORD\",
        \"host\": \"db\",
        \"port\": \"5432\",
        \"dbname\": \"demos\"
      }" \
      --region $REGION
else
    # Create new secret
    aws --endpoint-url=$LOCALSTACK_ENDPOINT secretsmanager create-secret \
      --name "database-secret" \
      --description "Database credentials for local development" \
      --secret-string "{
        \"username\": \"postgres\",
        \"password\": \"$DB_PASSWORD\",
        \"host\": \"db\",
        \"port\": \"5432\",
        \"dbname\": \"demos\"
      }" \
      --region $REGION
fi

echo -e "${GREEN}✅ Database secret ready${NC}"

echo -e "${YELLOW}📋 Step 3: Building and deploying Lambda function${NC}"

# Navigate to lambda directory
cd /workspaces/demos/lambdas/fileprocess

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
cat > package.json << 'EOF'
{
  "name": "fileprocess-lambda",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "pg": "^8.0.0"
  }
}
EOF
fi

# Install dependencies if node_modules doesn't exist or package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Create deployment package
echo "Creating deployment package..."
zip -r fileprocess.zip index.js package.json package-lock.json node_modules/ -x "*.git*" "*.DS_Store*" >/dev/null

# Delete existing function if it exists
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda delete-function \
  --function-name fileprocess --region $REGION 2>/dev/null || echo -e "${YELLOW}⚠️  Function didn't exist, creating new one${NC}"

# Create lambda function
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda create-function \
  --function-name fileprocess \
  --runtime nodejs18.x \
  --role arn:aws:iam::000000000000:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://fileprocess.zip \
  --timeout 30 \
  --region $REGION >/dev/null

echo -e "${YELLOW}⏳ Waiting for Lambda function to be ready...${NC}"
sleep 1

# Wait for function to be active
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    STATUS=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda get-function \
        --function-name fileprocess \
        --region $REGION \
        --query 'Configuration.State' \
        --output text 2>/dev/null || echo "Pending")
    
    if [ "$STATUS" = "Active" ]; then
        echo -e "${GREEN}✅ Lambda function is active and ready${NC}"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo -e "${RED}❌ Lambda function failed to initialize${NC}"
        exit 1
    else
        echo -e "${YELLOW}⏳ Function state: $STATUS (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)${NC}"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Lambda function did not become active within expected time${NC}"
    exit 1
fi

# Create environment variables file
{
    echo '{'
    echo '  "Variables": {'
    echo '    "AWS_REGION": "us-east-1",'
    echo '    "AWS_ENDPOINT_URL": "http://localstack:4566",'
    echo '    "DATABASE_SECRET_ARN": "database-secret",'  # pragma: allowlist secret
    echo '    "UPLOAD_BUCKET": "upload-bucket",'
    echo '    "CLEAN_BUCKET": "clean-bucket",'
    echo '    "DB_SCHEMA": "demos_app"'
    echo '  }'
    echo '}'
} > lambda-env.json

echo -e "${GREEN}✅ Updating lambda configuration...${NC}"
# Update lambda configuration
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda update-function-configuration \
  --function-name fileprocess \
  --environment file://lambda-env.json \
  --region $REGION >/dev/null

echo -e "${GREEN}✅ Lambda function deployed successfully${NC}"

echo -e "${YELLOW}📋 Step 4: Debugging Lambda environment configuration${NC}"

# Check current Lambda environment variables
echo -e "${BLUE}Current Lambda environment variables:${NC}"
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda get-function-configuration \
  --function-name fileprocess \
  --region $REGION \
  --query 'Environment.Variables' \
  --output json

# Verify environment variables are properly set
ENV_CHECK=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda get-function-configuration \
  --function-name fileprocess \
  --region $REGION \
  --query 'Environment.Variables.AWS_ENDPOINT_URL' \
  --output text)

if [ "$ENV_CHECK" != "http://localstack:4566" ]; then
    echo -e "${RED}❌ AWS_ENDPOINT_URL not properly set, fixing...${NC}"
    
    # Re-apply environment variables
    aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda update-function-configuration \
      --function-name fileprocess \
      --environment file://lambda-env.json \
      --region $REGION >/dev/null
    
    echo -e "${GREEN}✅ Environment variables re-applied${NC}"
fi

echo -e "${YELLOW}📋 Step 5: Verifying setup${NC}"

# Verify setup
echo "S3 Buckets:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls

echo -e "\nSecrets:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT secretsmanager list-secrets --region $REGION --output table

echo -e "\nLambda Functions:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda list-functions --region $REGION --query 'Functions[].FunctionName' --output table

echo -e "\nLambda Environment Check:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda get-function-configuration \
  --function-name fileprocess \
  --region $REGION \
  --query 'Environment.Variables' \
  --output table

echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${YELLOW}💡 You can now use the process-file.sh script to test file processing${NC}"
echo -e "${YELLOW}💡 Example: ./process-file.sh 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 'test-123' clean${NC}"
echo -e "${BLUE}💡 Use './check-logs.sh' to view Lambda logs after testing${NC}"

# Clean up temporary files
rm -f lambda-env.json fileprocess.zip
echo -e "${BLUE}🧹 Cleaned up temporary files${NC}"