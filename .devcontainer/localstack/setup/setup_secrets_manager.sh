#!/usr/bin/bash
set -e

echo "🔐 Setting up Secrets Manager..."

LOCALSTACK_ENDPOINT="http://localstack:4566"
AWS_REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$LOCALSTACK_ENDPOINT --region $AWS_REGION"

DB_PASSWORD="postgres" # pragma: allowlist secret
UIPATH_SECRET_ID="demos-local/uipath"
# There's a check in the code to look for these default values.
UIPATH_CLIENT_ID=${UIPATH_CLIENT_ID:-"local-uipath-client-id"} # pragma: allowlist secret
UIPATH_CLIENT_SECRET=${UIPATH_CLIENT_SECRET:-"local-uipath-client-secret"} # pragma: allowlist secret
# UIPATH_PROJECT_ID=${UIPATH_PROJECT_ID:-""} # pragma: allowlist secret

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

# Delete existing UiPath secret
$AWS_CMD secretsmanager delete-secret \
    --secret-id "$UIPATH_SECRET_ID" \
    --force-delete-without-recovery 2>/dev/null || true

# Create UiPath client credential secret for local development
$AWS_CMD secretsmanager create-secret \
    --name "$UIPATH_SECRET_ID" \
    --description "UiPath client credentials for local development" \
    --secret-string "{
        \"clientId\": \"$UIPATH_CLIENT_ID\",
        \"clientSecret\": \"$UIPATH_CLIENT_SECRET\"
    }" >/dev/null

echo "✅ Secrets Manager ready"
