import { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { SQSClient } from "@aws-sdk/client-sqs";
import { log } from "../../log";
import { getDemonstrationData, ReminderStage, REMINDER_STAGES } from "./getDemonstrationData";
import { getRecipients, Recipient } from "./getRecipients";
import { createEmailNotificationRecord, Payload } from "./createEmailNotificationRecord";
import { sendSqsNotification, Envelope } from "../sendSqsNotification";

export const enqueueDemonstrationExpirationDateNotification = async (
  client: PoolClient,
  sqsClient: SQSClient
) => {
  for (const reminderStage of REMINDER_STAGES) {
    await sendDemonstrationExpirationDateNotification(client, sqsClient, reminderStage, false);
    await sendDemonstrationExpirationDateNotification(client, sqsClient, reminderStage, true);
  }
};

const sendDemonstrationExpirationDateNotification = async (
  client: PoolClient,
  sqsClient: SQSClient,
  reminderStage: ReminderStage,
  isStateUser: boolean
) => {
  const demonstrationResults = await getDemonstrationData(client, reminderStage);

  if (demonstrationResults.length === 0) {
    log.info(
      { reminderStage, isStateUser },
      "no applicable demonstrations found for demonstration expiration date notification"
    );
    return;
  }

  for (const demonstration of demonstrationResults) {
    let recipients: Recipient[];
    try {
      recipients = await getRecipients(client, demonstration.id, isStateUser);
    } catch (error) {
      log.error(
        {
          demonstrationId: demonstration.id,
          reminderStage,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to query recipients for demonstration expiration date notification"
      );
      continue;
    }

    if (recipients.length === 0) {
      log.error(
        { demonstrationId: demonstration.id, reminderStage },
        "no recipients found for demonstration expiration date notification."
      );
      continue;
    }

    const payload: Payload = {
      recipients: {
        to: [],
        bcc: recipients.map(({ first_name, last_name, email }) => ({
          name: `${first_name} ${last_name}`,
          address: email,
        })),
      },
      demonstration: {
        id: demonstration.id,
        name: demonstration.name,
        stateId: demonstration.state_id,
        expirationDate: demonstration.expiration_date,
      },
      reminderStage,
      isStateUser,
    };

    const emailNotificationId = randomUUID();
    try {
      await createEmailNotificationRecord(client, emailNotificationId, payload, recipients);
    } catch (error) {
      log.error(
        {
          demonstrationId: payload.demonstration.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to create demonstration expiration date email notification"
      );
      continue;
    }

    const envelope: Envelope<Payload> = {
      emailNotificationId,
      emailType: "Demonstration Expiration Date Reminder",
      entityType: "demonstration",
      entityId: demonstration.id,
      idempotencyKey: `demonstration-due-date-reminder:${demonstration.id}:${demonstration.expiration_date}`,
      payload,
    };

    try {
      await sendSqsNotification(client, sqsClient, emailNotificationId, envelope);
      log.info(
        { demonstrationId: demonstration.id, emailNotificationId, reminderStage },
        "queued demonstration expiration date notification"
      );
    } catch (error) {
      log.error(
        {
          demonstrationId: demonstration.id,
          emailNotificationId,
          reminderStage,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to send demonstration expiration date notification"
      );
    }
  }
};
