This lambda has gotten a lot stuft tacked onto it. Including the second insert and i want to refactor it.

I’d simplify it globally by making the boundaries more explicit:

1. `uipathHttpClient`
   Owns Axios, auth headers, retry policy, timeout policy, safe error shaping, and logging. No document logic.

2. `uipathApi`
   Owns UiPath endpoint calls: `getProjectIdByName`, `uploadDocument`, `startExtraction`, `getExtractionStatus`. No DB writes, no SQS, no S3.

3. `documentInput`
   Owns SQS parsing, DB document lookup, S3 download, extension inference, local temp file path.

4. `documentUnderstandingRunner`
   Owns orchestration only: get token, resolve project, upload, start extraction, poll, return final status.

5. `persistence`
   Owns `uipath_result`, `uipath_value`, and suggestion extract persistence. This is already partly better after the DB module split.

The biggest cleanup would be to make the runner read like a script:

```ts
const input = await resolveDocumentInput(record);
const token = await getToken();
const project = await uipathApi.getProject(token);
const uploaded = await uipathApi.uploadDocument(token, input.file);
const extraction = await uipathApi.startExtraction(token, uploaded.documentId);
const result = await pollExtraction(token, extraction.resultUrl);

await persistResult(result);
```

Then all the noisy details live behind named functions.

For retry specifically, I’d prefer one UiPath-specific Axios client with a deliberate policy:

- retry safe `GET`s for `429/502/503/504`
- probably no retry for upload/start `POST`s
- maybe retry polling `GET`s, but with a clear cap so it doesn’t distort the outer polling loop too much
- sanitize logs centrally enough to avoid token/config dumps, while preserving real UiPath messages like `NoUnitsAvailableError`

I would also remove “generalized” helpers that only exist for one call site. Some of the current complexity comes from trying to make the retry code configurable before the Lambda actually needs that flexibility.

So: yes, it can be made simpler. I would not solve it by adding more failsafes. I’d solve it by naming the actual workflow steps and moving mechanics like HTTP/retry/logging into one small client module.
