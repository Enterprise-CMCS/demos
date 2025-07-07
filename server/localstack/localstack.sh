#!/usr/bin/bash

# Static variables
# Note, using escaped quotes for the SECRET_VALUE because of needing to double-quote it later
ENDPOINT="--endpoint-url=http://localstack:4566"
PACKAGE_NAME="demos-server"
PACKAGE_VERSION="0.1.0"
DEPLOY_BUCKET="${PACKAGE_NAME}-deployment"
API_NAME="${PACKAGE_NAME}-api"
SECRET_NAME="${PACKAGE_NAME}-database-url"
SECRET_VALUE="{\"password\":\"postgres\",\"dbname\":\"demos\",\"port\":\"5432\",\"host\":\"db\",\"username\":\"postgres\"}" # pragma: allowlist secret

# Convert exit codes to booleans for easy processing
clean_exit() {
  if [ $? -eq 0 ]; then echo true; else echo false; fi
}

# Checking for existing items
aws ${ENDPOINT} s3api head-bucket --bucket ${DEPLOY_BUCKET} >/dev/null 2>&1
BUCKET_EXISTS=$(clean_exit)
aws ${ENDPOINT} lambda get-function --function-name ${PACKAGE_NAME} >/dev/null 2>&1
LAMBDA_EXISTS=$(clean_exit)

API_ID=$(aws apigateway get-rest-apis \
  ${ENDPOINT} \
  --query "items[?name=='${API_NAME}'].id" \
  --output text)
API_EXISTS=$([ -n "${API_ID}" ] && echo true || echo false)

aws ${ENDPOINT} secretsmanager describe-secret --secret-id ${SECRET_NAME} >/dev/null 2>&1
SECRET_EXISTS=$(clean_exit)

echo "Bucket exists in localstack: ${BUCKET_EXISTS}"
echo "Lambda exists in localstack: ${LAMBDA_EXISTS}"
echo "Gateway exists in localstack: ${API_EXISTS}"
echo "Secret exists in localstack: ${SECRET_EXISTS}"

# Clean up old stuff in localstack
if [[ ${BUCKET_EXISTS} == true ]]; then
  aws ${ENDPOINT} s3 rb s3://${DEPLOY_BUCKET} --force
fi
if [[ ${LAMBDA_EXISTS} == true ]]; then
  aws ${ENDPOINT} lambda delete-function --function-name ${PACKAGE_NAME}
fi
if [[ ${API_EXISTS} == true ]]; then
  aws ${ENDPOINT} apigateway delete-rest-api --rest-api-id ${API_ID}
fi
if [[ ${SECRET_EXISTS} == true ]]; then
  aws ${ENDPOINT} secretsmanager delete-secret --secret-id ${SECRET_NAME} --force-delete-without-recovery
fi

# Build file
npm run build

# This copies binaries to the installed server file
mkdir -p node_modules/.prisma/client
cp -r ../node_modules/.prisma/client/*.node node_modules/.prisma/client/
cp ../build/server.cjs .
zip -r ${PACKAGE_NAME}.zip server.cjs node_modules

# Clean up old files
rm server.cjs
rm -r node_modules

# Make a bucket and upload the zip
aws ${ENDPOINT} s3 mb s3://${DEPLOY_BUCKET}
aws ${ENDPOINT} s3 cp ${PACKAGE_NAME}.zip s3://${DEPLOY_BUCKET}/${PACKAGE_NAME}.zip

# Create a secret
SECRET_ARN=$(aws secretsmanager create-secret \
  ${ENDPOINT} \
  --name "${SECRET_NAME}" \
  --secret-string "${SECRET_VALUE}" \
  --query "ARN" \
  --output text)

# Create a function
aws lambda create-function \
  ${ENDPOINT} \
  --function-name ${PACKAGE_NAME} \
  --code S3Bucket=${DEPLOY_BUCKET},S3Key=${PACKAGE_NAME}.zip \
  --handler server.graphqlHandler \
  --runtime nodejs22.x \
  --role arn:aws:iam::000000000000:role/${PACKAGE_NAME}-localstack-lambda \
  --environment "Variables={BYPASS_AUTH=true, DATABASE_SECRET_ARN=${SECRET_ARN}, DATABASE_URL=postgres://placeholder}"

# Add Lambda permission for API Gateway
aws lambda add-permission \
  ${ENDPOINT} \
  --function-name ${PACKAGE_NAME} \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com

# Create an API gateway
API_ID=$(aws apigateway create-rest-api \
  ${ENDPOINT} \
  --name ${API_NAME} \
  --description "${API_NAME} Localstack Version" \
  --query "id" \
  --output text)

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws ${ENDPOINT} apigateway get-resources \
  --rest-api-id ${API_ID} \
  --query "items[?path=='/'].id" \
  --output text)

# Adding POST method
aws apigateway put-method \
  ${ENDPOINT} \
  --rest-api-id ${API_ID} \
  --resource-id ${ROOT_RESOURCE_ID} \
  --http-method POST \
  --authorization-type NONE

# Integrate POST method with Lambda
aws apigateway put-integration \
  ${ENDPOINT} \
  --rest-api-id ${API_ID} \
  --resource-id ${ROOT_RESOURCE_ID} \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:${PACKAGE_NAME}/invocations"

# Deploy the API
aws apigateway create-deployment \
  ${ENDPOINT} \
  --rest-api-id ${API_ID} \
  --stage-name local

# Output the API Gateway URL
echo "API Gateway URL: http://localhost:4566/_aws/execute-api/${API_ID}/local"
