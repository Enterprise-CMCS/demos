import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SQSEvent } from "aws-lambda";
import { log, reqIdChild, als, store } from "./log";
import { runDocumentUnderstanding } from "./runDocumentUnderstanding";

interface UipathMessage {
  s3Key: string;
}

const isLocal = () =>
  process.env.RUN_LOCAL === "true" ||
  process.env.ENVIRONMENT === "local" ||
  (!process.env.AWS_EXECUTION_ENV && !process.env.AWS_LAMBDA_FUNCTION_NAME);

async function runLocal() {
  const inputFile = process.env.INPUT_FILE ?? "ak-behavioral-health-demo-pa.pdf";
  reqIdChild("local-run");

  const status = await runDocumentUnderstanding(inputFile, {
    initialDelayMs: 1_000,
    maxDelayMs: 8_000,
    logFullResult: true,
  });

  log.info({ status }, "UiPath extraction completed (local)");
  return status;
}

const isDirectRun = () => {
  const currentPath = fileURLToPath(import.meta.url);
  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return currentPath === invokedPath;
};

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    if (isLocal()) {
      return runLocal();
    }

    const firstRecord = event.Records[0];
    reqIdChild(firstRecord?.messageId ?? "n/a");

    const parsedBody = firstRecord?.body ? (JSON.parse(firstRecord.body) as Partial<UipathMessage>) : null;
    const inputFile = parsedBody?.s3Key;
    if (!inputFile) {
      throw new Error("Missing s3Key in SQS message body.");
    }

    const status = await runDocumentUnderstanding(inputFile, {
      initialDelayMs: 5_000,
      maxDelayMs: 30_000,
      logFullResult: false,
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  });

if (isDirectRun() && isLocal()) {
  await als.run(store, async () => {
    try {
      await runLocal();
    } catch (err) {
      log.error({ err }, "Local execution failed");
      process.exitCode = 1;
    }
  });
}
