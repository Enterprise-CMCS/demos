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

// Positional args: [0]=node, [1]=index.js, [2]=input file, [3]=log file
const inputFile = process.argv[2] || "ak-behavioral-health-demo-pa.pdf";
const logPath = createLogFile(process.argv[3] || process.env.LOG_FILE || "uipath.log");

const token = await getToken();
log("Got the auth token.", logPath);

log(`Using input file: ${inputFile}`, logPath);

const docId = await uploadDocument(token, inputFile);
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
