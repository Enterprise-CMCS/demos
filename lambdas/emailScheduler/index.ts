import { Context, SQSEvent } from "aws-lambda";
import { als, log, reqIdChild, store } from "./log";
import { getDbPool } from "./db";
import { SQSClient } from "@aws-sdk/client-sqs";
import { enqueueDeliverableDueDateNotification } from "./notifications/deliverableDueDateNotification/enqueueDeliverableDueDateNotification";

export const EMAILER_QUEUE_URL = "http://localstack:4566/000000000000/emailer-queue";

const EMAIL_TYPES = [
  enqueueDeliverableDueDateNotification,
  // DEMONSTRATION_EXPIRATION_DATE: enqueueDemonstrationDueDateNotification(),
  // DEMONSTRATION_EXPECTED_APPROVAL_DATE: enqueueDemonstrationExpectedApprovalDateNotification(),
];

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    log.info("emailScheduler booted");

    const dbPool = await getDbPool();

    const sqsClient = new SQSClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    });

    const client = await dbPool.connect();
    try {
      for (const emailType of EMAIL_TYPES) {
        log.info({ notification: emailType.name }, "running notification");
        await emailType(client, sqsClient);
      }
    } finally {
      client.release();
    }
  });
