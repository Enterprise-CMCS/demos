import { GetQueueUrlCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

import { PRIMARY_AWS_REGION } from "../constants";
import { log } from "../log";
import { prisma } from "../prismaClient";

export type RealtimeEmailType =
  | "Deliverable Created"
  | "Deliverable Submitted"
  | "Deliverable Accepted"
  | "Deliverable Approved"
  | "Deliverable Received and Filed"
  | "Extension Decision Made"
  | "Resubmission Requested";

export type RealtimeEmailMessage = {
  emailType: RealtimeEmailType;
  entityType: "deliverable";
  entityId: string;
  triggeredBy: {
    type: "realtime";
    id: string;
  };
  payload: object;
};

export type EmailQueueMessage = RealtimeEmailMessage & {
  emailNotificationId: string;
};

type QueueTransactionResult =
  | { status: "queued"; messageId: string }
  | { status: "failed"; error: unknown };

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

export async function enqueueEmail(message: EmailQueueMessage): Promise<string> {
  const emailNotificationId = message.emailNotificationId;
  const result = await prisma().$transaction(
    async (tx): Promise<QueueTransactionResult> => {
      await tx.emailNotification.update({
        where: { id: emailNotificationId },
        data: { statusId: "Queued" },
      });

      let messageId: string;
      try {
        messageId = await sendEmailMessage(message);
      } catch (queueError) {
        try {
          await tx.emailNotification.update({
            where: { id: emailNotificationId },
            data: {
              statusId: "Failed",
              lastError:
                queueError instanceof Error ? queueError.message : String(queueError),
            },
          });
        } catch (trackingError) {
          log.error(
            {
              error: trackingError,
              emailNotificationId,
            },
            "Failed to record email notification queue failure"
          );
          throw queueError;
        }

        return { status: "failed", error: queueError };
      }

      await tx.emailNotification.update({
        where: { id: emailNotificationId },
        data: { sqsMessageId: messageId },
      });

      return { status: "queued", messageId };
    }
  );

  if (result.status === "failed") {
    throw result.error;
  }

  return result.messageId;
}

async function sendEmailMessage(message: EmailQueueMessage): Promise<string> {
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
