# UiPath Rewrite Lambda

This is a refactored sibling of `lambdas/UIPath`. The intent is to keep the Lambda workflow readable while preserving the current runtime behavior.

The top-level flow is in `index.ts` and `documentUnderstanding.ts`:

1. Read the SQS record.
2. Resolve the document and download it from S3.
3. Get a UiPath token.
4. Resolve the UiPath project.
5. Upload the document.
6. Start extraction.
7. Poll until extraction succeeds or fails.
8. Persist pending, finished, and failed status rows.

HTTP retry behavior is isolated in `uipathHttpClient.ts`. Only safe UiPath `GET` calls that fetch project/extractor metadata use transient retry. Upload and extraction-start `POST` calls do not retry.
