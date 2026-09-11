import { Prisma } from "@prisma/client";

import { log } from "../../log";
import { prisma } from "../../prismaClient";
import {
  emailNotificationsDisabled,
  enqueueEmail,
  RealtimeEmailMessage,
} from "../../services/emailQueue";

export type EmailNotificationRecipient = {
  personId: string;
};

export async function enqueueAndTrackRealtimeEmail(
  message: RealtimeEmailMessage,
  source: { deliverableActionId: string },
  recipients: EmailNotificationRecipient[]
): Promise<string | null> {
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

  return enqueueEmail({
    ...message,
    emailNotificationId: notification.id,
  });
}
