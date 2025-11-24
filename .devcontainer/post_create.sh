#!/usr/bin/bash
pre-commit install

aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test # pragma: allowlist secret
aws configure set region us-east-1

# The ENDPOINT_URL setting is broken in all contexts except on the command line
# Add this alias to handle it
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.bashrc
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.zshrc

# Wait for LocalStack
echo "⏳ Waiting for LocalStack to be ready..."
for i in {1..30}; do
    if curl -sf http://localstack:4566/_localstack/health > /dev/null 2>&1; then
        echo "✅ LocalStack is ready!"
        break
    fi
    sleep 2
done

# Configuration
export LOCALSTACK_ENDPOINT="http://localstack:4566"
export AWS_REGION="us-east-1"
export DB_PASSWORD="postgres" # pragma: allowlist secret

# Run setup scripts
bash /workspaces/demos/.devcontainer/post_create/setup_s3.sh
bash /workspaces/demos/.devcontainer/post_create/setup_secrets_manager.sh
bash /workspaces/demos/.devcontainer/post_create/setup_fileprocess_lambda.sh

# Verify setup
echo "S3 Buckets:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT s3 ls

echo -e "\nSecrets:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT secretsmanager list-secrets --region $AWS_REGION --output table

echo -e "\nLambda Functions:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda list-functions --region $AWS_REGION --query 'Functions[].FunctionName' --output table

echo -e "\nLambda Environment Check:"
aws --endpoint-url=$LOCALSTACK_ENDPOINT lambda get-function-configuration \
  --function-name fileprocess \
  --region $AWS_REGION \
  --query 'Environment.Variables' \
  --output table

echo "✅ LocalStack setup complete!"
