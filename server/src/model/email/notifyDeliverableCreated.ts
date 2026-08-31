import { CMS_USER_DEMONSTRATION_ROLES } from "../../constants";
import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueEmail } from "../../services/emailQueue";

type NotifyDeliverableCreatedInput = {
  deliverableId: string;
  sourceActionId: string;
  triggeredByUserId: string;
};

type Recipient = {
  name: string;
  address: string;
};

export async function notifyDeliverableCreated(
  input: NotifyDeliverableCreatedInput,
): Promise<void> {
  try {
    const deliverable = await prisma().deliverable.findUniqueOrThrow({
      where: { id: input.deliverableId },
      include: {
        cmsOwner: { include: { person: true } },
        demonstration: {
          include: {
            demonstrationRoleAssignments: {
              where: {
                roleId: { in: Array.from(CMS_USER_DEMONSTRATION_ROLES) },
              },
              include: { person: true },
            },
          },
        },
      },
    });
    const recipients = deduplicateRecipients([
      deliverable.cmsOwner.person,
      ...deliverable.demonstration.demonstrationRoleAssignments.map(
        (assignment) => assignment.person,
      ),
    ]);

    const messageId = await enqueueEmail({
      emailType: "Deliverable Created",
      entityType: "deliverable",
      entityId: deliverable.id,
      triggeredBy: {
        type: "realtime",
        id: input.triggeredByUserId,
      },
      triggeredAt: new Date().toISOString(),
      idempotencyKey: `Deliverable Created:deliverable-action:${input.sourceActionId}`,
      payload: {
        recipients: {
          to: [],
          bcc: recipients,
        },
        demonstration: {
          id: deliverable.demonstration.id,
          name: deliverable.demonstration.name,
          stateId: deliverable.demonstration.stateId,
        },
        deliverable: {
          id: deliverable.id,
          name: deliverable.name,
          deliverableTypeId: deliverable.deliverableTypeId,
          dueDate: deliverable.dueDate.toISOString(),
          statusId: deliverable.statusId,
        },
      },
    });

    log.info(
      {
        messageId,
        deliverableId: deliverable.id,
        emailType: "Deliverable Created",
      },
      "Deliverable email queued",
    );
  } catch (error) {
    log.error(
      {
        error,
        deliverableId: input.deliverableId,
        emailType: "Deliverable Created",
      },
      "Failed to queue deliverable email",
    );
  }
}

function deduplicateRecipients(
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>,
): Recipient[] {
  const recipients = new Map<string, Recipient>();

  for (const person of people) {
    const address = person.email.trim();
    if (!address) {
      throw new Error(
        `Cannot queue Deliverable Created email: person ${person.id} has no email address.`,
      );
    }

    const normalizedAddress = address.toLowerCase();
    if (!recipients.has(normalizedAddress)) {
      recipients.set(normalizedAddress, {
        name: `${person.firstName} ${person.lastName}`.trim(),
        address,
      });
    }
  }

  return Array.from(recipients.values());
}
