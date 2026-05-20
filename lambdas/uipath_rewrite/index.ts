import type { SQSEvent, SQSRecord } from "aws-lambda";
import { als, log, reqIdChild, store } from "./log";
import { prepareDocumentInput } from "./documentInput";
import { runDocumentUnderstanding } from "./documentUnderstanding";

function getFirstRecord(event: SQSEvent): SQSRecord {
  const firstRecord = event.Records[0];
  if (!firstRecord) {
    throw new Error("No SQS records provided.");
  }

  return firstRecord;
}

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    log.info({ recordCount: event.Records.length }, "UiPath lambda invoked");

    const record = getFirstRecord(event);
    reqIdChild(record.messageId);

    const documentInput = await prepareDocumentInput(record.body);
    const status = await runDocumentUnderstanding(
      {
        ...documentInput,
        requestId: record.messageId
      },
      {
        pollIntervalMs: 5000
      }
    );

    log.info("UiPath extraction completed successfully");
    return status;
  });
