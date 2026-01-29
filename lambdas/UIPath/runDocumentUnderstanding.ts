import util from "node:util";
import { randomUUID } from "node:crypto";
import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";
import { getDbPool, getDbSchema } from "./db";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface RunDocumentUnderstandingOptions {
  token?: string;
  logFullResult?: boolean;
  pollIntervalMs?: number;
  maxAttempts?: number;
  requestId?: string;
}

export async function runDocumentUnderstanding(
  inputFile: string,
  options: RunDocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const {
    token: providedToken,
    pollIntervalMs = 3000,
    maxAttempts = 500, // Just to put SOME kinda limit on it. DO not want it just running FOREVER!
    logFullResult = true,
    requestId = "n/a",
  } = options;

  const token = providedToken ?? (await getToken());
  log.info("Got auth token.");

  const docId = await uploadDocument(token, inputFile);
  log.info({ docId }, "Uploaded document.");

  const resultUrl = await extractDoc(token, docId);
  log.info({ resultUrl }, "Started extraction.");

  let attempt = 0;
  while (attempt < maxAttempts) {
    await sleep(pollIntervalMs);
    const status = await fetchExtractionResult(token, resultUrl);

    if (status.status === "Succeeded") {
      const pool = await getDbPool();
      const client = await pool.connect();
      try {
        const schema = getDbSchema();
        await client.query(
          `insert into ${schema}.uipath_result (id, request_id, response) values ($1, $2, $3::jsonb)`,
          [randomUUID(), requestId, JSON.stringify(status)]
        );
        if (logFullResult) {
          log.info(util.inspect(status, false, null, true));
        } else {
          log.info({ status }, "UiPath extraction succeeded");
        }
      } finally {
        client.release();
      }
      return status;
    }

    log.info({ status, attempt, pollIntervalMs }, "Extraction still running");
    attempt += 1;
  }

  throw new Error("UiPath extraction did not succeed within the configured attempts.");
}
