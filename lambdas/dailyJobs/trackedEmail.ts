import type { Pool, PoolClient } from "pg";

import { getDbSchema } from "./db";
import { enqueueEmail } from "./emailQueue";
import { log } from "./log";

export type TrackedEmailRecipient = {
  personId: string;
  name: string;
  address: string;
};

type TrackedEmailInput = {
  emailType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  scheduledAt: Date;
  jobId: string;
  payload: object;
  recipients: TrackedEmailRecipient[];
};

export type EnqueueTrackedEmailResult = "queued" | "skipped";

async function createNotification(
  client: PoolClient,
  input: TrackedEmailInput
): Promise<string | null> {
  const schema = getDbSchema();
  await client.query("BEGIN");

  try {
    const notification = await client.query<{ id: string }>(
      `INSERT INTO ${schema}.email_notification (
         id,
         email_type_id,
         entity_type,
         entity_id,
         source_action_id,
         triggered_by_user_id,
         status_id,
         idempotency_key,
         payload,
         created_at,
         updated_at
       )
       VALUES (
         gen_random_uuid(), $1, $2, $3::UUID, NULL, NULL, 'Pending', $4, $5::JSONB,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [
        input.emailType,
        input.entityType,
        input.entityId,
        input.idempotencyKey,
        JSON.stringify(input.payload),
      ]
    );
    const notificationId = notification.rows[0]?.id ?? null;

    if (notificationId) {
      for (const recipient of input.recipients) {
        await client.query(
          `INSERT INTO ${schema}.email_notification_recipient (
             id, email_notification_id, person_id, email_address, normalized_email, created_at
           )
           VALUES (gen_random_uuid(), $1::UUID, $2::UUID, $3, $4, CURRENT_TIMESTAMP)`,
          [
            notificationId,
            recipient.personId,
            recipient.address,
            recipient.address.trim().toLowerCase(),
          ]
        );
      }
    }

    await client.query("COMMIT");
    return notificationId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function recordQueueFailure(
  pool: Pool,
  notificationId: string,
  error: unknown
): Promise<void> {
  const schema = getDbSchema();
  const message = error instanceof Error ? error.message : String(error);

  try {
    await pool.query(
      `UPDATE ${schema}.email_notification
       SET status_id = 'Failed', last_error = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::UUID`,
      [notificationId, message]
    );
  } catch (trackingError) {
    log.error(
      { error: trackingError, emailNotificationId: notificationId },
      "Failed to record scheduled email queue failure"
    );
  }
}

export async function enqueueTrackedEmail(
  pool: Pool,
  input: TrackedEmailInput
): Promise<EnqueueTrackedEmailResult> {
  const client = await pool.connect();
  let notificationId: string | null;

  try {
    notificationId = await createNotification(client, input);
  } finally {
    client.release();
  }

  if (!notificationId) {
    return "skipped";
  }

  let messageId: string;
  try {
    messageId = await enqueueEmail({
      emailNotificationId: notificationId,
      emailType: input.emailType,
      entityType: input.entityType,
      entityId: input.entityId,
      triggeredBy: {
        type: "scheduled",
        id: input.jobId,
      },
      triggeredAt: input.scheduledAt.toISOString(),
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    });
  } catch (error) {
    await recordQueueFailure(pool, notificationId, error);
    throw error;
  }

  const schema = getDbSchema();
  const result = await pool.query(
    `UPDATE ${schema}.email_notification
     SET status_id = 'Queued', sqs_message_id = $2, last_error = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::UUID`,
    [notificationId, messageId]
  );

  if (result.rowCount !== 1) {
    throw new Error(`Email notification not found after queueing: ${notificationId}`);
  }

  return "queued";
}
