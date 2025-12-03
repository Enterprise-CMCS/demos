import util from "node:util";
import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface RunDocumentUnderstandingOptions {
  token?: string;
  logFullResult?: boolean;
  pollIntervalMs?: number;
  maxAttempts?: number;
}

export async function runDocumentUnderstanding(
  inputFile: string,
  options: RunDocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const {
    token: providedToken,
    pollIntervalMs = 1000,
    maxAttempts = 5000,
    logFullResult = true,
  } = options;

  const token = providedToken ?? (await getToken());
  log.info("Got auth token.");

  const docId = await uploadDocument(token, inputFile);
  log.info({ docId }, "Uploaded document.");

  const resultUrl = await extractDoc(token, docId);
  log.info({ resultUrl }, "Started extraction.");

  let attempt = 0;
  console.log(attempt < maxAttempts);
  while (attempt < maxAttempts) {
    await sleep(1 * 1000); // getting this to work before adding back in the pollIntervalMs
    const status = await fetchExtractionResult(token, resultUrl);

    if (status.status === "Succeeded") {
      if (logFullResult) {
        log.info(util.inspect(status, false, null, true));
      } else {
        log.info({ status }, "UiPath extraction succeeded");
      }
      return status;
    }

    log.info({ status, attempt, pollIntervalMs }, "Extraction still running");
    attempt += 1;
  }

  throw new Error("UiPath extraction did not succeed within the configured attempts.");
}
