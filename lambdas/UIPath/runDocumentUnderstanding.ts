import util from "node:util";
import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface BackoffConfig {
  initialDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
}

export interface RunDocumentUnderstandingOptions extends BackoffConfig {
  token?: string;
  logFullResult?: boolean;
}

export async function runDocumentUnderstanding(
  inputFile: string,
  options: RunDocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const {
    token: providedToken,
    initialDelayMs = 1_000,
    maxDelayMs = 30_000,
    maxAttempts = Infinity,
    logFullResult = true,
  } = options;

  const token = providedToken ?? (await getToken());
  log.info("Got auth token.");

  const docId = await uploadDocument(token, inputFile);
  log.info({ docId }, "Uploaded document.");

  const resultUrl = await extractDoc(token, docId);
  log.info({ resultUrl }, "Started extraction.");

  let attempt = 0;
  let delayMs = initialDelayMs;

  while (attempt < maxAttempts) {
    await sleep(delayMs);
    const status = await fetchExtractionResult(token, resultUrl);

    if (status.status === "Succeeded") {
      if (logFullResult) {
        log.info(util.inspect(status, false, null, true));
      } else {
        log.info({ status }, "UiPath extraction succeeded");
      }
      return status;
    }

    log.info({ status, attempt, delayMs }, "Extraction still running");
    delayMs = Math.min(delayMs * 2, maxDelayMs);
    attempt += 1;
  }

  throw new Error("UiPath extraction did not succeed within the configured attempts.");
}
