import util from "util";
import dotenv from "dotenv";
import { getToken } from "./getToken.js";
import { uploadDocument } from "./uploadDocument.js";
import { extractDoc } from "./extractDoc.js";
import { fetchExtractionResult } from "./fetchExtractResult.js";

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const token = await getToken();
console.log("Got the auth token.");

const docId = await uploadDocument(token, "ak-behavioral-health-demo-pa.pdf");
console.log(`Document ID: ${docId}`);

const resultUrl = await extractDoc(token, docId);
console.log(`Result URL: ${resultUrl}`);

while (true) {
  await sleep(1 * 1000);  
  let status = await fetchExtractionResult(token, resultUrl);

  if (status.status === "Succeeded") {
    console.log(util.inspect(status, false, null, true /* enable colors */));
    break;
  }

  console.log(status);
}
