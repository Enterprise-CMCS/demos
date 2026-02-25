# UIPath v1 Overview

## Spike/UIPath
This project starts with the spike. This is our control group. it's got all the functionality of the lambda, but in a very concise controlled environment. So if there's an outage or an issue,  we can run the spike to verify functionality to find out if it's us or them. Pretty much.

## lambda/UIPath
This is where the rubber hits the road. based on the `fileprocess` "stack", this performs the "uipath work". A message is sent to the UIPath queue. Then the AWS sends a request to the lambda. Upon receipt, a request to uipath will look up the project Id based on the project name: **demosOCR** (*OCR Means: optical character recognition).Next another request to UIPath is synchronously send to get more information about that project, including extractionUrls, and once we get those URLs we can digitize the document and sent it to UIPath to start the field value extraction process. This process takes about 10-60 seconds (~30 on average) depending on the size of the file, and our lambda will poll the complete endpoint until we have results, or it times out. Then the lambda will store the sound found fields to the database.

## Server
We have set up a mutation (GraphQL endpoint) that will spawn the queue message, This is a graphql endpoint we can run any number of ways, included on document upload if needed, or when we start a phase. All we need to include are the following with an existing document id:

## Localstack
There have been numerous updates to the localstack infra because without this, it would have been very difficult to develop this app using my ephemeral environment. I still do not have a perfect solution to get the oauth tokens into the localstack without running an `awslocal update-secret` command. But this is continuing to improve.

```
mutation {
  triggerUiPath(
    documentId: "GUID123-docc-idid-a885-10987654321"
  )
}
```

## Summary
This means the document understanding digitizes your document, then uploads it to UIPath, then is read by an AI and shipped back the lambda where we store that information in a couple tables. We stored each node found that we are looking for, and then record the value. We also store the responses in _complete_ format as it hold more information than we use. (like location of the sentences/words found)

## Dev Details

## Env vars (NOT required)
```
# You can store secret and client ids in env for setting the secrets manager.
UIPATH_CLIENT_ID="GUID STRING"
UIPATH_CLIENT_SECRET="GUID STRING" # pragma: allowlist secret
```
Other than that, env not used. All set up uipathprocessor
```bash
# NOTE: these values are not even used via env vars.
# this is where i store the OAUTH keys so i can set the secrets in localstack
# remove the pragma comments first.

awslocal secretsmanager update-secret \
  --secret-id demos-local/uipath \
  --secret-string '{ # pragma: allowlist secret
    "clientId": "STRING",
    "clientSecret": "STRING" # pragma: allowlist secret
  }'

```

# Your vars that need to be stored in your secret manager:
* clientId
* clientSecret

If `UIPATH_SECRET_ID` is set, the Lambda will resolve client id/secret from Secrets Manager.

## Local usage
```bash
cd lambdas/UIPath
npm install
awslocal secretsmanager update-secret \
  --secret-id demos-local/uipath \
  --secret-string '{ # pragma: allowlist secret
    "clientId": "STRING",
    "clientSecret": "STRING" # pragma: allowlist secret
  }'

# Then trigger local run
```
# SDK keys not required, they are injected by AWS.
AWS_ACCESS_KEY_ID="test" # pragma: allowlist secret
AWS_SECRET_ACCESS_KEY="test" # pragma: allowlist secret
QUEUE_URL=$(aws --endpoint-url=http://localstack:4566 \
  --region us-east-1 \
  sqs get-queue-url \
  --queue-name uipath-queue \
  --query QueueUrl \
  --output text)

aws --endpoint-url=http://localstack:4566 \
  --region us-east-1 \
  sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{"documentId":"00000000-0000-0000-0000-000000000000"}'
```
