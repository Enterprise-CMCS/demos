import { GetQueueUrlCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

import { PRIMARY_AWS_REGION } from "../constants";
import { log } from "../log";
import { prisma } from "../prismaClient";

export type RealtimeEmailMessage = {
  emailNotificationId?: string;
  emailType: "Deliverable Created";
  entityType: "deliverable";
  entityId: string;
  triggeredBy: {
    type: "realtime";
    id: string;
  };
  payload: object;
};

const sqsClient = new SQSClient(
  process.env.AWS_ENDPOINT_URL
    ? {
        region: PRIMARY_AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT_URL,
      }
    : { region: PRIMARY_AWS_REGION }
);

let cachedQueueUrl: string | undefined;

async function getQueueUrl(): Promise<string> {
  const configuredQueueUrl = process.env.EMAILER_QUEUE_URL?.trim();
  if (configuredQueueUrl) {
    return configuredQueueUrl;
  }

  if (cachedQueueUrl) {
    return cachedQueueUrl;
  }

  const queueName = process.env.EMAILER_QUEUE_NAME?.trim() || "emailer-queue";
  const response = await sqsClient.send(
    new GetQueueUrlCommand({
      QueueName: queueName,
    })
  );
  if (!response.QueueUrl) {
    throw new Error(`Failed to resolve emailer queue URL: ${queueName}`);
  }

  cachedQueueUrl = response.QueueUrl;
  return cachedQueueUrl;
}

export async function enqueueEmail(message: RealtimeEmailMessage): Promise<string | null> {
  if (emailNotificationsDisabled()) {
    log.info(
      {
        emailType: message.emailType,
        entityId: message.entityId,
      },
      "Email notification skipped because notifications are disabled"
    );
    return null;
  }

  const emailNotificationId = message.emailNotificationId;
  if (!emailNotificationId) {
    return sendEmailMessage(message);
  }

  let messageId: string | undefined;
  let queueFailure: { error: unknown } | undefined;

  try {
    await prisma().$transaction(async (tx) => {
      await tx.emailNotification.update({
        where: { id: emailNotificationId },
        data: { statusId: "Queued" },
      });

      let queuedMessageId: string;
      try {
        queuedMessageId = await sendEmailMessage(message);
      } catch (error) {
        queueFailure = { error };
        await tx.emailNotification.update({
          where: { id: emailNotificationId },
          data: {
            statusId: "Failed",
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
        return;
      }

      messageId = queuedMessageId;
      await tx.emailNotification.update({
        where: { id: emailNotificationId },
        data: { sqsMessageId: queuedMessageId },
      });
    });
  } catch (error) {
    if (queueFailure) {
      log.error(
        {
          error,
          emailNotificationId,
        },
        "Failed to record email notification queue failure"
      );
      throw queueFailure.error;
    }
    throw error;
  }

  if (queueFailure) {
    throw queueFailure.error;
  }
  if (!messageId) {
    throw new Error("Email queue transaction completed without a message ID.");
  }

  return messageId;
}

async function sendEmailMessage(message: RealtimeEmailMessage): Promise<string> {
  const queueUrl = await getQueueUrl();
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );
  if (!response.MessageId) {
    throw new Error("Failed to enqueue email: SQS did not return a message ID.");
  }

  log.info(
    {
      messageId: response.MessageId,
      emailType: message.emailType,
      entityId: message.entityId,
    },
    "Email queued"
  );
  return response.MessageId;
}

export function emailNotificationsDisabled(): boolean {
  return process.env.DISABLE_EMAIL_NOTIFICATIONS === "true";
}
