import { Prisma } from "@prisma/client";

import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueEmail, RealtimeEmailMessage } from "../../services/emailQueue";

export type EmailNotificationRecipient = {
  personId: string;
};

export async function enqueueTrackedRealtimeEmail(
  message: RealtimeEmailMessage,
  source: { deliverableActionId: string },
  recipients: EmailNotificationRecipient[],
): Promise<string> {
  const notification = await prisma().emailNotification.create({
    data: {
      emailTypeId: message.emailType,
      entityType: message.entityType,
      deliverableActionId: source.deliverableActionId,
      statusId: "Pending",
      payload: message.payload as Prisma.InputJsonValue,
      recipients: {
        create: recipients,
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
        "Failed to record email notification queue failure",
      );
    }
    throw error;
  }

  const { count } = await prisma().emailNotification.updateMany({
    where: {
      id: notification.id,
      statusId: "Pending",
    },
    data: {
      sqsMessageId: messageId,
      statusId: "Queued",
    },
  });

  if (count === 0) {
    await prisma().emailNotification.update({
      where: { id: notification.id },
      data: { sqsMessageId: messageId },
    });
  }

  return messageId;
}
