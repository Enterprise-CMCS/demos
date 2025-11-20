#!/usr/bin/bash
set -e

echo "🔐 Setting up Secrets Manager..."

AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

# Delete existing secret
$AWS_CMD secretsmanager delete-secret \
    --secret-id database-secret \
    --force-delete-without-recovery 2>/dev/null || true

# Create new secret
$AWS_CMD secretsmanager create-secret \
    --name database-secret \
    --description "Database credentials for local development" \
    --secret-string "{
        \"username\": \"postgres\",
        \"password\": \"$DB_PASSWORD\",
        \"host\": \"db\",
        \"port\": \"5432\",
        \"dbname\": \"demos\"
    }" >/dev/null

echo "✅ Secrets Manager ready"
