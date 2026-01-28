import util from "util";
import dotenv from "dotenv";
import { getToken } from "./getToken.js";
import { uploadDocument } from "./uploadDocument.js";
import { extractDoc } from "./extractDoc.js";
import { fetchExtractionResult } from "./fetchExtractResult.js";
import { createLogFile, log } from "./logFile.js";
import {
  getProjectId,
  getExtractorId,
  getExtractorGuid
} from "./uipathClient.js";

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Positional args: [0]=node, [1]=index.js - `node index.js` to run!
const inputFile = "test_uipath.pdf";
const logPath = createLogFile("uipath.log");

if (! inputFile) {
  throw new Error("Input file is required");
}

log("Running on file: ", inputFile);

try {
  // Validate required env early to avoid undefined IDs in URLs
  getProjectId();
  getExtractorId();
  getExtractorGuid();

  const token = await getToken();
  if (!token) {
    throw new Error("No auth token received.");
  }
  log("Got the auth token.", logPath);

  log(`Using input file: ${inputFile}`, logPath);

  const docId = await uploadDocument(token, inputFile);
  if (!docId || typeof docId !== "string") {
    log(`Upload returned unexpected response: ${util.inspect(docId)}`, logPath);
    throw new Error("Upload failed or returned invalid document ID.");
  }
  log(`Document ID: ${docId}`, logPath);

  const resultUrl = await extractDoc(token, docId);
  if (!resultUrl || typeof resultUrl !== "string") {
    log(`Extraction start returned unexpected response: ${util.inspect(resultUrl)}`, logPath);
    throw new Error("Extraction start failed or returned invalid result URL.");
  }
  log(`Result URL: ${resultUrl}`, logPath);

  let delayMs = 3_000;

  while (true) {
    await sleep(delayMs);
    let status = await fetchExtractionResult(token, resultUrl);

    if (status.status === "Succeeded") {
      log(util.inspect(status, false, null, true /* enable colors */), logPath);
      break;
    }

    log(status, logPath);
  }
} catch (error) {
  log(`Fatal error: ${error.message}`, logPath);
  if (error.response?.data) {
    log(`Response data: ${JSON.stringify(error.response.data)}`, logPath);
  }
  throw error;
}
