import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";
import { ReminderStage } from "./getDeliverableData";
import { Recipient } from "./getRecipients";

export type Payload = {
  recipients: {
    to: { name: string; address: string }[];
    bcc: { name: string; address: string }[];
  };
  demonstration: {
    name: string;
    stateId: string;
  };
  deliverable: {
    id: string;
    name: string;
    deliverableTypeId: string;
    dueDate: string;
    statusId: string;
  };
  reminderStage: ReminderStage;
};

const insertEmailNotificationQuery = `INSERT INTO ${DB_SCHEMA}.email_notification (id, email_type_id, entity_type, deliverable_id, status_id, payload, updated_at)
       VALUES ($1, $2, 'deliverable', $3, 'Queued', $4, CURRENT_TIMESTAMP)`;

const insertRecipientQuery = `INSERT INTO ${DB_SCHEMA}.email_notification_recipient (email_notification_id, person_id)
         VALUES ($1, $2)`;

export const createEmailNotificationRecord = async (
  client: PoolClient,
  emailNotificationId: string,
  payload: Payload,
  recipients: Recipient[]
) => {
  try {
    await client.query("BEGIN");
    await client.query(insertEmailNotificationQuery, [
      emailNotificationId,
      "Deliverable Due Date Reminder",
      payload.deliverable.id,
      JSON.stringify(payload),
    ]);
    for (const recipient of recipients) {
      await client.query(insertRecipientQuery, [emailNotificationId, recipient.person_id]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  return emailNotificationId;
};
