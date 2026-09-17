import { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { SQSClient } from "@aws-sdk/client-sqs";
import { log } from "../../log";
import { getApplicationData } from "./getApplicationData";
import { getRecipients, Recipient } from "./getRecipients";
import { createEmailNotificationRecord, Payload } from "./createEmailNotificationRecord";
import { sendSqsNotification, Envelope } from "../sendSqsNotification";

export const enqueueApplicationExpectedApprovalDateNotification = async (
  client: PoolClient,
  sqsClient: SQSClient
) => {
  const applicationResults = await getApplicationData(client);

  for (const application of applicationResults) {
    let recipients: Recipient[];
    try {
      recipients = await getRecipients(client, application.id);
    } catch (error) {
      log.error(
        {
          applicationId: application.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to query recipients for application expected approval date notification"
      );
      continue;
    }

    if (recipients.length === 0) {
      log.error(
        { applicationId: application.id },
        "no recipients found for application expected approval date notification."
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
      application: {
        id: application.id,
        name: application.name,
        applicationTypeId: application.application_type_id,
        expectedApprovalDate: application.expected_approval_date,
        parentDemonstrationName: application.parent_demonstration_name,
        parentDemonstrationId: application.parent_demonstration_id,
        stateId: application.state_id,
      },
    };

    const emailNotificationId = randomUUID();
    try {
      await createEmailNotificationRecord(client, emailNotificationId, payload, recipients);
    } catch (error) {
      log.error(
        {
          applicationId: payload.application.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to create application expected approval date email notification"
      );
      continue;
    }

    const envelope: Envelope<Payload> = {
      emailNotificationId,
      emailType: "Application Expected Approval Date Reminder",
      entityType: "application",
      entityId: application.id,
      idempotencyKey: `application-due-date-reminder:${application.id}:${application.expected_approval_date}`,
      payload,
    };

    try {
      await sendSqsNotification(client, sqsClient, emailNotificationId, envelope);
      log.info(
        { applicationId: application.id, emailNotificationId },
        "queued application expected approval date notification"
      );
    } catch (error) {
      log.error(
        {
          applicationId: application.id,
          emailNotificationId,
          error: error instanceof Error ? error.message : String(error),
        },
        "failed to send application expected approval date notification"
      );
    }
  }
};
