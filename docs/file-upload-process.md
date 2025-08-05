# LocalStack S3 File Upload and Lambda Processing Setup Guide

## Prerequisites
- Dev container with LocalStack configured in docker-compose.yml
- AWS CLI available and configured for LocalStack
- Node.js and npm available

## 1. Initial Setup - Verify LocalStack is Running

```bash
# Check LocalStack container status
docker ps | grep localstack

# Test LocalStack connectivity
curl http://localstack:4566/health

# Verify S3 service is available
aws --endpoint-url=http://localstack:4566 s3 ls
```

## 2. Create S3 Buckets

```bash
# Create upload bucket (for initial file uploads)
aws --endpoint-url=http://localstack:4566 s3 mb s3://upload-bucket

# Create clean bucket (for processed clean files)
aws --endpoint-url=http://localstack:4566 s3 mb s3://clean-bucket

# Verify buckets were created
aws --endpoint-url=http://localstack:4566 s3 ls

## 5. Test File Upload Flow

### 5.1 Get Presigned URL from GraphQL


### 5.2 Upload File Using Presigned URL
```bash
# Create test file
echo "This is a test document for upload" > test-upload.pdf

# Upload using presigned URL (replace with actual URL from GraphQL response)
curl -X PUT "YOUR_PRESIGNED_URL_FROM_GRAPHQL" \
  -H "Content-Type: application/pdf" \
  --data-binary @test-upload.pdf

# Verify upload
aws --endpoint-url=http://localstack:4566 s3 ls s3://upload-bucket/
```

### 5.3 Download and Verify Uploaded File
```bash
# Download the uploaded file
aws --endpoint-url=http://localstack:4566 s3 cp s3://upload-bucket/YOUR_FILE_ID ./downloaded-file.pdf

# Verify contents
cat downloaded-file.pdf
```

## 6. Deploy Lambda Function for File Processing

### 6.1 Prepare Lambda Package
```bash
cd /workspaces/demos/deployment/lambda/fileprocess

# Create package.json if needed
cat > package.json << EOF
{
  "name": "fileprocess-lambda",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "pg": "^8.0.0"
  }
}
EOF

# Install dependencies
npm install

# Create deployment package
zip -r fileprocess.zip index.js package.json node_modules/ -x "*.git*" "*.DS_Store*"
```

### 6.2 Deploy Lambda to LocalStack
```bash
# Create lambda function
aws --endpoint-url=http://localstack:4566 lambda create-function \
  --function-name fileprocess \
  --runtime nodejs18.x \
  --role arn:aws:iam::000000000000:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://fileprocess.zip \
  --timeout 30

# Create environment variables file
cat > env-vars.json << 'EOF'
{
  "Variables": {
    "DB_HOST": "db",
    "DB_PORT": "5432",
    "DB_USER": "postgres",
    "DB_NAME": "demos",
    "DB_PASSWORD": "",
    "UPLOAD_BUCKET": "upload-bucket",
    "CLEAN_BUCKET": "clean-bucket"
  }
}
EOF

# Update function with environment variables
aws --endpoint-url=http://localstack:4566 lambda update-function-configuration \
  --function-name fileprocess \
  --environment file://env-vars.json

# Verify function was created
aws --endpoint-url=http://localstack:4566 lambda list-functions
```

## 7. Test Lambda Function

### 7.1 Tag Uploaded File as Clean (Simulate GuardDuty)
```bash
# Tag file as clean
aws --endpoint-url=http://localstack:4566 s3api put-object-tagging \
  --bucket upload-bucket \
  --key YOUR_FILE_ID \
  --tagging 'TagSet=[{Key=GuardDutyMalwareScanStatus,Value=Clean}]'

# Verify tag was set
aws --endpoint-url=http://localstack:4566 s3api get-object-tagging \
  --bucket upload-bucket \
  --key YOUR_FILE_ID
```

### 7.2 Create and Execute Lambda Test
```bash
# Create test event
cat > test-event.json << 'EOF'
{
  "Records": [
    {
      "body": "{\"Records\":[{\"s3\":{\"bucket\":{\"name\":\"upload-bucket\"},\"object\":{\"key\":\"YOUR_FILE_ID\"}}}]}"
    }
  ]
}
EOF

# Invoke lambda function
aws --endpoint-url=http://localstack:4566 lambda invoke \
  --function-name fileprocess \
  --payload fileb://test-event.json \
  response.json

# Check response
cat response.json
```

### 7.3 Verify File Processing
```bash
# Check upload bucket (should be empty or have fewer files)
echo "Upload bucket contents:"
aws --endpoint-url=http://localstack:4566 s3 ls s3://upload-bucket/

# Check clean bucket (should contain processed file)
echo "Clean bucket contents:"
aws --endpoint-url=http://localstack:4566 s3 ls s3://clean-bucket/

# Download from clean bucket to verify
aws --endpoint-url=http://localstack:4566 s3 cp s3://clean-bucket/YOUR_FILE_ID ./processed-file.pdf
cat processed-file.pdf
```

## 8. Useful Commands for Monitoring and Debugging

### 8.1 Bucket Inspection
```bash
# List all buckets
aws --endpoint-url=http://localstack:4566 s3 ls

# List bucket contents with details
aws --endpoint-url=http://localstack:4566 s3 ls s3://upload-bucket/ --recursive --human-readable

# Get object metadata
aws --endpoint-url=http://localstack:4566 s3api head-object \
  --bucket upload-bucket \
  --key YOUR_FILE_ID
```

### 8.2 Lambda Monitoring
```bash
# List all lambda functions
aws --endpoint-url=http://localstack:4566 lambda list-functions

# Get function configuration
aws --endpoint-url=http://localstack:4566 lambda get-function-configuration \
  --function-name fileprocess

# Check lambda logs
aws --endpoint-url=http://localstack:4566 logs describe-log-groups
aws --endpoint-url=http://localstack:4566 logs describe-log-streams \
  --log-group-name /aws/lambda/fileprocess
```

### 8.3 LocalStack Health and Logs
```bash
# Check LocalStack health
curl http://localstack:4566/health

# View LocalStack container logs
docker logs demos_devcontainer-localstack-1 --tail 50
```

## 9. Clean Up Commands

```bash
# Delete specific file from bucket
aws --endpoint-url=http://localstack:4566 s3 rm s3://upload-bucket/YOUR_FILE_ID

# Empty buckets
aws --endpoint-url=http://localstack:4566 s3 rm s3://upload-bucket/ --recursive
aws --endpoint-url=http://localstack:4566 s3 rm s3://clean-bucket/ --recursive

# Delete lambda function
aws --endpoint-url=http://localstack:4566 lambda delete-function \
  --function-name fileprocess

# Delete buckets
aws --endpoint-url=http://localstack:4566 s3 rb s3://upload-bucket
aws --endpoint-url=http://localstack:4566 s3 rb s3://clean-bucket
```

## Notes
- LocalStack uses `test` for both access key and secret access key
- Internal container communication uses `http://localstack:4566`
- External access (from host) uses `http://localhost:4566`
- Files tagged with `GuardDutyMalwareScanStatus=Clean` will be processed by the lambda
- Lambda function moves clean files from upload-bucket to clean-bucket