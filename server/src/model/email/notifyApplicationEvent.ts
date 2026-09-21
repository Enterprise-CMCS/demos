import { z } from "zod";

import { CMS_USER_DEMONSTRATION_ROLES } from "../../constants";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { PrismaApplication } from "../application";
import { enqueueAndTrackRealtimeEmail } from "./emailNotification";
import { ApplicationType } from "../../types";

type ApplicationEmailType = "Application Status Updated";

export async function notifyApplicationStatusUpdated(
  previousApplication: PrismaApplication,
  application: PrismaApplication,
  triggeredByUserId: string
): Promise<void> {
  if (previousApplication.statusId !== application.statusId) {
    await notifyApplicationEvent(application, "Application Status Updated", triggeredByUserId);
  }
}

async function notifyApplicationEvent(
  application: PrismaApplication,
  emailType: ApplicationEmailType,
  triggeredByUserId: string
): Promise<void> {
  try {
    // casting allowed due to db constraints
    const applicationType: ApplicationType = application.applicationTypeId as ApplicationType;
    const demonstration = await prisma().demonstration.findUniqueOrThrow({
      where: {
        id: "demonstrationId" in application ? application.demonstrationId : application.id,
      },
      include: {
        state: true,
        demonstrationRoleAssignments: {
          where: {
            OR: [
              { roleId: { in: Array.from(CMS_USER_DEMONSTRATION_ROLES) } },
              { personTypeId: "demos-admin" },
            ],
          },
          include: { person: true },
        },
      },
    });
    const recipients = new Map<string, { personId: string; name: string; address: string }>();
    for (const { person } of demonstration.demonstrationRoleAssignments) {
      const address = person.email.trim().toLowerCase();
      if (!z.email().safeParse(address).success) {
        throw new Error(
          `Cannot queue ${emailType} email for application ${application.id}: ` +
            `person ${person.id} does not have a valid email address.`
        );
      }
      if (!recipients.has(address)) {
        recipients.set(address, {
          personId: person.id,
          name: `${person.firstName} ${person.lastName}`.trim(),
          address,
        });
      }
    }
    if (recipients.size === 0) {
      throw new Error(
        `Cannot queue ${emailType} email for application ${application.id}: ` +
          "no CMS or Admin contacts were found on the demonstration."
      );
    }
    const contacts = Array.from(recipients.values());
    await enqueueAndTrackRealtimeEmail(
      {
        emailType,
        entityType: "application",
        entityId: application.id,
        triggeredBy: { type: "realtime", id: triggeredByUserId },
        payload: {
          recipients: {
            to: [],
            bcc: contacts.map(({ name, address }) => ({ name, address })),
          },
          demonstration: {
            id: demonstration.id,
            name: demonstration.name,
            stateName: demonstration.state.name,
          },
          application: {
            id: application.id,
            name: application.name,
            applicationTypeId: applicationType,
            statusId: application.statusId,
            statusUpdatedAt: application.statusUpdatedAt.toISOString(),
          },
        },
      },
      { applicationId: application.id, applicationTypeId: applicationType },
      contacts.map(({ personId }) => ({ personId }))
    );
  } catch (error) {
    log.error(
      { error, applicationId: application.id, emailType },
      "Failed to queue application email"
    );
  }
}
