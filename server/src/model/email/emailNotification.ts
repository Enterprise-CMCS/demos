import { Prisma } from "@prisma/client";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import {
  enqueueEmail,
  RealtimeEmailEnvelope,
} from "../../services/emailQueue";

export type EmailNotificationRecipient = {
  personId?: string;
  emailAddress: string;
};

export async function enqueueTrackedRealtimeEmail(
  message: RealtimeEmailEnvelope,
  sourceActionId: string | undefined,
  recipients: EmailNotificationRecipient[]
): Promise<string> {
  const notification = await prisma().emailNotification.create({
    data: {
      emailTypeId: message.emailType,
      entityType: message.entityType,
      entityId: message.entityId,
      sourceActionId,
      triggeredByUserId: message.triggeredBy.id,
      statusId: "Pending",
      idempotencyKey: message.idempotencyKey,
      payload: message.payload as Prisma.InputJsonValue,
      recipients: {
        create: recipients.map((recipient) => ({
          personId: recipient.personId,
          emailAddress: recipient.emailAddress,
          normalizedEmail: recipient.emailAddress.trim().toLowerCase(),
        })),
      },
    },
  });

  let messageId: string;
  try {
    messageId = await enqueueEmail({
      ...message,
      emailNotificationId: notification.id,
    });
  } catch (error) {
    try {
      await prisma().emailNotification.update({
        where: { id: notification.id },
        data: {
          statusId: "Failed",
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
    } catch (trackingError) {
      log.error(
        {
          error: trackingError,
          emailNotificationId: notification.id,
        },
        "Failed to record email notification queue failure"
      );
    }
    throw error;
  }

  await prisma().emailNotification.update({
    where: { id: notification.id },
    data: {
      sqsMessageId: messageId,
    },
  });
  await prisma().emailNotification.updateMany({
    where: {
      id: notification.id,
      statusId: "Pending",
    },
    data: {
      statusId: "Queued",
    },
  });

  return messageId;
}
