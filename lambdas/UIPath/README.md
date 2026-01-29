# UiPath Document Understanding Lambda

TypeScript Lambda that uploads a document to UiPath DU, starts extraction, and polls with exponential backoff.

## Env vars (required)
```
UIPATH_CLIENT_ID=...
UIPATH_PROJECT_ID=...
UIPATH_SECRET_ID=<optional: Secrets Manager secret name/ARN containing clientId/clientSecret/projectId>
# optional
LOG_LEVEL=info
INPUT_FILE=ak-behavioral-health-demo-pa.pdf
```
## Set your secret using this: (<AWS_ENV_NAME> is dev btw)
```bash
AWS_PROFILE=<AWS_ENV_NAME> \
aws secretsmanager put-secret-value \
  --secret-id <UIPATH_SECRET_ID> \
  --secret-string '{"clientId":"...","clientSecret":"...","projectId":"..."}'
```

# Your vars that need to be stored in your secret manager:
* clientId
* clientSecret
* projectId

If `UIPATH_SECRET_ID` is set, the Lambda will resolve the client id/secret/project id from Secrets Manager (falling back to the environment values for local runs).

## Local usage
```bash
cd lambdas/UIPath
npm install

# Fast local run (tsx, no bundle)
npm run execute                    # uses INPUT_FILE or default PDF
# Override file
# INPUT_FILE=/path/to/file.pdf npm run execute

# Bundled run (CommonJS bundle)
npm run build

# Call the runner directly from the bundle
node -e "import('./dist/runDocumentUnderstanding.js').then(m => m.runDocumentUnderstanding('ak-behavioral-health-demo-pa.pdf', { initialDelayMs: 1000, maxDelayMs: 8000, logFullResult: true })).then(console.log).catch(console.error)"
```

## Lambda usage
- Handler: `index.handler`
- Trigger: SQS message body must contain `{ "s3Key": "<path/to/file>" }`
- Env: same as above (`UIPATH_CLIENT_ID`, `UIPATH_CLIENT_SECRET`, `UIPATH_PROJECT_ID`, optional `LOG_LEVEL`)
- CDK wiring: `deployment/stacks/uipath.ts` creates the UiPath Lambda, SQS queue, and DLQ; `deployment/app.ts` registers the stack. Producers send messages to `UiPathQueue` with the `s3Key` in the body.
