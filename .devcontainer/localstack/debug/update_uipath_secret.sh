#!/usr/bin/env bash
set -euo pipefail

# Update UiPath secret manager to set the values.

# Usage (uncomment out)
# UIPATH_CLIENT_ID="<SEE UIPATH ADMIN FOR OAUTH TOKENS!>" \
# UIPATH_CLIENT_SECRET="<SEE UIPATH ADMIN FOR OAUTH TOKENS!>" \
# /workspaces/demos/.devcontainer/localstack/debug/update_uipath_secret.sh
#
# Optional env:
#   UIPATH_SECRET_ID - secret name to update (default: demos-local/uipath)
#   AWS_REGION - AWS region (default: us-east-1)
#   LOCALSTACK_ENDPOINT - LocalStack endpoint (default: http://localstack:4566)
# ------------------------------------------------------------------------------ #
STAGE="local"
SECRET_ID="demos-$STAGE/uipath"
CLIENT_ID="${UIPATH_CLIENT_ID:-}"
CLIENT_SECRET="${UIPATH_CLIENT_SECRET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"
UIPATH_PROJECT_ID="${UIPATH_PROJECT_ID:-}"
LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "ERROR: UIPATH_CLIENT_ID, UIPATH_CLIENT_SECRET must be set in the environment." >&2
  exit 1
fi

AWS_CMD="aws --endpoint-url=${LOCALSTACK_ENDPOINT} --region ${AWS_REGION}"

echo "🔐 Updating secret '$SECRET_NAME' in LocalStack..."

# Create secret if it doesn't exist; otherwise put a new value
if ! $AWS_CMD secretsmanager describe-secret --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
  $AWS_CMD secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "UiPath client credentials for local development" \
    --secret-string "{\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"$CLIENT_SECRET\"}" >/dev/null
else
  $AWS_CMD secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "{\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"$CLIENT_SECRET\"}" >/dev/null
fi

echo "✅ Secret updated."

echo ""
echo "🔎 Current value:"
$AWS_CMD secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query SecretString --output text

echo ""
echo "📜 To tail UiPath lambda logs after invoking it:"
echo "aws --endpoint-url=${LOCALSTACK_ENDPOINT} logs tail /aws/lambdas/uipath --since 5m --follow"

