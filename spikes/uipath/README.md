# UiPath DU Spike

Simple Node scripts to hit UiPath Document Understanding endpoints: get an auth token, upload a document, start extraction, and poll until done. Logging is mirrored to stdout and a file.

## Setup

1) Install deps
```bash
npm install
```

2) Configure environment (e.g. `.env`)
```
CLIENT_ID=...
CLIENT_SECRET=...
ZERO_PROJECT_ID=...
EXTRACTOR_GUID=...
# Optional
LOG_FILE=uipath.log
```

## Run

Positional args:
- `node index.js <input-file> [log-file]`
  - `input-file` defaults to `ak-behavioral-health-demo-pa.pdf`
  - `log-file` defaults to `LOG_FILE` env or `uipath.log`

Example:
```bash
node index.js my-doc.pdf my-run.log
```

Flow:
- Fetch token (`getToken.js`)
- Upload document (`uploadDocument.js`)
- Start extraction (`extractDoc.js`)
- Poll for result (`fetchExtractResult.js`)
- Logs go to console and the log file via `logFile.js`

## Shared API helper

`uipathClient.js` exports:
- `duPost(url, token, data, options)` — injects bearer auth and `api-version` param.
- Constants: `UIPATH_BASE_URL`, `UIPATH_TENANT`, `UIPATH_PROJECT_ID`, `UIPATH_EXTRACTOR_GUID`, `UIPATH_API_VERSION`.
