import { PoolClient } from "pg";
import { DB_SCHEMA } from "../../db";
import { ReminderStage } from "./getDemonstrationData";
import { Recipient } from "./getRecipients";

export type Payload = {
  recipients: {
    to: { name: string; address: string }[];
    bcc: { name: string; address: string }[];
  };
  demonstration: {
    id: string;
    name: string;
    stateId: string;
    expirationDate: string;
  };
  reminderStage: ReminderStage;
  isStateUser: boolean;
};

export const INSERT_EMAIL_NOTIFICATION_QUERY = `
  INSERT INTO ${DB_SCHEMA}.email_notification (
    id, 
    email_type_id, 
    entity_type,
    application_id,
    application_type_id,
    status_id,
    payload,
    updated_at
  )
  VALUES (
    $1, 
    $2, 
    'demonstration', 
    $3, 
    'Demonstration',
    'Queued', 
    $4, 
    CURRENT_TIMESTAMP
  )
`;

export const INSERT_RECIPIENT_QUERY = `INSERT INTO ${DB_SCHEMA}.email_notification_recipient (email_notification_id, person_id)
         VALUES ($1, $2)`;

export const createEmailNotificationRecord = async (
  client: PoolClient,
  emailNotificationId: string,
  payload: Payload,
  recipients: Recipient[]
) => {
  try {
    await client.query("BEGIN");
    await client.query(INSERT_EMAIL_NOTIFICATION_QUERY, [
      emailNotificationId,
      "Demonstration Expiration Date Reminder",
      payload.demonstration.id,
      JSON.stringify(payload),
    ]);
    for (const recipient of recipients) {
      await client.query(INSERT_RECIPIENT_QUERY, [emailNotificationId, recipient.person_id]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  return emailNotificationId;
};
