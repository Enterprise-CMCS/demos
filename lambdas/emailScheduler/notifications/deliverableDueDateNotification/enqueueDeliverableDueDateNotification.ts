import { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { SQSClient } from "@aws-sdk/client-sqs";
import { log } from "../../log";
import { getDeliverableData, ReminderStage, REMINDER_STAGES } from "./getDeliverableData";
import { getRecipients, Recipient } from "./getRecipients";
import { createEmailNotificationRecord, Payload } from "./createEmailNotificationRecord";
import { sendSqsNotification, Envelope } from "./sendSqsNotification";

export const enqueueDeliverableDueDateNotification = async (
  client: PoolClient,
  sqsClient: SQSClient
) => {
  for (const reminderStage of REMINDER_STAGES) {
    await sendDeliverableDueDateNotification(client, sqsClient, reminderStage);
  }
};

const sendDeliverableDueDateNotification = async (
  client: PoolClient,
  sqsClient: SQSClient,
  reminderStage: ReminderStage
) => {
  const deliverableResults = await getDeliverableData(client, reminderStage);

  for (const deliverable of deliverableResults) {
    let recipients: Recipient[];
    try {
      recipients = await getRecipients(client, deliverable.id);
    } catch (error) {
      log.error(
        {
          deliverableId: deliverable.id,
          reminderStage,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to query recipients for deliverable due date notification"
      );
      continue;
    }

    if (recipients.length === 0) {
      log.error(
        { deliverableId: deliverable.id, reminderStage },
        "no recipients found for deliverable due date notification."
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
        name: deliverable.demonstration_name,
        stateId: deliverable.state_id,
      },
      deliverable: {
        id: deliverable.id,
        name: deliverable.name,
        deliverableTypeId: deliverable.deliverable_type_id,
        dueDate: deliverable.due_date,
        statusId: deliverable.status_id,
      },
      reminderStage,
    };

    const emailNotificationId = randomUUID();
    try {
      await createEmailNotificationRecord(client, emailNotificationId, payload, recipients);
    } catch (error) {
      log.error(
        {
          deliverableId: payload.deliverable.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to create deliverable due date email notification"
      );
      continue;
    }

    const envelope: Envelope = {
      emailNotificationId,
      emailType: "Deliverable Due Date Reminder",
      entityType: "deliverable",
      entityId: deliverable.id,
      idempotencyKey: `deliverable-due-date-reminder:${deliverable.id}:${deliverable.due_date}`,
      payload,
    };

    try {
      await sendSqsNotification(client, sqsClient, emailNotificationId, envelope);
    } catch (error) {
      log.error(
        {
          deliverableId: deliverable.id,
          emailNotificationId,
          reminderStage,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to send deliverable due date notification"
      );
    }
  }
};
