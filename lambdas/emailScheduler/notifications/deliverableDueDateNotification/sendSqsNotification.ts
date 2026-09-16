import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";
import { Payload } from "./createEmailNotificationRecord";

export type Envelope = {
  emailNotificationId: string;
  emailType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  payload: Payload;
};

export const UPDATE_SQS_MESSAGE_ID_QUERY = `UPDATE ${DB_SCHEMA}.email_notification SET sqs_message_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;

export const UPDATE_EMAIL_NOTIFICATION_FAILED_QUERY = `UPDATE ${DB_SCHEMA}.email_notification SET status_id = 'Failed', last_error = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;

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
        QueueUrl: process.env.EMAILER_QUEUE_URL,
        MessageBody: JSON.stringify(envelope),
      })
    );
  } catch (error) {
    await client.query(UPDATE_EMAIL_NOTIFICATION_FAILED_QUERY, [
      emailNotificationId,
      error instanceof Error ? error.message : String(error),
    ]);
    throw error;
  }

  await client.query(UPDATE_SQS_MESSAGE_ID_QUERY, [emailNotificationId, response.MessageId]);
};
