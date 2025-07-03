#!/usr/bin/bash
pre-commit install

aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test # pragma: allowlist secret
aws configure set region us-east-1

# The ENDPOINT_URL setting is broken in all contexts except on the command line
# Add this alias to handle it
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.bashrc
echo "alias aws='aws --endpoint-url=http://localstack:4566'" >> ~/.zshrc
