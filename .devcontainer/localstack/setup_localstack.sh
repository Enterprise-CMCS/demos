#!/usr/bin/bash
set -e

echo "🚀 Starting LocalStack setup..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
for i in {1..15}; do
    if curl -sf http://localstack:4566/_localstack/health > /dev/null 2>&1; then
        echo "✅ LocalStack is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ LocalStack failed to start within 30 seconds"
        exit 1
    fi
    sleep 2
done

# Run setup scripts in order
echo ""
echo "📦 Setting up AWS resources..."

# Setup secrets manager (database credentials)
echo "1️⃣ Setting up Secrets Manager..."
bash /workspaces/demos/.devcontainer/localstack/setup/setup_secrets_manager.sh

# Setup SQS queues (must be before S3 for event notifications)
echo ""
echo "2️⃣ Setting up SQS queues..."
bash /workspaces/demos/.devcontainer/localstack/setup/setup_sqs_queue.sh

# Setup S3 buckets with event notifications
echo ""
echo "3️⃣ Setting up S3 buckets..."
bash /workspaces/demos/.devcontainer/localstack/setup/setup_s3.sh

# Setup Lambda functions
echo ""
echo "4️⃣ Setting up fileprocess Lambda..."
bash /workspaces/demos/.devcontainer/localstack/setup/setup_fileprocess_lambda.sh

echo ""
echo "5️⃣ Setting up deleteinfectedfile Lambda..."
bash /workspaces/demos/.devcontainer/localstack/setup/setup_deleteinfectedfile_lambda.sh

echo ""
echo "✅ LocalStack setup complete!"
echo ""
echo "📋 Resources created:"
echo "   - Secrets Manager: database credentials"
echo "   - SQS Queues: fileupload-queue, fileprocess-queue, infected-file-expiration-queue (+ DLQs)"
echo "   - S3 Buckets: upload-bucket, clean-bucket, infected-bucket, deleted-bucket"
echo "   - Lambda Functions: fileprocess, deleteinfectedfile"
echo "   - EventBridge Rules: s3-upload-to-guardduty"
echo ""
echo "🧪 Test the setup:"
echo "   # Upload a file"
echo "   upload through frontend (requires edit to hosts file) or use AWS CLI:"
echo "   aws s3 cp test.txt s3://upload-bucket/"
echo ""
echo "   # Simulate infected file expiration"
echo "   /workspaces/demos/.devcontainer/localstack/debug/delete-infected-file.sh <object-key>"
echo ""
echo "   # Delete all infected files"
echo "   /workspaces/demos/.devcontainer/localstack/debug/delete-all-infected-files.sh"
