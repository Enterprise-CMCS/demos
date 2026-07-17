This lambda runs the BN validations on the server side after uploads.

Some quick start commands for local development:

View the logs:
`aws logs tail /aws/lambda/budgetneutrality`

Add a BN notebook sqs message:
`aws sqs send-message --queue-url "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/budget-neutrality-queue" --message-body '{"documentId": "doc-1",  "documentTypeId": "BN Workbook" }'`

Rebuild deploy the BN Lambda:
`/workspaces/demos/.devcontainer/localstack/setup/setup_budgetneutrality_lambda.sh`

Directly call the lambda:
(need to double check payload)
`aws lambda invoke --function-name budgetneutrality --payload 'Records: [{ body: {"documentId": "doc-1",  "documentTypeId": "BN Workbook" }}]' --cli-binary-format raw-in-base64-out /dev/stdout`

