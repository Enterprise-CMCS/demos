# UiPath Document Understanding Lambda

TypeScript Lambda that uploads a document to UiPath DU, starts extraction, and polls with exponential backoff.

## Env vars (required)
```
CLIENT_ID=...
CLIENT_SECRET=...
UIPATH_PROJECT_ID=...
EXTRACTOR_GUID=...
# optional
LOG_LEVEL=info
INPUT_FILE=ak-behavioral-health-demo-pa.pdf
```

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
RUN_LOCAL=true INPUT_FILE=/path/to/file.pdf node dist/index.js

# Call the runner directly from the bundle
node -e "import('./dist/runDocumentUnderstanding.js').then(m => m.runDocumentUnderstanding('ak-behavioral-health-demo-pa.pdf', { initialDelayMs: 1000, maxDelayMs: 8000, logFullResult: true })).then(console.log).catch(console.error)"
```

## Lambda usage
- Handler: `index.handler`
- Trigger: SQS message body must contain `{ "s3Key": "<path/to/file>" }`
- Env: same as above (`CLIENT_ID`, `CLIENT_SECRET`, `UIPATH_PROJECT_ID`, `EXTRACTOR_GUID`, optional `LOG_LEVEL`)
- CDK wiring: `deployment/stacks/uipath.ts` creates the UiPath Lambda, SQS queue, and DLQ; `deployment/app.ts` registers the stack. Producers send messages to `UiPathQueue` with the `s3Key` in the body.
