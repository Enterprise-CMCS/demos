import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { PoolClient } from "pg";
import { EMAILER_QUEUE_URL } from "../..";
import { DB_SCHEMA } from "../../db";
import { log } from "../../log";
import { Payload } from "./createEmailNotificationRecord";

export type Envelope = {
  emailNotificationId: string;
  emailType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  payload: Payload;
};

const updateSqsMessageIdQuery = `UPDATE ${DB_SCHEMA}.email_notification SET sqs_message_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;

const updateEmailNotificationFailed = `UPDATE ${DB_SCHEMA}.email_notification SET status_id = 'Failed', last_error = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;

export const sendSqsNotification = async (
  client: PoolClient,
  sqsClient: SQSClient,
  emailNotificationId: string,
  envelope: Envelope
) => {
  let response;
  try {
    response = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: EMAILER_QUEUE_URL,
        MessageBody: JSON.stringify(envelope),
      })
    );
  } catch (error) {
    await client.query(updateEmailNotificationFailed, [
      emailNotificationId,
      error instanceof Error ? error.message : String(error),
    ]);
    throw error;
  }

  await client.query(updateSqsMessageIdQuery, [emailNotificationId, response.MessageId]);

  log.info({ emailNotificationId }, "queued deliverable due date notification");
};
