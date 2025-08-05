#!/bin/bash

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <s3path> <id>"
    echo "  s3path: The presigned URL from GraphQL"
    echo "  id: The file ID/key"
    exit 1
fi

# Set variables from command line arguments
s3path="$1"
id="$2"

echo "=== Starting file upload and processing workflow ==="
echo "S3 Path: $s3path"
echo "File ID: $id"
echo

# Create test file if it doesn't exist
if [ ! -f "test-upload.pdf" ]; then
    echo "Creating test file..."
    echo "This is a test document for upload" > test-upload.pdf
fi

# Step 1: Upload file using presigned URL
echo "=== Step 1: Uploading file to S3 ==="
curl -X PUT "$s3path" \
  -H "Content-Type: application/pdf" \
  --data-binary @test-upload.pdf

if [ $? -eq 0 ]; then
    echo "✅ File uploaded successfully"
else
    echo "❌ File upload failed"
    exit 1
fi
echo

# Step 2: Tag file as clean (simulate GuardDuty)
echo "=== Step 2: Tagging file as clean ==="
aws --endpoint-url=http://localstack:4566 s3api put-object-tagging \
  --bucket upload-bucket \
  --key "$id" \
  --tagging 'TagSet=[{Key=GuardDutyMalwareScanStatus,Value=Clean}]'

if [ $? -eq 0 ]; then
    echo "✅ File tagged as clean successfully"
else
    echo "❌ File tagging failed"
    exit 1
fi
echo

# Step 3: Create test event for Lambda
echo "=== Step 3: Creating Lambda test event ==="
cat > test-event.json << EOF
{
  "Records": [
    {
      "body": "{\"Records\":[{\"s3\":{\"bucket\":{\"name\":\"upload-bucket\"},\"object\":{\"key\":\"$id\"}}}]}"
    }
  ]
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Test event created successfully"
    echo "Test event contents:"
    cat test-event.json
else
    echo "❌ Failed to create test event"
    exit 1
fi
echo

# Step 4: Invoke Lambda function
echo "=== Step 4: Invoking Lambda function ==="
aws --endpoint-url=http://localstack:4566 lambda invoke \
  --function-name fileprocess \
  --payload fileb://test-event.json \
  response.json

if [ $? -eq 0 ]; then
    echo "✅ Lambda function invoked successfully"
    echo "Response:"
    cat response.json
else
    echo "❌ Lambda function invocation failed"
    exit 1
fi
echo

echo "=== Workflow completed ==="
echo "Files created:"
echo "  - test-upload.pdf (source file)"
echo "  - test-event.json (Lambda test event)"
echo "  - response.json (Lambda response)"
