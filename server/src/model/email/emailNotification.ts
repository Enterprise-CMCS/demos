import { Prisma } from "@prisma/client";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueEmail, RealtimeEmailMessage } from "../../services/emailQueue";

export type EmailNotificationRecipient = {
  personId: string;
  emailAddress: string;
};

export type EmailNotificationProvenance =
  | { deliverableActionId: string; publicCommentId?: never }
  | { deliverableActionId?: never; publicCommentId: string };

export async function enqueueTrackedRealtimeEmail(
  message: RealtimeEmailMessage,
  provenance: EmailNotificationProvenance | undefined,
  recipients: EmailNotificationRecipient[],
): Promise<string> {
  const notification = await prisma().emailNotification.create({
    data: {
      emailTypeId: message.emailType,
      entityType: message.entityType,
      ...getEntityForeignKey(message),
      deliverableActionId: provenance?.deliverableActionId,
      publicCommentId: provenance?.publicCommentId,
      triggeredByUserId: message.triggeredBy.id,
      statusId: "Pending",
      payload: message.payload as Prisma.InputJsonValue,
      recipients: {
        create: recipients.map((recipient) => ({
          personId: recipient.personId,
          emailAddress: recipient.emailAddress.trim().toLowerCase(),
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

function getEntityForeignKey(message: RealtimeEmailMessage) {
  switch (message.entityType) {
    case "deliverable":
      return { deliverableId: message.entityId };
    case "application":
      return { applicationId: message.entityId };
    case "reference":
      return { referenceId: message.entityId };
    case "reference_agreement":
      return { referenceAgreementId: message.entityId };
  }
}
