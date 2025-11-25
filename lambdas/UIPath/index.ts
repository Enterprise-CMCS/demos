import { SQSEvent } from "aws-lambda";
import { log, reqIdChild, als, store } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult } from "./fetchExtractResult";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface UipathMessage {
  s3Key: string;
}

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    const firstRecord = event.Records[0];
    reqIdChild(firstRecord?.messageId ?? "n/a");

    const parsedBody = firstRecord?.body ? (JSON.parse(firstRecord.body) as Partial<UipathMessage>) : null;
    const inputFile = parsedBody?.s3Key; // adapt to your trigger
    if (!inputFile) {
      throw new Error("Missing s3Key in SQS message body.");
    }

    const token = await getToken();
    const docId = await uploadDocument(token, inputFile);
    const resultUrl = await extractDoc(token, docId);

    for (let delay = 5000; ; delay = Math.min(delay * 2, 30000)) {
      await sleep(delay);
      const status = await fetchExtractionResult(token, resultUrl);
      if (status.status === "Succeeded") {
        log.info({ status }, "UiPath extraction succeeded");
        return status;
      }
      log.info({ status }, "UiPath extraction still running");
    }
  });
