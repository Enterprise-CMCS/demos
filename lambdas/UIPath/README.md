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

## Create Lambda to recieve documents
- see where we update datasbase in Connor's file scanner.
- Set up SQS to notify
- Dead letter queue, for re-run
-

## Available Extractors

Below is a sample JSON listing all available extractors and their endpoints:

```json
{
  "extractors": [
    {
      "id": "generative_extractor",
      "name": "Generative Extractor",
      "documentTypeId": "",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/generative_extractor?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/generative_extractor/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/generative_extractor/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices",
      "name": "Invoices",
      "documentTypeId": "invoices",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices_india",
      "name": "Invoices India",
      "documentTypeId": "invoices_india",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_india?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_india/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_india/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices_japan",
      "name": "Invoices Japan",
      "documentTypeId": "invoices_japan",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_japan?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_japan/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_japan/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices_china",
      "name": "Invoices China",
      "documentTypeId": "invoices_china",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_china?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_china/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_china/extraction/start?api-version=1.0"
    },
    {
      "id": "receipts",
      "name": "Receipts",
      "documentTypeId": "receipts",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/receipts?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/receipts/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/receipts/extraction/start?api-version=1.0"
    },
    {
      "id": "purchase_orders",
      "name": "Purchase Orders",
      "documentTypeId": "purchase_orders",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/purchase_orders?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/purchase_orders/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/purchase_orders/extraction/start?api-version=1.0"
    },
    {
      "id": "utility_bills",
      "name": "Utility Bills",
      "documentTypeId": "utility_bills",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/utility_bills?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/utility_bills/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/utility_bills/extraction/start?api-version=1.0"
    },
    {
      "id": "id_cards",
      "name": "ID Cards",
      "documentTypeId": "id_cards",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/id_cards?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/id_cards/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/id_cards/extraction/start?api-version=1.0"
    },
    {
      "id": "passports",
      "name": "Passports",
      "documentTypeId": "passports",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/passports?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/passports/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/passports/extraction/start?api-version=1.0"
    },
    {
      "id": "remittance_advices",
      "name": "Remittance Advices",
      "documentTypeId": "remittance_advices",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/remittance_advices?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/remittance_advices/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/remittance_advices/extraction/start?api-version=1.0"
    },
    {
      "id": "w2",
      "name": "W2",
      "documentTypeId": "w2",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w2?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w2/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w2/extraction/start?api-version=1.0"
    },
    {
      "id": "w9",
      "name": "W9",
      "documentTypeId": "w9",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w9?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w9/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/w9/extraction/start?api-version=1.0"
    },
    {
      "id": "bills_of_lading",
      "name": "Bills Of Lading",
      "documentTypeId": "bills_of_lading",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bills_of_lading?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bills_of_lading/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bills_of_lading/extraction/start?api-version=1.0"
    },
    {
      "id": "acord125",
      "name": "ACORD 125",
      "documentTypeId": "acord125",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord125?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord125/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord125/extraction/start?api-version=1.0"
    },
    {
      "id": "i9",
      "name": "I9",
      "documentTypeId": "i9",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/i9?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/i9/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/i9/extraction/start?api-version=1.0"
    },
    {
      "id": "4506t",
      "name": "4506T",
      "documentTypeId": "4506t",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/4506t?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/4506t/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/4506t/extraction/start?api-version=1.0"
    },
    {
      "id": "fm1003",
      "name": "FM1003 (Preview)",
      "documentTypeId": "fm1003",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/fm1003?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/fm1003/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/fm1003/extraction/start?api-version=1.0"
    },
    {
      "id": "acord25",
      "name": "ACORD 25",
      "documentTypeId": "acord25",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord25?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord25/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord25/extraction/start?api-version=1.0"
    },
    {
      "id": "1040",
      "name": "1040",
      "documentTypeId": "1040",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040/extraction/start?api-version=1.0"
    },
    {
      "id": "1040_schedule_c",
      "name": "1040 Schedule C (Preview)",
      "documentTypeId": "1040_schedule_c",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_c?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_c/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_c/extraction/start?api-version=1.0"
    },
    {
      "id": "1040_schedule_d",
      "name": "1040 Schedule D (Preview)",
      "documentTypeId": "1040_schedule_d",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_d?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_d/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_d/extraction/start?api-version=1.0"
    },
    {
      "id": "1040_schedule_e",
      "name": "1040 Schedule E (Preview)",
      "documentTypeId": "1040_schedule_e",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_e?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_e/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040_schedule_e/extraction/start?api-version=1.0"
    },
    {
      "id": "checks",
      "name": "Checks",
      "documentTypeId": "checks",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/checks?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/checks/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/checks/extraction/start?api-version=1.0"
    },
    {
      "id": "bank_statements",
      "name": "Bank Statements",
      "documentTypeId": "bank_statements",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bank_statements?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bank_statements/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/bank_statements/extraction/start?api-version=1.0"
    },
    {
      "id": "financial_statements",
      "name": "Financial Statements",
      "documentTypeId": "financial_statements",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/financial_statements?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/financial_statements/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/financial_statements/extraction/start?api-version=1.0"
    },
    {
      "id": "packing_lists",
      "name": "Packing Lists",
      "documentTypeId": "packing_lists",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/packing_lists?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/packing_lists/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/packing_lists/extraction/start?api-version=1.0"
    },
    {
      "id": "acord131",
      "name": "ACORD 131",
      "documentTypeId": "acord131",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord131?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord131/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord131/extraction/start?api-version=1.0"
    },
    {
      "id": "acord126",
      "name": "ACORD 126",
      "documentTypeId": "acord126",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord126?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord126/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord126/extraction/start?api-version=1.0"
    },
    {
      "id": "acord140",
      "name": "ACORD 140",
      "documentTypeId": "acord140",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord140?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord140/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/acord140/extraction/start?api-version=1.0"
    },
    {
      "id": "vehicle_titles",
      "name": "Vehicle Titles",
      "documentTypeId": "vehicle_titles",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/vehicle_titles?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/vehicle_titles/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/vehicle_titles/extraction/start?api-version=1.0"
    },
    {
      "id": "certificates_incorporation",
      "name": "Certificate of incorporation",
      "documentTypeId": "certificates_incorporation",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_incorporation?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_incorporation/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_incorporation/extraction/start?api-version=1.0"
    },
    {
      "id": "certificates_origin",
      "name": "Certificate of origin",
      "documentTypeId": "certificates_origin",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_origin?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_origin/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/certificates_origin/extraction/start?api-version=1.0"
    },
    {
      "id": "children_product_certificates",
      "name": "Children product certificate",
      "documentTypeId": "children_product_certificates",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/children_product_certificates?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/children_product_certificates/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/children_product_certificates/extraction/start?api-version=1.0"
    },
    {
      "id": "cms1500",
      "name": "cms1500",
      "documentTypeId": "cms1500",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/cms1500?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/cms1500/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/cms1500/extraction/start?api-version=1.0"
    },
    {
      "id": "eu_declaration_conformity",
      "name": "EU declaration of conformity",
      "documentTypeId": "eu_declaration_conformity",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/eu_declaration_conformity?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/eu_declaration_conformity/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/eu_declaration_conformity/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices_shipping",
      "name": "Invoices shipping",
      "documentTypeId": "invoices_shipping",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_shipping?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_shipping/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_shipping/extraction/start?api-version=1.0"
    },
    {
      "id": "payslips",
      "name": "payslips",
      "documentTypeId": "payslips",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/payslips?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/payslips/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/payslips/extraction/start?api-version=1.0"
    },
    {
      "id": "ub04",
      "name": "UB04 (Preview)",
      "documentTypeId": "ub04",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/ub04?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/ub04/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/ub04/extraction/start?api-version=1.0"
    },
    {
      "id": "1040x",
      "name": "1040X (Preview)",
      "documentTypeId": "1040x",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040x?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040x/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/1040x/extraction/start?api-version=1.0"
    },
    {
      "id": "941x",
      "name": "941X (Preview)",
      "documentTypeId": "941x",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/941x?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/941x/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/941x/extraction/start?api-version=1.0"
    },
    {
      "id": "709",
      "name": "709 (Preview)",
      "documentTypeId": "709",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/709?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/709/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/709/extraction/start?api-version=1.0"
    },
    {
      "id": "3949a",
      "name": "3949A (Preview)",
      "documentTypeId": "3949a",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/3949a?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/3949a/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/3949a/extraction/start?api-version=1.0"
    },
    {
      "id": "9465",
      "name": "9465 (Preview)",
      "documentTypeId": "9465",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/9465?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/9465/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/9465/extraction/start?api-version=1.0"
    },
    {
      "id": "invoices_hebrew",
      "name": "Invoices Hebrew (Preview)",
      "documentTypeId": "invoices_hebrew",
      "status": "Available",
      "detailsUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_hebrew?api-version=1.0",
      "syncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_hebrew/extraction?api-version=1.0",
      "asyncUrl": "https://govcloud.uipath.us:443/09bb7221-d194-4fad-995d-b445aed6ca66/48e48d41-bfd1-4fd8-9f33-960349fab185/du_/api/framework/projects/00000000-0000-0000-0000-000000000000/extractors/invoices_hebrew/extraction/start?api-version=1.0"
    }
  ]
}
```
