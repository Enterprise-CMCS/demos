import util from "util";
import dotenv from "dotenv";
import { getToken } from "./getToken.js";
import { uploadDocument } from "./uploadDocument.js";
import { extractDoc } from "./extractDoc.js";
import { fetchExtractionResult } from "./fetchExtractResult.js";
import { createLogFile, log } from "./logFile.js";

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const logPath = createLogFile();

const token = await getToken();
log("Got the auth token.", logPath);

const docId = await uploadDocument(token, "ak-behavioral-health-demo-pa.pdf");
log(`Document ID: ${docId}`, logPath);

const resultUrl = await extractDoc(token, docId);
log(`Result URL: ${resultUrl}`, logPath);

while (true) {
  await sleep(1 * 1000);
  let status = await fetchExtractionResult(token, resultUrl);

  if (status.status === "Succeeded") {
    log(util.inspect(status, false, null, true /* enable colors */), logPath);
    break;
  }

  log(status, logPath);
}
